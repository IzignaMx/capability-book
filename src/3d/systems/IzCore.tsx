import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  EdgesGeometry,
  LineBasicMaterial,
  MathUtils,
  MeshStandardMaterial
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { QualityProfile } from "../quality/RenderQualityController";
import { TelemetryRing } from "./TelemetryRing";

export interface IzCoreProps {
  readonly assembly: number;
  readonly energy: number;
  readonly quality: QualityProfile;
}

type VectorTuple = [number, number, number];

interface CoreModuleDefinition {
  readonly id: string;
  readonly finalPosition: VectorTuple;
  readonly dispersedPosition: VectorTuple;
  readonly dimensions: VectorTuple;
  readonly finalRotation: number;
  readonly dispersedRotation: number;
}

interface CoreModuleTransform {
  readonly id: string;
  readonly position: VectorTuple;
  readonly scale: VectorTuple;
  readonly rotation: VectorTuple;
}

export const DEFAULT_ENERGY_COLOR = "#3b82f6";

const CARBON_COLOR = "#1b1b1d";
const TELEMETRY_COLOR = "#22d3ee";

const MODULES: readonly CoreModuleDefinition[] = [
  {
    id: "i-spine",
    finalPosition: [-0.62, 0, 0],
    dispersedPosition: [-1.8, 1.35, -0.7],
    dimensions: [0.24, 1.64, 0.3],
    finalRotation: 0,
    dispersedRotation: -0.34
  },
  {
    id: "z-top",
    finalPosition: [0.28, 0.69, 0],
    dispersedPosition: [1.62, 1.44, 0.58],
    dimensions: [1.24, 0.23, 0.3],
    finalRotation: 0,
    dispersedRotation: 0.42
  },
  {
    id: "z-diagonal",
    finalPosition: [0.28, 0, 0],
    dispersedPosition: [1.72, 0.04, -0.74],
    dimensions: [1.48, 0.23, 0.3],
    finalRotation: -0.76,
    dispersedRotation: -1.28
  },
  {
    id: "z-bottom",
    finalPosition: [0.28, -0.69, 0],
    dispersedPosition: [1.42, -1.5, 0.64],
    dimensions: [1.24, 0.23, 0.3],
    finalRotation: 0,
    dispersedRotation: -0.38
  }
];

const GEOMETRY_SEGMENTS: Record<QualityProfile, number> = {
  low: 2,
  medium: 3,
  high: 4
};

const RING_SEGMENTS: Record<QualityProfile, readonly number[]> = {
  low: [28],
  medium: [36, 44],
  high: [40, 52, 64]
};

function normalizeUnitInterval(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function createIzCoreTransforms(assembly: number): CoreModuleTransform[] {
  const normalizedAssembly = normalizeUnitInterval(assembly);

  return MODULES.map((module) => ({
    id: module.id,
    position: [
      MathUtils.lerp(module.dispersedPosition[0], module.finalPosition[0], normalizedAssembly),
      MathUtils.lerp(module.dispersedPosition[1], module.finalPosition[1], normalizedAssembly),
      MathUtils.lerp(module.dispersedPosition[2], module.finalPosition[2], normalizedAssembly)
    ],
    scale: module.dimensions,
    rotation: [
      0,
      0,
      MathUtils.lerp(module.dispersedRotation, module.finalRotation, normalizedAssembly)
    ]
  }));
}

export function IzCore({ assembly, energy, quality }: IzCoreProps) {
  const invalidate = useThree((state) => state.invalidate);
  const normalizedAssembly = normalizeUnitInterval(assembly);
  const normalizedEnergy = normalizeUnitInterval(energy);
  const transforms = createIzCoreTransforms(normalizedAssembly);
  const moduleGeometry = useMemo(
    () => new RoundedBoxGeometry(1, 1, 1, GEOMETRY_SEGMENTS[quality], 0.1),
    [quality]
  );
  const edgeGeometry = useMemo(
    () => new EdgesGeometry(moduleGeometry, 24),
    [moduleGeometry]
  );
  const carbonMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: CARBON_COLOR,
        emissive: DEFAULT_ENERGY_COLOR,
        emissiveIntensity: normalizedEnergy * 0.42,
        metalness: 0.36,
        roughness: 0.78
      }),
    []
  );
  const energyMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: DEFAULT_ENERGY_COLOR,
        transparent: true,
        opacity: 0.34 + normalizedEnergy * 0.66,
        toneMapped: false
      }),
    []
  );

  useEffect(() => {
    carbonMaterial.emissiveIntensity = normalizedEnergy * 0.42;
    carbonMaterial.needsUpdate = true;
    energyMaterial.opacity = 0.34 + normalizedEnergy * 0.66;
    energyMaterial.needsUpdate = true;
    invalidate();
  }, [carbonMaterial, energyMaterial, invalidate, normalizedEnergy]);

  useEffect(
    () => () => {
      edgeGeometry.dispose();
      moduleGeometry.dispose();
    },
    [edgeGeometry, moduleGeometry]
  );

  useEffect(
    () => () => {
      carbonMaterial.dispose();
      energyMaterial.dispose();
    },
    [carbonMaterial, energyMaterial]
  );

  return (
    <group scale={0.88 + normalizedAssembly * 0.12}>
      {transforms.map((transform) => (
        <group
          key={transform.id}
          position={transform.position}
          rotation={transform.rotation}
          scale={transform.scale}
        >
          <mesh
            geometry={moduleGeometry}
            material={carbonMaterial}
            dispose={null}
          />
          <lineSegments
            geometry={edgeGeometry}
            material={energyMaterial}
            scale={1.018}
            dispose={null}
          />
        </group>
      ))}

      {RING_SEGMENTS[quality].map((segments, index) => (
        <group
          key={segments}
          rotation={[
            Math.PI * (0.16 + index * 0.14),
            Math.PI * (0.28 + index * 0.11),
            index * 0.42
          ]}
        >
          <TelemetryRing
            radius={1.24 + index * 0.24}
            progress={(normalizedEnergy + index * 0.19) % 1}
            segments={segments}
            color={index === 0 ? TELEMETRY_COLOR : DEFAULT_ENERGY_COLOR}
          />
        </group>
      ))}
    </group>
  );
}

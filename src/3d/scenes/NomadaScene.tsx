import { Line, PerspectiveCamera } from "@react-three/drei";
import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  CatmullRomCurve3,
  SRGBColorSpace,
  TextureLoader,
  Vector3
} from "three";
import type { QualityProfile } from "../quality/RenderQualityController";

export interface NomadaSceneProps {
  readonly progress: number;
  readonly quality: QualityProfile;
}

export const NOMADA_CHECKPOINTS = [
  [-2.7, -1.25, 0.2],
  [-2.05, 0.45, -0.35],
  [-1.2, 1.2, 0.25],
  [-0.15, 0.35, 0.45],
  [0.8, -0.72, -0.15],
  [1.75, 0.15, 0.28],
  [2.65, 1.18, -0.1]
] as const;

export interface NomadaSceneState {
  readonly route: number;
  readonly checkpoints: number;
  readonly resultSignal: number;
  readonly card: number;
  readonly visibleCheckpoints: number;
  readonly routeSegments: number;
  readonly posterTexture: boolean;
}

const NOMADA_POSTER = "/media/projects/hamburguesa-nomada/poster.avif";
const MAX_CHECKPOINTS: Record<QualityProfile, number> = {
  low: 4,
  medium: 6,
  high: NOMADA_CHECKPOINTS.length
};
const ROUTE_SEGMENTS: Record<QualityProfile, number> = {
  low: 24,
  medium: 40,
  high: 64
};

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

function progressWithin(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

function createRouteCurve(): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    NOMADA_CHECKPOINTS.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    "centripetal"
  );
}

export function resolveNomadaSceneState(
  progress: number,
  quality: QualityProfile
): NomadaSceneState {
  const normalized = normalizeProgress(progress);
  const checkpoints = progressWithin(normalized, 0.2, 0.66);
  const checkpointLimit = MAX_CHECKPOINTS[quality];

  return {
    route: progressWithin(normalized, 0, 0.58),
    checkpoints,
    resultSignal: progressWithin(normalized, 0.58, 0.82),
    card: progressWithin(normalized, 0.78, 1),
    visibleCheckpoints: Math.min(
      checkpointLimit,
      Math.ceil(checkpoints * checkpointLimit)
    ),
    routeSegments: ROUTE_SEGMENTS[quality],
    posterTexture: quality !== "low"
  };
}

export function resolveNomadaRoutePoints(
  progress: number,
  segments: number
): [number, number, number][] {
  const normalized = normalizeProgress(progress);
  const segmentCount = Number.isFinite(segments)
    ? Math.min(96, Math.max(4, Math.floor(segments)))
    : 4;
  const points = createRouteCurve().getSpacedPoints(segmentCount);
  const visibleCount = Math.max(2, Math.ceil(normalized * segmentCount) + 1);
  const visible = points.slice(0, visibleCount);

  if (normalized === 0 && visible[0] !== undefined) visible[1] = visible[0].clone();
  return visible.map(({ x, y, z }) => [x, y, z]);
}

function TexturedRecognitionCard({ progress }: { readonly progress: number }) {
  const texture = useLoader(TextureLoader, NOMADA_POSTER);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    invalidate();
  }, [invalidate, texture]);

  return (
    <mesh>
      <planeGeometry args={[1.48, 0.83]} />
      <meshBasicMaterial
        map={texture}
        color="#ffffff"
        transparent
        opacity={progress}
        toneMapped={false}
      />
    </mesh>
  );
}

function ProceduralRecognitionCard({ progress }: { readonly progress: number }) {
  return (
    <mesh>
      <planeGeometry args={[1.48, 0.83]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.35 + progress * 0.65}
        toneMapped={false}
      />
    </mesh>
  );
}

export function NomadaScene({ progress, quality }: NomadaSceneProps) {
  const state = resolveNomadaSceneState(progress, quality);
  const route = useMemo(() => createRouteCurve(), []);
  const fullRoutePoints = useMemo(
    () => route.getSpacedPoints(state.routeSegments).map(({ x, y, z }) => [x, y, z] as const),
    [route, state.routeSegments]
  );
  const activeRoutePoints = useMemo(
    () => resolveNomadaRoutePoints(state.route, state.routeSegments),
    [state.route, state.routeSegments]
  );
  const resultPosition = route.getPointAt(state.resultSignal);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.3, 7.2]} fov={43} />
      <ambientLight intensity={0.74} color="#bfdbfe" />
      <directionalLight position={[3.5, 4.5, 5.2]} intensity={1.45} color="#ffffff" />

      <Line
        points={fullRoutePoints}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.14}
      />
      <Line
        points={activeRoutePoints}
        color="#22d3ee"
        lineWidth={quality === "high" ? 2 : 1.25}
        transparent
        opacity={0.82}
      />

      {NOMADA_CHECKPOINTS.slice(0, state.visibleCheckpoints).map((position, index) => (
        <group
          key={index}
          name={`checkpoint-${index + 1}`}
          userData={{ checkpoint: index + 1 }}
          position={position}
          scale={0.76 + state.checkpoints * 0.24}
        >
          <mesh>
            <sphereGeometry args={[0.11, quality === "low" ? 8 : 12, 10]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#22d3ee" : "#2dd4bf"}
              toneMapped={false}
            />
          </mesh>
          <mesh scale={1.75}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={0.1 + state.checkpoints * 0.12}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[resultPosition.x, resultPosition.y, resultPosition.z]}>
        <octahedronGeometry args={[0.11 + state.resultSignal * 0.06, 0]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={state.resultSignal}
          toneMapped={false}
        />
      </mesh>

      <group
        visible={state.card > 0}
        position={[1.15 + state.card * 0.65, -0.3 + state.card * 0.55, 0.22]}
        rotation={[0, -0.28 + state.card * 0.14, -0.04]}
        scale={Math.max(0.001, state.card)}
      >
        <mesh position={[0, 0, -0.04]} scale={1.08}>
          <planeGeometry args={[1.48, 0.83]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {state.posterTexture ? (
          <TexturedRecognitionCard progress={state.card} />
        ) : (
          <ProceduralRecognitionCard progress={state.card} />
        )}
      </group>
    </>
  );
}

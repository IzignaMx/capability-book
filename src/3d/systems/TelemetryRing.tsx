import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";

export interface TelemetryRingProps {
  readonly radius: number;
  readonly progress: number;
  readonly segments: number;
  readonly color: string;
}

export interface TelemetryTransforms {
  readonly count: number;
  readonly matrices: Float32Array;
}

const MIN_SEGMENTS = 3;
const MAX_SEGMENTS = 256;

export function normalizeTelemetrySegments(segments: number): number {
  if (!Number.isFinite(segments)) return MIN_SEGMENTS;
  return Math.min(MAX_SEGMENTS, Math.max(MIN_SEGMENTS, Math.floor(segments)));
}

export function normalizeTelemetryProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

function normalizeRadius(radius: number): number {
  if (!Number.isFinite(radius)) return 0;
  return Math.max(0, Math.abs(radius));
}

export function createTelemetryTransforms(
  radius: number,
  segments: number,
  progress: number
): TelemetryTransforms {
  const count = normalizeTelemetrySegments(segments);
  const ringRadius = normalizeRadius(radius);
  const normalizedProgress = normalizeTelemetryProgress(progress);
  const matrices = new Float32Array(count * 16);
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const axis = new Vector3(0, 0, 1);

  for (let index = 0; index < count; index += 1) {
    const ratio = index / count;
    const angle = ratio * Math.PI * 2;
    const wrappedDistance = Math.abs(((ratio - normalizedProgress + 1.5) % 1) - 0.5) * 2;
    const pulse = 1 + Math.pow(1 - wrappedDistance, 8) * 1.6;

    position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
    rotation.setFromAxisAngle(axis, angle);
    scale.set(0.72 * pulse, pulse, 1);
    matrix.compose(position, rotation, scale);
    matrix.toArray(matrices, index * 16);
  }

  return { count, matrices };
}

export function TelemetryRing({
  radius,
  progress,
  segments,
  color
}: TelemetryRingProps) {
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const transforms = useMemo(
    () => createTelemetryTransforms(radius, segments, progress),
    [progress, radius, segments]
  );

  useEffect(() => {
    if (mesh.current === null) return;

    const matrix = new Matrix4();
    for (let index = 0; index < transforms.count; index += 1) {
      matrix.fromArray(transforms.matrices, index * 16);
      mesh.current.setMatrixAt(index, matrix);
    }

    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [invalidate, transforms]);

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, transforms.count]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.045, 0.14, 0.025]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.82}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

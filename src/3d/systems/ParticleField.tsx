import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, Color } from "three";
import type { QualityProfile } from "../quality/RenderQualityController";

export interface ParticleFieldProps {
  readonly count: number;
  readonly seed: number;
  readonly radius: number;
  readonly collapse: number;
  readonly quality: QualityProfile;
  readonly color?: string;
}

export interface ParticleGenerationOptions {
  readonly count: number;
  readonly seed: number;
  readonly radius: number;
  readonly quality: QualityProfile;
}

const PARTICLE_CAP_BY_QUALITY: Record<QualityProfile, number> = {
  low: 800,
  medium: 2_000,
  high: 5_000
};

const DEFAULT_PARTICLE_COLOR = "#22d3ee";
const UINT32_RANGE = 4_294_967_296;

const vertexShader = /* glsl */ `
  uniform float uCollapse;

  void main() {
    vec3 direction = normalize(position + vec3(0.00001));
    vec3 collapseTarget = direction * 0.18;
    vec3 transformed = mix(position, collapseTarget, uCollapse);
    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(2.4 * (220.0 / max(1.0, -viewPosition.z)), 1.25, 7.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.32, 0.5, distanceFromCenter);
    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(uColor, alpha * 0.86);
  }
`;

function normalizeUnitInterval(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 0;
  return Math.trunc(seed) >>> 0;
}

function normalizeRadius(radius: number): number {
  if (!Number.isFinite(radius) || radius <= 0) return 0;
  return radius;
}

function createSeededRandom(seed: number): () => number {
  let state = normalizeSeed(seed);

  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
    return state / UINT32_RANGE;
  };
}

export function clampParticleCount(
  count: number,
  quality: QualityProfile
): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(Math.floor(count), PARTICLE_CAP_BY_QUALITY[quality]);
}

export function generateParticlePositions({
  count,
  seed,
  radius,
  quality
}: ParticleGenerationOptions): Float32Array {
  const particleCount = clampParticleCount(count, quality);
  const fieldRadius = normalizeRadius(radius);
  const random = createSeededRandom(seed);
  const positions = new Float32Array(particleCount * 3);

  for (let index = 0; index < particleCount; index += 1) {
    const azimuth = random() * Math.PI * 2;
    const vertical = random() * 2 - 1;
    const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    const distance = Math.cbrt(random()) * fieldRadius;
    const offset = index * 3;

    positions[offset] = Math.cos(azimuth) * horizontal * distance;
    positions[offset + 1] = vertical * distance;
    positions[offset + 2] = Math.sin(azimuth) * horizontal * distance;
  }

  return positions;
}

export function ParticleField({
  count,
  seed,
  radius,
  collapse,
  quality,
  color = DEFAULT_PARTICLE_COLOR
}: ParticleFieldProps) {
  const invalidate = useThree((state) => state.invalidate);
  const positions = useMemo(
    () => generateParticlePositions({ count, seed, radius, quality }),
    [count, quality, radius, seed]
  );
  const uniforms = useMemo(
    () => ({
      uCollapse: { value: normalizeUnitInterval(collapse) },
      uColor: { value: new Color(color) }
    }),
    []
  );

  useEffect(() => {
    uniforms.uCollapse.value = normalizeUnitInterval(collapse);
    invalidate();
  }, [collapse, invalidate, uniforms]);

  useEffect(() => {
    uniforms.uColor.value.set(color);
    invalidate();
  }, [color, invalidate, uniforms]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

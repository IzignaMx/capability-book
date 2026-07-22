import { PerspectiveCamera } from "@react-three/drei";
import type { QualityProfile } from "../quality/RenderQualityController";
import { IzCore } from "../systems/IzCore";
import { ParticleField } from "../systems/ParticleField";
import { TelemetryRing } from "../systems/TelemetryRing";

export interface HeroSignalSceneProps {
  readonly progress: number;
  readonly quality: QualityProfile;
}

export interface HeroSignalState {
  readonly signal: number;
  readonly particleCollapse: number;
  readonly corePresence: number;
  readonly assembly: number;
  readonly energy: number;
  readonly connectionPorts: number;
}

const PARTICLES_BY_QUALITY: Record<QualityProfile, number> = {
  low: 800,
  medium: 2_000,
  high: 5_000
};

const TELEMETRY_SEGMENTS_BY_QUALITY: Record<QualityProfile, number> = {
  low: 28,
  medium: 44,
  high: 64
};

const CONNECTION_PORTS = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2;
  return [Math.cos(angle) * 1.9, Math.sin(angle) * 1.9, 0] as const;
});

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

function progressWithin(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

export function resolveHeroSignalState(progress: number): HeroSignalState {
  const normalized = normalizeProgress(progress);
  const signal = progressWithin(normalized, 0, 0.22);
  const particleCollapse = progressWithin(normalized, 0.22, 0.48);
  const corePresence = progressWithin(normalized, 0.4, 0.48);
  const assembly = progressWithin(normalized, 0.48, 0.78);
  const connectionPorts = progressWithin(normalized, 0.78, 1);
  const energy = Math.min(
    1,
    signal * 0.16 + particleCollapse * 0.2 + assembly * 0.36 + connectionPorts * 0.28
  );

  return {
    signal,
    particleCollapse,
    corePresence,
    assembly,
    energy,
    connectionPorts
  };
}

export function HeroSignalScene({ progress, quality }: HeroSignalSceneProps) {
  const state = resolveHeroSignalState(progress);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6.4]} fov={42} />
      <ambientLight intensity={0.72} color="#93c5fd" />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#ffffff" />

      <ParticleField
        count={PARTICLES_BY_QUALITY[quality]}
        seed={2_607_2026}
        radius={3.8}
        collapse={state.particleCollapse}
        quality={quality}
      />

      <group
        rotation={[Math.PI * 0.14, Math.PI * 0.08, 0]}
        scale={0.78 + state.signal * 0.22}
      >
        <TelemetryRing
          radius={2.58}
          progress={state.signal}
          segments={TELEMETRY_SEGMENTS_BY_QUALITY[quality]}
          color="#22d3ee"
        />
      </group>

      <group visible={state.corePresence > 0} scale={Math.max(0.001, state.corePresence)}>
        <IzCore assembly={state.assembly} energy={state.energy} quality={quality} />
      </group>

      <group visible={state.connectionPorts > 0}>
        {CONNECTION_PORTS.map((position, index) => (
          <mesh key={index} position={position} scale={0.45 + state.connectionPorts * 0.55}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#3b82f6" : "#22d3ee"}
              transparent
              opacity={state.connectionPorts}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

import { Line, PerspectiveCamera } from "@react-three/drei";
import { AdditiveBlending } from "three";
import type { QualityProfile } from "../quality/RenderQualityController";
import { ParticleField } from "../systems/ParticleField";
import { TelemetryRing } from "../systems/TelemetryRing";

export interface OmniSyncSceneProps {
  readonly progress: number;
  readonly quality: QualityProfile;
}

export const OMNISYNC_CHANNELS = [
  { id: "storefront", position: [-2.35, 1.15, 0.2], color: "#60a5fa" },
  { id: "marketplace", position: [2.35, 1.05, -0.15], color: "#22d3ee" },
  { id: "fulfillment", position: [-2.15, -1.35, -0.3], color: "#14b8a6" },
  { id: "operations", position: [2.2, -1.3, 0.25], color: "#67e8f9" }
] as const;

export type OmniSyncChannelId = (typeof OMNISYNC_CHANNELS)[number]["id"];

export interface OmniSyncQualityState {
  readonly satelliteCount: 2 | 4;
  readonly trails: boolean;
  readonly glow: boolean;
  readonly queueParticles: number;
}

export interface OmniSyncSceneState {
  readonly core: number;
  readonly satellites: number;
  readonly stockPulse: number;
  readonly shield: number;
  readonly pricePulse: number;
  readonly queue: number;
  readonly visibleChannelIds: readonly OmniSyncChannelId[];
  readonly quality: OmniSyncQualityState;
}

const QUALITY_STATE: Record<QualityProfile, OmniSyncQualityState> = {
  low: { satelliteCount: 2, trails: false, glow: false, queueParticles: 0 },
  medium: { satelliteCount: 4, trails: true, glow: true, queueParticles: 0 },
  high: { satelliteCount: 4, trails: true, glow: true, queueParticles: 320 }
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

function visibleChannelIds(progress: number, quality: QualityProfile): OmniSyncChannelId[] {
  if (quality !== "low") return OMNISYNC_CHANNELS.map(({ id }) => id);

  const pairOffset = progress < 0.5 ? 0 : 2;
  return OMNISYNC_CHANNELS.slice(pairOffset, pairOffset + 2).map(({ id }) => id);
}

export function resolveOmniSyncSceneState(
  progress: number,
  quality: QualityProfile
): OmniSyncSceneState {
  const normalized = normalizeProgress(progress);

  return {
    core: progressWithin(normalized, 0, 0.16),
    satellites: progressWithin(normalized, 0.12, 0.34),
    stockPulse: progressWithin(normalized, 0.28, 0.68),
    shield: progressWithin(normalized, 0.45, 0.62),
    pricePulse: progressWithin(normalized, 0.55, 0.72) * 0.34,
    queue: progressWithin(normalized, 0.66, 1),
    visibleChannelIds: visibleChannelIds(normalized, quality),
    quality: QUALITY_STATE[quality]
  };
}

function scaledPosition(
  position: readonly [number, number, number],
  progress: number
): [number, number, number] {
  return [position[0] * progress, position[1] * progress, position[2] * progress];
}

export function OmniSyncScene({ progress, quality }: OmniSyncSceneProps) {
  const state = resolveOmniSyncSceneState(progress, quality);
  const visibleChannels = OMNISYNC_CHANNELS.filter(({ id }) =>
    state.visibleChannelIds.includes(id)
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.35, 7.1]} fov={43} />
      <ambientLight intensity={0.66} color="#bfdbfe" />
      <directionalLight position={[3.8, 4.5, 5.5]} intensity={1.55} color="#ffffff" />

      <group scale={Math.max(0.001, state.core)}>
        <mesh>
          <icosahedronGeometry args={[0.78, quality === "high" ? 2 : 1]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#3b82f6"
            emissiveIntensity={0.5 + state.stockPulse * 0.6}
            metalness={0.5}
            roughness={0.42}
          />
        </mesh>
        <mesh scale={1.08 + state.stockPulse * 0.08}>
          <icosahedronGeometry args={[0.78, 1]} />
          <meshBasicMaterial
            color="#22d3ee"
            wireframe
            transparent
            opacity={0.34}
            toneMapped={false}
          />
        </mesh>

        {state.quality.glow && (
          <mesh scale={1.22 + state.stockPulse * 0.08}>
            <sphereGeometry args={[0.78, 20, 16]} />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={quality === "high" ? 0.12 : 0.07}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}

        <TelemetryRing
          radius={1.12}
          progress={state.queue}
          segments={quality === "low" ? 24 : quality === "medium" ? 40 : 56}
          color="#22d3ee"
        />
      </group>

      <group visible={state.shield > 0} scale={0.72 + state.shield * 0.28}>
        <mesh>
          <icosahedronGeometry args={[1.18, quality === "high" ? 2 : 1]} />
          <meshBasicMaterial
            color="#2dd4bf"
            transparent
            opacity={0.08 + state.shield * 0.14}
            wireframe
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={scaledPosition(OMNISYNC_CHANNELS[0].position, state.pricePulse)}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshBasicMaterial color="#2dd4bf" toneMapped={false} />
        </mesh>
      </group>

      {visibleChannels.map((channel, index) => (
        <group key={channel.id}>
          {state.quality.trails && (
            <Line
              points={[[0, 0, 0], channel.position]}
              color={channel.color}
              lineWidth={quality === "high" ? 1.5 : 1}
              transparent
              opacity={0.18 + state.stockPulse * 0.36}
            />
          )}

          <group
            name={channel.id}
            userData={{ channelId: channel.id }}
            position={channel.position}
            scale={Math.max(0.001, state.satellites)}
          >
            <mesh rotation={[0.2 * index, 0.35 * index, 0.15 * index]}>
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial
                color="#111827"
                emissive={channel.color}
                emissiveIntensity={0.68}
                metalness={0.38}
                roughness={0.5}
              />
            </mesh>
            <mesh scale={1.18}>
              <octahedronGeometry args={[0.32, 0]} />
              <meshBasicMaterial
                color={channel.color}
                wireframe
                transparent
                opacity={0.45}
                toneMapped={false}
              />
            </mesh>
          </group>

          <mesh position={scaledPosition(channel.position, state.stockPulse)}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshBasicMaterial color={channel.color} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {state.quality.queueParticles > 0 && state.queue > 0 && (
        <ParticleField
          count={state.quality.queueParticles}
          seed={9_2026}
          radius={1.52}
          collapse={1 - state.queue * 0.7}
          quality={quality}
          color="#60a5fa"
        />
      )}
    </>
  );
}

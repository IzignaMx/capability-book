import { PerspectiveCamera } from "@react-three/drei";
import type { QualityProfile } from "../quality/RenderQualityController";
import { IzCore } from "../systems/IzCore";

export interface CapabilityOrbitSceneProps {
  readonly progress: number;
  readonly quality: QualityProfile;
}

export const CAPABILITY_ORBITS = [
  {
    id: "web-experiences",
    radius: 2.15,
    speed: 0.78,
    phase: 0.08,
    inclination: 0.18,
    lift: 0.22,
    color: "#60a5fa"
  },
  {
    id: "commerce-systems",
    radius: 2.46,
    speed: -0.62,
    phase: 0.24,
    inclination: -0.32,
    lift: 0.14,
    color: "#22d3ee"
  },
  {
    id: "ai-automation",
    radius: 2.78,
    speed: 1.08,
    phase: 0.4,
    inclination: 0.43,
    lift: 0.34,
    color: "#14b8a6"
  },
  {
    id: "data-visualization",
    radius: 3.04,
    speed: -0.9,
    phase: 0.57,
    inclination: -0.16,
    lift: 0.27,
    color: "#3b82f6"
  },
  {
    id: "developer-products",
    radius: 3.32,
    speed: 0.54,
    phase: 0.73,
    inclination: 0.29,
    lift: 0.18,
    color: "#67e8f9"
  },
  {
    id: "impact-technology",
    radius: 3.58,
    speed: -1.18,
    phase: 0.9,
    inclination: -0.4,
    lift: 0.31,
    color: "#2dd4bf"
  }
] as const;

export type CapabilityOrbitId = (typeof CAPABILITY_ORBITS)[number]["id"];

export interface CapabilityOrbitTransform {
  readonly id: CapabilityOrbitId;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
}

const ORBIT_SEGMENTS_BY_QUALITY: Record<QualityProfile, number> = {
  low: 48,
  medium: 72,
  high: 96
};

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

export function resolveCapabilityOrbitTransforms(
  progress: number
): CapabilityOrbitTransform[] {
  const normalized = normalizeProgress(progress);

  return CAPABILITY_ORBITS.map((capability, index) => {
    const angle = (capability.phase + normalized * capability.speed) * Math.PI * 2;
    const depth = Math.sin(angle * (1.2 + index * 0.07)) * capability.radius * 0.28;
    const vertical =
      Math.sin(angle + capability.phase * Math.PI) * capability.lift +
      Math.sin(capability.inclination) * capability.radius * 0.38;

    return {
      id: capability.id,
      position: [
        Math.cos(angle) * capability.radius,
        vertical,
        depth
      ],
      rotation: [
        angle * 0.36 + capability.inclination,
        angle + index * 0.2,
        capability.inclination
      ]
    };
  });
}

function CapabilityBody({ index, color }: { readonly index: number; readonly color: string }) {
  const material = <meshStandardMaterial color="#0f172a" emissive={color} emissiveIntensity={0.72} metalness={0.42} roughness={0.5} />;

  if (index % 3 === 0) {
    return (
      <mesh>
        <icosahedronGeometry args={[0.16, 1]} />
        {material}
      </mesh>
    );
  }

  if (index % 3 === 1) {
    return (
      <mesh>
        <octahedronGeometry args={[0.18, 0]} />
        {material}
      </mesh>
    );
  }

  return (
    <mesh>
      <dodecahedronGeometry args={[0.16, 0]} />
      {material}
    </mesh>
  );
}

export function CapabilityOrbitScene({ progress, quality }: CapabilityOrbitSceneProps) {
  const transforms = resolveCapabilityOrbitTransforms(progress);
  const orbitSegments = ORBIT_SEGMENTS_BY_QUALITY[quality];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.3, 8.2]} fov={44} />
      <ambientLight intensity={0.68} color="#bfdbfe" />
      <directionalLight position={[4, 5, 6]} intensity={1.65} color="#ffffff" />

      <group scale={0.72}>
        <IzCore assembly={1} energy={0.74 + progress * 0.26} quality={quality} />
      </group>

      {CAPABILITY_ORBITS.map((capability, index) => {
        const transform = transforms[index];
        if (transform === undefined) return null;

        return (
          <group key={capability.id}>
            <mesh rotation={[Math.PI / 2 + capability.inclination, 0, 0]}>
              <torusGeometry args={[capability.radius, 0.008, 3, orbitSegments]} />
              <meshBasicMaterial
                color={capability.color}
                transparent
                opacity={0.18}
                toneMapped={false}
              />
            </mesh>

            <group
              name={capability.id}
              userData={{ capabilityId: capability.id }}
              position={transform.position}
              rotation={transform.rotation}
            >
              <CapabilityBody index={index} color={capability.color} />
              <pointLight color={capability.color} intensity={0.34} distance={1.2} />
            </group>
          </group>
        );
      })}
    </>
  );
}

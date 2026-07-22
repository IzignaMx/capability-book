import { describe, expect, it } from "vitest";
import type { SceneDescriptor } from "../../src/3d/core/ExperienceScene";
import { SceneRegistry } from "../../src/3d/core/SceneRegistry";

function sceneDescriptor(id: string): SceneDescriptor {
  return {
    id,
    load: async () => ({}) as never,
    minQuality: "low",
    fallbackPoster: `/media/explore/${id}.avif`,
    supportsReducedMotion: false
  };
}

describe("SceneRegistry", () => {
  it("rejects duplicate scene IDs and resolves registered descriptors", () => {
    const registry = new SceneRegistry();
    const descriptor = sceneDescriptor("hero-signal");

    registry.register(descriptor);

    expect(registry.get("hero-signal")).toBe(descriptor);
    expect(() => registry.register(descriptor)).toThrow("Duplicate scene ID: hero-signal");
  });

  it("returns a stable snapshot in registration order", () => {
    const registry = new SceneRegistry();
    const hero = sceneDescriptor("hero-signal");
    const capabilities = sceneDescriptor("capability-orbits");

    registry.register(hero);
    registry.register(capabilities);

    const snapshot = registry.list();
    snapshot.pop();

    expect(registry.get("unknown")).toBeNull();
    expect(registry.list()).toEqual([hero, capabilities]);
  });
});

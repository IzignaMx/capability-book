import { describe, expect, it, vi } from "vitest";
import type {
  ExperienceScene,
  SceneDescriptor,
  SceneLoadContext,
  SceneMountContext,
  Viewport
} from "../../src/3d/core/ExperienceScene";
import { SceneRuntime } from "../../src/3d/core/SceneRuntime";

interface SceneHarness {
  readonly scene: ExperienceScene;
  readonly preload: ReturnType<typeof vi.fn<(context: SceneLoadContext) => Promise<void>>>;
  readonly mount: ReturnType<typeof vi.fn<(context: SceneMountContext) => void>>;
  readonly update: ReturnType<typeof vi.fn<(progress: number) => void>>;
  readonly resize: ReturnType<typeof vi.fn<(viewport: Viewport) => void>>;
  readonly suspend: ReturnType<typeof vi.fn<() => void>>;
  readonly resume: ReturnType<typeof vi.fn<() => void>>;
  readonly dispose: ReturnType<typeof vi.fn<() => void>>;
}

function sceneHarness(): SceneHarness {
  const preload = vi.fn(async (_context: SceneLoadContext) => undefined);
  const mount = vi.fn((_context: SceneMountContext) => undefined);
  const update = vi.fn((_progress: number) => undefined);
  const resize = vi.fn((_viewport: Viewport) => undefined);
  const suspend = vi.fn(() => undefined);
  const resume = vi.fn(() => undefined);
  const dispose = vi.fn(() => undefined);

  return {
    scene: { preload, mount, update, resize, suspend, resume, dispose },
    preload,
    mount,
    update,
    resize,
    suspend,
    resume,
    dispose
  };
}

function descriptor(
  id: string,
  load: () => Promise<ExperienceScene>
): SceneDescriptor {
  return {
    id,
    load,
    minQuality: "low",
    fallbackPoster: `/media/explore/${id}.avif`,
    supportsReducedMotion: false
  };
}

describe("SceneRuntime", () => {
  it("loads, preloads, mounts and controls an active scene", async () => {
    const harness = sceneHarness();
    const runtime = new SceneRuntime("medium");
    const canvas = document.createElement("canvas");
    const viewport = { width: 1280, height: 720, dpr: 1.5 };

    await expect(
      runtime.load(descriptor("hero-signal", async () => harness.scene), canvas)
    ).resolves.toBe(harness.scene);

    expect(harness.preload).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      quality: "medium"
    });
    expect(harness.mount).toHaveBeenCalledWith({ canvas, quality: "medium" });
    expect(harness.suspend).toHaveBeenCalledTimes(1);

    runtime.activate("hero-signal");
    runtime.update(0.45);
    runtime.resize(viewport);

    expect(harness.resume).toHaveBeenCalledTimes(1);
    expect(harness.update).toHaveBeenCalledWith(0.45);
    expect(harness.resize).toHaveBeenCalledWith(viewport);

    runtime.activate(null);
    expect(harness.suspend).toHaveBeenCalledTimes(2);
  });

  it("retries initialization exactly once and disposes the failed scene", async () => {
    const failed = sceneHarness();
    const recovered = sceneHarness();
    failed.preload.mockRejectedValueOnce(new Error("asset unavailable"));
    const load = vi
      .fn<() => Promise<ExperienceScene>>()
      .mockResolvedValueOnce(failed.scene)
      .mockResolvedValueOnce(recovered.scene);
    const runtime = new SceneRuntime("high");

    await expect(
      runtime.load(descriptor("capability-orbits", load), document.createElement("canvas"))
    ).resolves.toBe(recovered.scene);

    expect(load).toHaveBeenCalledTimes(2);
    expect(failed.dispose).toHaveBeenCalledTimes(1);
    expect(recovered.dispose).not.toHaveBeenCalled();
    expect(runtime.failure).toBeNull();
  });

  it("exposes a normalized terminal failure after two mount failures", async () => {
    const first = sceneHarness();
    const second = sceneHarness();
    first.mount.mockImplementationOnce(() => {
      throw new Error("renderer failed");
    });
    second.mount.mockImplementationOnce(() => {
      throw new Error("renderer failed again");
    });
    const load = vi
      .fn<() => Promise<ExperienceScene>>()
      .mockResolvedValueOnce(first.scene)
      .mockResolvedValueOnce(second.scene);
    const sceneDescriptor = descriptor("omnisync", load);
    const runtime = new SceneRuntime("low");

    await expect(
      runtime.load(sceneDescriptor, document.createElement("canvas"))
    ).resolves.toBeNull();

    expect(load).toHaveBeenCalledTimes(2);
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).toHaveBeenCalledTimes(1);
    expect(runtime.failure).toEqual({
      sceneId: "omnisync",
      fallbackPoster: sceneDescriptor.fallbackPoster,
      code: "scene-mount-failed",
      attempts: 2
    });
    expect(runtime.fallbackPoster).toBe(sceneDescriptor.fallbackPoster);
  });

  it("normalizes descriptor loading failures without exposing raw errors", async () => {
    const load = vi.fn<() => Promise<ExperienceScene>>().mockRejectedValue(new Error("secret"));
    const sceneDescriptor = descriptor("nomada", load);
    const runtime = new SceneRuntime("medium");

    await runtime.load(sceneDescriptor, document.createElement("canvas"));

    expect(load).toHaveBeenCalledTimes(2);
    expect(runtime.failure).toEqual({
      sceneId: "nomada",
      fallbackPoster: sceneDescriptor.fallbackPoster,
      code: "scene-load-failed",
      attempts: 2
    });
    expect(JSON.stringify(runtime.failure)).not.toContain("secret");
  });

  it("disposes stale dynamic imports and never publishes them", async () => {
    const stale = sceneHarness();
    const current = sceneHarness();
    let resolveStale: ((scene: ExperienceScene) => void) | undefined;
    const staleLoad = new Promise<ExperienceScene>((resolve) => {
      resolveStale = resolve;
    });
    const runtime = new SceneRuntime("high");
    const canvas = document.createElement("canvas");

    const staleResult = runtime.load(descriptor("stale", () => staleLoad), canvas);
    await expect(
      runtime.load(descriptor("current", async () => current.scene), canvas)
    ).resolves.toBe(current.scene);

    resolveStale?.(stale.scene);
    await expect(staleResult).resolves.toBeNull();

    expect(stale.dispose).toHaveBeenCalledTimes(1);
    expect(stale.preload).not.toHaveBeenCalled();
    expect(stale.mount).not.toHaveBeenCalled();
    expect(runtime.failure).toBeNull();
  });

  it("suspends the previous scene and resumes only the selected scene", async () => {
    const hero = sceneHarness();
    const orbits = sceneHarness();
    const runtime = new SceneRuntime("medium");
    const canvas = document.createElement("canvas");

    await runtime.load(descriptor("hero", async () => hero.scene), canvas);
    await runtime.load(descriptor("orbits", async () => orbits.scene), canvas);
    runtime.activate("hero");
    runtime.activate("orbits");

    expect(hero.resume).toHaveBeenCalledTimes(1);
    expect(hero.suspend).toHaveBeenCalledTimes(2);
    expect(orbits.resume).toHaveBeenCalledTimes(1);
    expect(orbits.suspend).toHaveBeenCalledTimes(1);
  });

  it("aborts outstanding work and disposes every owned scene idempotently", async () => {
    const first = sceneHarness();
    const second = sceneHarness();
    const pending = sceneHarness();
    let resolvePending: ((scene: ExperienceScene) => void) | undefined;
    const pendingLoad = new Promise<ExperienceScene>((resolve) => {
      resolvePending = resolve;
    });
    const runtime = new SceneRuntime("high");
    const canvas = document.createElement("canvas");

    await runtime.load(descriptor("first", async () => first.scene), canvas);
    await runtime.load(descriptor("second", async () => second.scene), canvas);
    const pendingResult = runtime.load(descriptor("pending", () => pendingLoad), canvas);

    runtime.dispose();
    runtime.dispose();
    resolvePending?.(pending.scene);

    await expect(pendingResult).resolves.toBeNull();
    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).toHaveBeenCalledTimes(1);
    expect(pending.dispose).toHaveBeenCalledTimes(1);
  });
});

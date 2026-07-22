import type { QualityProfile } from "../quality/RenderQualityController";
import type {
  ExperienceScene,
  SceneDescriptor,
  Viewport
} from "./ExperienceScene";

export type SceneRuntimeErrorCode =
  | "scene-load-failed"
  | "scene-preload-failed"
  | "scene-mount-failed";

export interface SceneRuntimeFailure {
  readonly sceneId: string;
  readonly fallbackPoster: string;
  readonly code: SceneRuntimeErrorCode;
  readonly attempts: 2;
}

const INITIALIZATION_ATTEMPTS = 2;

function disposeScene(scene: ExperienceScene | null): void {
  if (scene === null) return;

  try {
    scene.dispose();
  } catch {
    // Cleanup is best-effort so one faulty scene cannot retain other runtime resources.
  }
}

export class SceneRuntime {
  private readonly scenes = new Map<string, ExperienceScene>();
  private activeSceneId: string | null = null;
  private activeOperation = 0;
  private abortController: AbortController | null = null;
  private terminalFailure: SceneRuntimeFailure | null = null;
  private disposed = false;

  constructor(private readonly quality: QualityProfile) {}

  get failure(): SceneRuntimeFailure | null {
    return this.terminalFailure;
  }

  get fallbackPoster(): string | null {
    return this.terminalFailure?.fallbackPoster ?? null;
  }

  async load(
    descriptor: SceneDescriptor,
    canvas: HTMLCanvasElement
  ): Promise<ExperienceScene | null> {
    if (this.disposed) throw new Error("Cannot load a scene after runtime disposal");

    this.abortController?.abort();
    const operation = ++this.activeOperation;
    this.terminalFailure = null;
    let terminalCode: SceneRuntimeErrorCode = "scene-load-failed";

    for (let attempt = 1; attempt <= INITIALIZATION_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      this.abortController = controller;
      let scene: ExperienceScene | null = null;
      let stage: SceneRuntimeErrorCode = "scene-load-failed";

      try {
        scene = await descriptor.load();
        if (!this.isCurrent(operation, controller)) {
          disposeScene(scene);
          return null;
        }

        stage = "scene-preload-failed";
        await scene.preload({ signal: controller.signal, quality: this.quality });
        if (!this.isCurrent(operation, controller)) {
          disposeScene(scene);
          return null;
        }

        stage = "scene-mount-failed";
        scene.mount({ canvas, quality: this.quality });

        if (this.activeSceneId === descriptor.id) scene.resume();
        else scene.suspend();

        if (!this.isCurrent(operation, controller)) {
          disposeScene(scene);
          return null;
        }

        const previous = this.scenes.get(descriptor.id) ?? null;
        if (previous !== scene) disposeScene(previous);
        this.scenes.set(descriptor.id, scene);
        this.abortController = null;
        return scene;
      } catch {
        terminalCode = stage;
        disposeScene(scene);
        controller.abort();

        if (!this.isOperationCurrent(operation)) return null;
        if (this.abortController === controller) this.abortController = null;
      }
    }

    if (!this.isOperationCurrent(operation)) return null;

    this.terminalFailure = {
      sceneId: descriptor.id,
      fallbackPoster: descriptor.fallbackPoster,
      code: terminalCode,
      attempts: INITIALIZATION_ATTEMPTS
    };
    return null;
  }

  activate(sceneId: string | null): void {
    const nextSceneId = sceneId !== null && this.scenes.has(sceneId) ? sceneId : null;
    if (nextSceneId === this.activeSceneId) return;

    if (this.activeSceneId !== null) {
      this.scenes.get(this.activeSceneId)?.suspend();
    }

    this.activeSceneId = nextSceneId;
    if (nextSceneId !== null) this.scenes.get(nextSceneId)?.resume();
  }

  update(progress: number): void {
    if (this.activeSceneId === null) return;
    this.scenes.get(this.activeSceneId)?.update(progress);
  }

  resize(viewport: Viewport): void {
    for (const scene of this.scenes.values()) scene.resize(viewport);
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.activeOperation += 1;
    this.abortController?.abort();
    this.abortController = null;
    this.activeSceneId = null;

    for (const scene of this.scenes.values()) disposeScene(scene);
    this.scenes.clear();
  }

  private isCurrent(operation: number, controller: AbortController): boolean {
    return this.isOperationCurrent(operation) && !controller.signal.aborted;
  }

  private isOperationCurrent(operation: number): boolean {
    return !this.disposed && operation === this.activeOperation;
  }
}

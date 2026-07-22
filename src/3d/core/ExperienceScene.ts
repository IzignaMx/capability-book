export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export interface SceneLoadContext {
  signal: AbortSignal;
  quality: "low" | "medium" | "high";
}

export interface SceneMountContext {
  canvas: HTMLCanvasElement;
  quality: "low" | "medium" | "high";
}

export interface ExperienceScene {
  preload(context: SceneLoadContext): Promise<void>;
  mount(context: SceneMountContext): void;
  update(progress: number): void;
  resize(viewport: Viewport): void;
  suspend(): void;
  resume(): void;
  dispose(): void;
}

export interface SceneDescriptor {
  id: string;
  load: () => Promise<ExperienceScene>;
  minQuality: "low" | "medium" | "high";
  fallbackPoster: string;
  supportsReducedMotion: boolean;
}

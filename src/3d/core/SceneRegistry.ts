import type { SceneDescriptor } from "./ExperienceScene";

export class SceneRegistry {
  private readonly scenes = new Map<string, SceneDescriptor>();

  register(descriptor: SceneDescriptor): void {
    if (this.scenes.has(descriptor.id)) {
      throw new Error(`Duplicate scene ID: ${descriptor.id}`);
    }

    this.scenes.set(descriptor.id, descriptor);
  }

  get(id: string): SceneDescriptor | null {
    return this.scenes.get(id) ?? null;
  }

  list(): SceneDescriptor[] {
    return [...this.scenes.values()];
  }
}

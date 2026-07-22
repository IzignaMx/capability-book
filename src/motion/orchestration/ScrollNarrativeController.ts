import type { ChapterId } from "../../features/explore-mode/chapterDefinitions";

export interface ScrollNarrativeTriggerOptions {
  readonly element: HTMLElement;
  readonly start: "top bottom";
  readonly end: "bottom top";
  readonly scrub: true;
  readonly onUpdate: (progress: number) => void;
  readonly onLeave: () => void;
  readonly onLeaveBack: () => void;
}

export interface OwnedScrollTrigger {
  refresh(): void;
  kill(): void;
}

export interface ScrollTriggerPort {
  create(options: ScrollNarrativeTriggerOptions): OwnedScrollTrigger;
}

export function normalizeChapterProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

async function loadBrowserScrollTriggerPort(): Promise<ScrollTriggerPort | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);

    gsap.registerPlugin(ScrollTrigger);

    return {
      create(options) {
        const trigger = ScrollTrigger.create({
          trigger: options.element,
          start: options.start,
          end: options.end,
          scrub: options.scrub,
          onUpdate: (instance) => options.onUpdate(instance.progress),
          onLeave: options.onLeave,
          onLeaveBack: options.onLeaveBack,
        });

        return {
          refresh: () => trigger.refresh(),
          kill: () => trigger.kill(),
        };
      },
    };
  } catch {
    return null;
  }
}

export class ScrollNarrativeController {
  private readonly triggers: OwnedScrollTrigger[] = [];

  constructor(private readonly port: ScrollTriggerPort) {}

  static async createForBrowser(): Promise<ScrollNarrativeController | null> {
    const port = await loadBrowserScrollTriggerPort();
    return port ? new ScrollNarrativeController(port) : null;
  }

  mount(
    elements: ReadonlyMap<ChapterId, HTMLElement>,
    onProgress: (chapter: ChapterId, progress: number) => void,
  ): void {
    this.dispose();

    try {
      for (const [chapter, element] of elements) {
        const trigger = this.port.create({
          element,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (progress) =>
            onProgress(chapter, normalizeChapterProgress(progress)),
          onLeave: () => onProgress(chapter, 1),
          onLeaveBack: () => onProgress(chapter, 0),
        });

        this.triggers.push(trigger);
      }
    } catch {
      this.dispose();
    }
  }

  refresh(): void {
    for (const trigger of this.triggers) {
      trigger.refresh();
    }
  }

  dispose(): void {
    for (const trigger of this.triggers.splice(0)) {
      trigger.kill();
    }
  }
}

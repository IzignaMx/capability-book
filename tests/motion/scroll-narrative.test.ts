import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  chapters,
  type ChapterId,
} from "../../src/features/explore-mode/chapterDefinitions";
import {
  normalizeChapterProgress,
  ScrollNarrativeController,
  type OwnedScrollTrigger,
  type ScrollNarrativeTriggerOptions,
  type ScrollTriggerPort,
} from "../../src/motion/orchestration/ScrollNarrativeController";

const gsapMocks = vi.hoisted(() => {
  const registerPlugin = vi.fn();
  const create = vi.fn();

  return { create, registerPlugin };
});

vi.mock("gsap", () => ({
  default: { registerPlugin: gsapMocks.registerPlugin },
  gsap: { registerPlugin: gsapMocks.registerPlugin },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  default: { create: gsapMocks.create },
  ScrollTrigger: { create: gsapMocks.create },
}));

interface TriggerRecord {
  readonly options: ScrollNarrativeTriggerOptions;
  readonly refresh: ReturnType<typeof vi.fn>;
  readonly kill: ReturnType<typeof vi.fn>;
}

function createElementMap(...ids: ChapterId[]): Map<ChapterId, HTMLElement> {
  return new Map(
    ids.map((id): [ChapterId, HTMLElement] => [
      id,
      document.createElement("section"),
    ]),
  );
}

function createPortHarness(): {
  readonly port: ScrollTriggerPort;
  readonly records: TriggerRecord[];
  readonly events: string[];
} {
  const records: TriggerRecord[] = [];
  const events: string[] = [];

  return {
    records,
    events,
    port: {
      create(options): OwnedScrollTrigger {
        events.push("create");
        const refresh = vi.fn();
        const kill = vi.fn(() => events.push("kill"));
        records.push({ options, refresh, kill });
        return { refresh, kill };
      },
    },
  };
}

function firstRecord(records: TriggerRecord[]): TriggerRecord {
  const record = records.at(0);
  if (!record) {
    throw new Error("Expected a captured scroll trigger");
  }

  return record;
}

describe("semantic chapter definitions", () => {
  it("keeps the approved narrative order and scene mappings", () => {
    expect(chapters).toEqual([
      { id: "signal", sceneId: "hero-signal", label: "Signal acquisition" },
      { id: "assembly", sceneId: "hero-signal", label: "System assembly" },
      {
        id: "capabilities",
        sceneId: "capability-orbits",
        label: "Capability expansion",
      },
      { id: "omnisync", sceneId: "omnisync", label: "OmniSync encounter" },
      {
        id: "nomada",
        sceneId: "nomada",
        label: "Hamburguesa Nómada encounter",
      },
      { id: "quality", sceneId: "hero-signal", label: "Quality scan" },
      {
        id: "uplink",
        sceneId: "hero-signal",
        label: "Communication uplink",
      },
    ]);
  });
});

describe("ScrollNarrativeController", () => {
  beforeEach(() => {
    gsapMocks.create.mockReset();
    gsapMocks.registerPlugin.mockReset();
    gsapMocks.create.mockImplementation(() => ({
      refresh: vi.fn(),
      kill: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates one owned trigger per chapter with the approved boundaries", () => {
    const { port, records } = createPortHarness();
    const controller = new ScrollNarrativeController(port);
    const elements = createElementMap(...chapters.map(({ id }) => id));

    controller.mount(elements, vi.fn());

    expect(records).toHaveLength(chapters.length);
    for (const record of records) {
      expect(record.options).toMatchObject({
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      });
    }
  });

  it("clamps progress and emits deterministic chapter boundaries", () => {
    const { port, records } = createPortHarness();
    const controller = new ScrollNarrativeController(port);
    const onProgress = vi.fn();

    controller.mount(createElementMap("signal"), onProgress);
    const trigger = firstRecord(records).options;

    trigger.onUpdate(-0.25);
    trigger.onUpdate(0.4);
    trigger.onUpdate(1.5);
    trigger.onUpdate(Number.NaN);
    trigger.onLeave();
    trigger.onLeaveBack();

    expect(onProgress.mock.calls).toEqual([
      ["signal", 0],
      ["signal", 0.4],
      ["signal", 1],
      ["signal", 0],
      ["signal", 1],
      ["signal", 0],
    ]);
    expect(normalizeChapterProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("refreshes and disposes only its owned triggers", () => {
    const { port, records } = createPortHarness();
    const controller = new ScrollNarrativeController(port);

    controller.mount(createElementMap("signal", "assembly"), vi.fn());
    controller.refresh();
    controller.dispose();
    controller.dispose();

    for (const record of records) {
      expect(record.refresh).toHaveBeenCalledTimes(1);
      expect(record.kill).toHaveBeenCalledTimes(1);
    }
  });

  it("disposes previous ownership before remounting", () => {
    const { port, events } = createPortHarness();
    const controller = new ScrollNarrativeController(port);

    controller.mount(createElementMap("signal"), vi.fn());
    controller.mount(createElementMap("assembly"), vi.fn());

    expect(events).toEqual(["create", "kill", "create"]);
  });

  it("cleans partial ownership when trigger initialization fails", () => {
    const firstKill = vi.fn();
    const port: ScrollTriggerPort = {
      create: vi
        .fn()
        .mockReturnValueOnce({ refresh: vi.fn(), kill: firstKill })
        .mockImplementationOnce(() => {
          throw new Error("ScrollTrigger initialization failed");
        }),
    };
    const controller = new ScrollNarrativeController(port);

    expect(() =>
      controller.mount(createElementMap("signal", "assembly"), vi.fn()),
    ).not.toThrow();
    expect(firstKill).toHaveBeenCalledTimes(1);
  });

  it("loads and registers ScrollTrigger only from a browser lifecycle", async () => {
    const controller = await ScrollNarrativeController.createForBrowser();

    expect(controller).toBeInstanceOf(ScrollNarrativeController);
    expect(gsapMocks.registerPlugin).toHaveBeenCalledTimes(1);
  });

  it("keeps the static path when no browser is available", async () => {
    vi.stubGlobal("window", undefined);

    await expect(ScrollNarrativeController.createForBrowser()).resolves.toBeNull();
    expect(gsapMocks.registerPlugin).not.toHaveBeenCalled();
  });

  it("keeps the static path when GSAP initialization fails", async () => {
    gsapMocks.registerPlugin.mockImplementationOnce(() => {
      throw new Error("GSAP unavailable");
    });

    await expect(ScrollNarrativeController.createForBrowser()).resolves.toBeNull();
  });
});

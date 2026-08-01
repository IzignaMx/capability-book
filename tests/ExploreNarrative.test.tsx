import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MotionSignals } from "../src/motion/preferences/MotionPreferenceService";
import type { MotionSignalChangeSource } from "../src/motion/preferences/MotionPreferenceService";

const narrativeHarness = vi.hoisted(() => ({
  signals: {
    reducedMotion: false,
    saveData: false,
    webgl: true,
    memoryGb: 8,
    cores: 8
  } as MotionSignals,
  signalObserver: null as ((source: MotionSignalChangeSource) => void) | null,
  readSignals: vi.fn(),
  createController: vi.fn()
}));

vi.mock("../src/motion/preferences/MotionPreferenceService", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../src/motion/preferences/MotionPreferenceService")
  >();

  return {
    ...original,
    readMotionSignals: () => narrativeHarness.readSignals(),
    observeMotionSignalChanges: (observer: (source: MotionSignalChangeSource) => void) => {
      narrativeHarness.signalObserver = observer;
      return () => {
        if (narrativeHarness.signalObserver === observer) {
          narrativeHarness.signalObserver = null;
        }
      };
    }
  };
});

vi.mock("../src/motion/orchestration/ScrollNarrativeController", () => ({
  ScrollNarrativeController: {
    createForBrowser: narrativeHarness.createController
  }
}));

vi.mock("../src/components/explore/ExploreCanvas", () => ({
  ExploreCanvas: ({
    canvasLabel,
    children
  }: {
    readonly canvasLabel: string;
    readonly children?: ReactNode;
  }) => (
    <div role="img" aria-label={canvasLabel} data-testid="explore-canvas">
      {children}
    </div>
  )
}));

vi.mock("../src/3d/scenes/HeroSignalScene", () => ({
  HeroSignalScene: () => <span>Hero scene</span>
}));

vi.mock("../src/3d/scenes/CapabilityOrbitScene", () => ({
  CapabilityOrbitScene: () => <span>Capability scene</span>
}));

vi.mock("../src/3d/scenes/OmniSyncScene", () => ({
  OmniSyncScene: () => <span>OmniSync scene</span>
}));

vi.mock("../src/3d/scenes/NomadaScene", () => ({
  NomadaScene: () => <span>Nomada scene</span>
}));

import {
  ExploreNarrative,
  NarrativeEnhancementBoundary
} from "../src/features/explore-mode/ExploreNarrative";

const chapterIds = [
  "explore-signal",
  "explore-assembly",
  "explore-capabilities",
  "explore-omnisync",
  "explore-nomada",
  "explore-quality",
  "explore-uplink"
] as const;

function appendSemanticChapters(): void {
  for (const id of chapterIds) {
    const chapter = document.createElement("section");
    chapter.id = id;
    document.body.append(chapter);
  }
}

function controllerStub() {
  return {
    mount: vi.fn(() => true),
    refresh: vi.fn(() => true),
    dispose: vi.fn()
  };
}

describe("ExploreNarrative runtime hardening", () => {
  beforeEach(() => {
    for (const id of chapterIds) document.getElementById(id)?.remove();
    narrativeHarness.signals = {
      reducedMotion: false,
      saveData: false,
      webgl: true,
      memoryGb: 8,
      cores: 8
    };
    narrativeHarness.signalObserver = null;
    narrativeHarness.readSignals.mockReset();
    narrativeHarness.readSignals.mockImplementation(() => narrativeHarness.signals);
    narrativeHarness.createController.mockReset();
    window.localStorage.clear();
    appendSemanticChapters();
  });

  it("localizes the accessible canvas label and reacts to live motion policy changes", async () => {
    narrativeHarness.createController.mockResolvedValue(controllerStub());
    render(
      <ExploreNarrative
        locale="en"
        poster="/media/explore/hero.avif"
        fallbackLabel="Static spatial composition"
        evaluateHref="/en/projects/"
      />
    );

    expect(
      await screen.findByRole("img", {
        name: "Spatial visualization of IzignaMx capabilities"
      })
    ).toBeInTheDocument();

    const readsBeforeViewportChange = narrativeHarness.readSignals.mock.calls.length;
    await act(async () => {
      narrativeHarness.signalObserver?.("viewport");
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    });
    expect(narrativeHarness.readSignals).toHaveBeenCalledTimes(readsBeforeViewportChange);

    narrativeHarness.signals = {
      ...narrativeHarness.signals,
      reducedMotion: true,
      webgl: false
    };
    act(() => narrativeHarness.signalObserver?.("policy"));
    await waitFor(() => expect(screen.queryByTestId("explore-canvas")).not.toBeInTheDocument());
    expect(screen.getByText("Static spatial composition")).toBeInTheDocument();
    expect(screen.getByText(/replaced by its static composition/i)).toBeInTheDocument();

    narrativeHarness.signals = {
      ...narrativeHarness.signals,
      reducedMotion: false,
      webgl: true
    };
    act(() => narrativeHarness.signalObserver?.("policy"));
    expect(await screen.findByTestId("explore-canvas")).toBeInTheDocument();
  });

  it("switches to the complete static fallback when GSAP cannot initialize", async () => {
    narrativeHarness.createController.mockResolvedValue(null);
    render(
      <ExploreNarrative
        locale="es"
        poster="/media/explore/hero.avif"
        fallbackLabel="Composición espacial estática"
        evaluateHref="/es/proyectos/"
      />
    );

    await waitFor(() =>
      expect(document.querySelector(".explore-visual")).toHaveAttribute(
        "data-runtime-unavailable",
        "true"
      )
    );
    expect(screen.queryByTestId("explore-canvas")).not.toBeInTheDocument();
    expect(screen.getByText("Composición espacial estática")).toBeInTheDocument();
    expect(screen.getByText(/visualización avanzada no está disponible/i)).toBeInTheDocument();
  });

  it("contains rejected enhancement rendering behind a DOM fallback boundary", () => {
    const onFailure = vi.fn();
    const ThrowingEnhancement = () => {
      throw new Error("Deferred chunk failed");
    };

    render(
      <NarrativeEnhancementBoundary
        fallback={<p>Complete static fallback</p>}
        onFailure={onFailure}
      >
        <ThrowingEnhancement />
      </NarrativeEnhancementBoundary>
    );

    expect(screen.getByText("Complete static fallback")).toBeInTheDocument();
    expect(onFailure).toHaveBeenCalledTimes(1);
  });
});

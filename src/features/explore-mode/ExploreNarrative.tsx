import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { QualityProfile } from "../../3d/quality/RenderQualityController";
import { selectInitialQuality } from "../../3d/quality/RenderQualityController";
import { ExploreFallback } from "../../components/explore/ExploreFallback";
import { ScrollNarrativeController } from "../../motion/orchestration/ScrollNarrativeController";
import {
  readMotionSignals,
  resolveMotionPolicy,
  type MotionLevel,
  type MotionSignals
} from "../../motion/preferences/MotionPreferenceService";
import type { ChapterId } from "./chapterDefinitions";

export interface ExploreNarrativeProps {
  readonly locale: "es" | "en";
  readonly poster: string;
  readonly fallbackLabel: string;
  readonly evaluateHref: string;
}

export interface ExploreEvent {
  readonly name:
    | "explore_started"
    | "mode_changed"
    | "capability_viewed"
    | "project_scene_engaged";
  readonly locale: "es" | "en";
  readonly sourceRoute: "/es/" | "/en/";
  readonly sourceCapability?: "capability-orbits";
  readonly sourceConcept?: "advanced-motion" | "static-motion";
  readonly sourceProject?: "omnisync" | "hamburguesa-nomada";
}

interface NarrativeSceneState {
  readonly chapter: "signal" | "assembly" | "capabilities" | "omnisync" | "nomada";
  readonly scene: "hero-signal" | "capability-orbits" | "omnisync" | "nomada";
  readonly progress: number;
}

export type MotionControlState = "reduce" | "restore" | "unavailable";

const MOTION_PREFERENCE_KEY = "izignamx:reduce-advanced-motion";
const ACTIVE_CHAPTER_IDS = [
  "signal",
  "assembly",
  "capabilities",
  "omnisync",
  "nomada"
] as const;
const CHAPTER_ELEMENT_IDS: Record<(typeof ACTIVE_CHAPTER_IDS)[number], string> = {
  signal: "explore-signal",
  assembly: "explore-assembly",
  capabilities: "explore-capabilities",
  omnisync: "explore-omnisync",
  nomada: "explore-nomada"
};

const COPY = {
  es: {
    evaluate: "Explorar evidencia en Evaluate",
    reduce: "Reducir movimiento avanzado",
    restore: "Restaurar movimiento avanzado",
    unavailable: "Movimiento avanzado no disponible",
    reducedStatus: "La visualización avanzada fue reemplazada por su composición estática.",
    restoredStatus: "La política de movimiento del dispositivo fue restaurada."
  },
  en: {
    evaluate: "Explore evidence in Evaluate",
    reduce: "Reduce advanced motion",
    restore: "Restore advanced motion",
    unavailable: "Advanced motion unavailable",
    reducedStatus: "The advanced visualization was replaced by its static composition.",
    restoredStatus: "The device motion policy was restored."
  }
} as const;

const LazyExploreCanvas = lazy(async () => {
  const module = await import("../../components/explore/ExploreCanvas");
  return { default: module.ExploreCanvas };
});

const LazyHeroSignalScene = lazy(async () => {
  const module = await import("../../3d/scenes/HeroSignalScene");
  return { default: module.HeroSignalScene };
});

const LazyCapabilityOrbitScene = lazy(async () => {
  const module = await import("../../3d/scenes/CapabilityOrbitScene");
  return { default: module.CapabilityOrbitScene };
});

const LazyOmniSyncScene = lazy(async () => {
  const module = await import("../../3d/scenes/OmniSyncScene");
  return { default: module.OmniSyncScene };
});

const LazyNomadaScene = lazy(async () => {
  const module = await import("../../3d/scenes/NomadaScene");
  return { default: module.NomadaScene };
});

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

export function composeSceneProgress(
  chapter: NarrativeSceneState["chapter"],
  progress: number
): NarrativeSceneState {
  const normalized = normalizeProgress(progress);

  if (chapter === "signal") {
    return { chapter, scene: "hero-signal", progress: normalized * 0.48 };
  }

  if (chapter === "assembly") {
    return { chapter, scene: "hero-signal", progress: 0.48 + normalized * 0.52 };
  }

  if (chapter === "capabilities") {
    return { chapter, scene: "capability-orbits", progress: normalized };
  }

  return { chapter, scene: chapter, progress: normalized };
}

export function createExploreEvent(
  name: ExploreEvent["name"],
  locale: ExploreEvent["locale"],
  sourceCapability?: ExploreEvent["sourceCapability"],
  sourceConcept?: ExploreEvent["sourceConcept"],
  sourceProject?: ExploreEvent["sourceProject"]
): ExploreEvent {
  return {
    name,
    locale,
    sourceRoute: locale === "es" ? "/es/" : "/en/",
    ...(sourceCapability === undefined ? {} : { sourceCapability }),
    ...(sourceConcept === undefined ? {} : { sourceConcept }),
    ...(sourceProject === undefined ? {} : { sourceProject })
  };
}

export function resolveMotionControlState(
  explicitlyReduced: boolean,
  systemAllowsAdvanced: boolean
): MotionControlState {
  if (explicitlyReduced) return "restore";
  if (!systemAllowsAdvanced) return "unavailable";
  return "reduce";
}

function dispatchExploreEvent(event: ExploreEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("izignamx:portfolio-event", { detail: event }));
}

function qualitySignals(signals: MotionSignals, motionLevel: MotionLevel) {
  return {
    width: window.innerWidth,
    motionLevel,
    ...(signals.memoryGb === undefined ? {} : { memoryGb: signals.memoryGb }),
    ...(signals.cores === undefined ? {} : { cores: signals.cores })
  };
}

function readExplicitReduction(): boolean {
  try {
    return window.localStorage.getItem(MOTION_PREFERENCE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistExplicitReduction(reduced: boolean): void {
  try {
    if (reduced) window.localStorage.setItem(MOTION_PREFERENCE_KEY, "true");
    else window.localStorage.removeItem(MOTION_PREFERENCE_KEY);
  } catch {
    // The in-memory preference still applies when storage is unavailable.
  }
}

export function ExploreNarrative({
  locale,
  poster,
  fallbackLabel,
  evaluateHref
}: ExploreNarrativeProps) {
  const copy = COPY[locale];
  const [motionLevel, setMotionLevel] = useState<MotionLevel>(0);
  const [quality, setQuality] = useState<QualityProfile>("low");
  const [explicitlyReduced, setExplicitlyReduced] = useState(false);
  const [systemAllowsAdvanced, setSystemAllowsAdvanced] = useState(false);
  const [sceneState, setSceneState] = useState<NarrativeSceneState>(() =>
    composeSceneProgress("signal", 0)
  );
  const [announcement, setAnnouncement] = useState("");
  const viewedCapabilities = useRef(false);
  const viewedProjects = useRef(new Set<"omnisync" | "nomada">());

  const applyDevicePolicy = useCallback(() => {
    const signals = readMotionSignals();
    const resolvedMotion = resolveMotionPolicy(signals);
    setSystemAllowsAdvanced(resolvedMotion >= 2);
    setMotionLevel(resolvedMotion);
    setQuality(selectInitialQuality(qualitySignals(signals, resolvedMotion)));
  }, []);

  useEffect(() => {
    const reduced = readExplicitReduction();
    const signals = readMotionSignals();
    const resolvedMotion = resolveMotionPolicy(signals);
    setSystemAllowsAdvanced(resolvedMotion >= 2);
    setExplicitlyReduced(reduced);
    setMotionLevel(reduced ? 0 : resolvedMotion);
    setQuality(selectInitialQuality(qualitySignals(signals, reduced ? 0 : resolvedMotion)));
    dispatchExploreEvent(createExploreEvent("explore_started", locale));
  }, [locale]);

  useEffect(() => {
    if (motionLevel < 2) return;

    let disposed = false;
    let controller: ScrollNarrativeController | null = null;

    void ScrollNarrativeController.createForBrowser().then((createdController) => {
      if (disposed) {
        createdController?.dispose();
        return;
      }

      controller = createdController;
      if (controller === null) return;

      const elements = new Map<ChapterId, HTMLElement>();
      for (const chapter of ACTIVE_CHAPTER_IDS) {
        const element = document.getElementById(CHAPTER_ELEMENT_IDS[chapter]);
        if (element !== null) elements.set(chapter, element);
      }

      controller.mount(elements, (chapter, progress) => {
        if (!ACTIVE_CHAPTER_IDS.includes(chapter as (typeof ACTIVE_CHAPTER_IDS)[number])) return;

        const activeChapter = chapter as NarrativeSceneState["chapter"];
        setSceneState((current) => {
          const next = composeSceneProgress(activeChapter, progress);
          if (
            current.chapter === next.chapter &&
            current.scene === next.scene &&
            Math.abs(current.progress - next.progress) < 0.001
          ) {
            return current;
          }
          return next;
        });

        if (activeChapter === "capabilities" && !viewedCapabilities.current) {
          viewedCapabilities.current = true;
          dispatchExploreEvent(
            createExploreEvent("capability_viewed", locale, "capability-orbits")
          );
        }

        if (
          (activeChapter === "omnisync" || activeChapter === "nomada") &&
          !viewedProjects.current.has(activeChapter)
        ) {
          viewedProjects.current.add(activeChapter);
          dispatchExploreEvent(
            createExploreEvent(
              "project_scene_engaged",
              locale,
              undefined,
              undefined,
              activeChapter === "omnisync" ? "omnisync" : "hamburguesa-nomada"
            )
          );
        }
      });
      controller.refresh();
    });

    return () => {
      disposed = true;
      controller?.dispose();
    };
  }, [locale, motionLevel]);

  const toggleMotion = useCallback(() => {
    if (!explicitlyReduced && !systemAllowsAdvanced) return;

    const nextReduced = !explicitlyReduced;
    persistExplicitReduction(nextReduced);
    setExplicitlyReduced(nextReduced);

    if (nextReduced) {
      setMotionLevel(0);
      setQuality("low");
      setAnnouncement(copy.reducedStatus);
      dispatchExploreEvent(
        createExploreEvent("mode_changed", locale, undefined, "static-motion")
      );
      return;
    }

    applyDevicePolicy();
    setAnnouncement(copy.restoredStatus);
    dispatchExploreEvent(
      createExploreEvent("mode_changed", locale, undefined, "advanced-motion")
    );
  }, [
    applyDevicePolicy,
    copy.reducedStatus,
    copy.restoredStatus,
    explicitlyReduced,
    locale,
    systemAllowsAdvanced
  ]);

  const visual = motionLevel < 2 ? (
    <ExploreFallback poster={poster} label={fallbackLabel} />
  ) : (
    <Suspense fallback={<ExploreFallback poster={poster} label={fallbackLabel} />}>
      <LazyExploreCanvas
        motionLevel={motionLevel}
        quality={quality}
        poster={poster}
        fallbackLabel={fallbackLabel}
      >
        <Suspense fallback={null}>
          {sceneState.scene === "hero-signal" ? (
            <LazyHeroSignalScene progress={sceneState.progress} quality={quality} />
          ) : sceneState.scene === "capability-orbits" ? (
            <LazyCapabilityOrbitScene progress={sceneState.progress} quality={quality} />
          ) : sceneState.scene === "omnisync" ? (
            <LazyOmniSyncScene progress={sceneState.progress} quality={quality} />
          ) : (
            <LazyNomadaScene progress={sceneState.progress} quality={quality} />
          )}
        </Suspense>
      </LazyExploreCanvas>
    </Suspense>
  );
  const motionControlState = resolveMotionControlState(
    explicitlyReduced,
    systemAllowsAdvanced
  );

  return (
    <div
      className="explore-visual"
      data-motion-level={motionLevel}
      data-active-chapter={sceneState.chapter}
    >
      <div className="explore-controls" data-pagefind-ignore>
        <a href={evaluateHref}>{copy.evaluate}</a>
        <button
          type="button"
          aria-pressed={motionControlState !== "reduce"}
          disabled={motionControlState === "unavailable"}
          onClick={toggleMotion}
        >
          {copy[motionControlState]}
        </button>
      </div>
      <div className="explore-canvas-frame">{visual}</div>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

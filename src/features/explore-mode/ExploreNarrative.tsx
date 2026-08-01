import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode
} from "react";
import type { QualityProfile } from "../../3d/quality/RenderQualityController";
import { selectInitialQuality } from "../../3d/quality/RenderQualityController";
import {
  MotionControl,
  resolveMotionControlState
} from "../../components/accessibility/MotionControl";
import { ExploreFallback } from "../../components/explore/ExploreFallback";
import { ScrollNarrativeController } from "../../motion/orchestration/ScrollNarrativeController";
import {
  readMotionSignals,
  observeMotionSignalChanges,
  resolveMotionPolicy,
  type MotionSignalChangeSource,
  type MotionLevel,
  type MotionSignals
} from "../../motion/preferences/MotionPreferenceService";
import { chapters, type ChapterId } from "./chapterDefinitions";

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
  readonly chapter: ChapterId;
  readonly scene: "hero-signal" | "capability-orbits" | "omnisync" | "nomada";
  readonly progress: number;
}

const MOTION_PREFERENCE_KEY = "izignamx:reduce-advanced-motion";
const ACTIVE_CHAPTER_IDS: readonly ChapterId[] = chapters.map(({ id }) => id);
const CHAPTER_ELEMENT_IDS: Record<ChapterId, string> = {
  signal: "explore-signal",
  assembly: "explore-assembly",
  capabilities: "explore-capabilities",
  omnisync: "explore-omnisync",
  nomada: "explore-nomada",
  quality: "explore-quality",
  uplink: "explore-uplink"
};

const COPY = {
  es: {
    evaluate: "Explorar evidencia en Evaluate",
    canvasLabel: "Visualización espacial de capacidades de IzignaMx",
    reducedStatus: "La visualización avanzada fue reemplazada por su composición estática.",
    restoredStatus: "La política de movimiento del dispositivo fue restaurada.",
    unavailableStatus: "La visualización avanzada no está disponible. Se muestra la versión estática completa."
  },
  en: {
    evaluate: "Explore evidence in Evaluate",
    canvasLabel: "Spatial visualization of IzignaMx capabilities",
    reducedStatus: "The advanced visualization was replaced by its static composition.",
    restoredStatus: "The device motion policy was restored.",
    unavailableStatus: "The advanced visualization is unavailable. The complete static version is shown."
  }
} as const;

function SceneTransitionFallback() {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <mesh>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.72} />
      </mesh>
    </group>
  );
}

interface NarrativeEnhancementBoundaryProps {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly onFailure: () => void;
}

interface NarrativeEnhancementBoundaryState {
  readonly failed: boolean;
}

export class NarrativeEnhancementBoundary extends Component<
  NarrativeEnhancementBoundaryProps,
  NarrativeEnhancementBoundaryState
> {
  state: NarrativeEnhancementBoundaryState = { failed: false };

  static getDerivedStateFromError(): NarrativeEnhancementBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onFailure();
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

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

export interface ChapterViewportPosition {
  readonly chapter: ChapterId;
  readonly top: number;
  readonly bottom: number;
}

export function resolveNearestChapter(
  positions: readonly ChapterViewportPosition[],
  viewportHeight: number
): ChapterId | null {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return null;

  const viewportCenter = viewportHeight / 2;
  let nearestChapter: ChapterId | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const position of positions) {
    if (
      !Number.isFinite(position.top) ||
      !Number.isFinite(position.bottom) ||
      position.bottom < position.top
    ) {
      continue;
    }

    const chapterCenter = (position.top + position.bottom) / 2;
    const distance = Math.abs(chapterCenter - viewportCenter);
    if (distance >= nearestDistance) continue;

    nearestChapter = position.chapter;
    nearestDistance = distance;
  }

  return nearestChapter;
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

  if (chapter === "quality" || chapter === "uplink") {
    return { chapter, scene: "hero-signal", progress: 1 };
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

const QUALITY_RANK: Readonly<Record<QualityProfile, number>> = {
  low: 0,
  medium: 1,
  high: 2
};

function lowerQualityOnly(
  current: QualityProfile,
  candidate: QualityProfile
): QualityProfile {
  return QUALITY_RANK[candidate] < QUALITY_RANK[current] ? candidate : current;
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
  const [runtimeUnavailable, setRuntimeUnavailable] = useState(false);
  const [sceneState, setSceneState] = useState<NarrativeSceneState>(() =>
    composeSceneProgress("signal", 0)
  );
  const [announcement, setAnnouncement] = useState("");
  const viewedCapabilities = useRef(false);
  const viewedProjects = useRef(new Set<"omnisync" | "nomada">());
  const explicitlyReducedRef = useRef(false);
  const runtimeUnavailableRef = useRef(false);
  const latestSignalsRef = useRef<MotionSignals | null>(null);

  const applyDevicePolicy = useCallback((source: MotionSignalChangeSource = "policy") => {
    const signals =
      source === "viewport" && latestSignalsRef.current !== null
        ? latestSignalsRef.current
        : readMotionSignals();
    if (source === "policy") latestSignalsRef.current = signals;
    const resolvedMotion = resolveMotionPolicy(signals);
    const allowsAdvanced = resolvedMotion >= 2 && !runtimeUnavailableRef.current;
    const effectiveMotion =
      explicitlyReducedRef.current || runtimeUnavailableRef.current ? 0 : resolvedMotion;
    setSystemAllowsAdvanced(allowsAdvanced);
    setMotionLevel((currentMotion) => {
      if (source === "policy" && currentMotion !== effectiveMotion) {
        setAnnouncement(effectiveMotion < 2 ? copy.reducedStatus : copy.restoredStatus);
      }
      return effectiveMotion;
    });
    const candidateQuality = selectInitialQuality(qualitySignals(signals, effectiveMotion));
    setQuality((currentQuality) =>
      source === "viewport"
        ? lowerQualityOnly(currentQuality, candidateQuality)
        : candidateQuality
    );
  }, [copy.reducedStatus, copy.restoredStatus]);

  const degradeToStatic = useCallback(() => {
    runtimeUnavailableRef.current = true;
    setRuntimeUnavailable(true);
    setSystemAllowsAdvanced(false);
    setMotionLevel(0);
    setQuality("low");
    setAnnouncement(copy.unavailableStatus);
  }, [copy.unavailableStatus]);

  useEffect(() => {
    const reduced = readExplicitReduction();
    const signals = readMotionSignals();
    const resolvedMotion = resolveMotionPolicy(signals);
    explicitlyReducedRef.current = reduced;
    runtimeUnavailableRef.current = false;
    latestSignalsRef.current = signals;
    setRuntimeUnavailable(false);
    setSystemAllowsAdvanced(resolvedMotion >= 2);
    setExplicitlyReduced(reduced);
    setMotionLevel(reduced ? 0 : resolvedMotion);
    setQuality(selectInitialQuality(qualitySignals(signals, reduced ? 0 : resolvedMotion)));
    dispatchExploreEvent(createExploreEvent("explore_started", locale));

    let pendingPolicyFrame: number | null = null;
    let pendingSignalSource: MotionSignalChangeSource = "viewport";
    const handleSignalChange = (source: MotionSignalChangeSource) => {
      if (source === "policy") pendingSignalSource = "policy";
      if (pendingPolicyFrame !== null) return;
      pendingPolicyFrame = window.requestAnimationFrame(() => {
        pendingPolicyFrame = null;
        const signalSource = pendingSignalSource;
        pendingSignalSource = "viewport";
        applyDevicePolicy(signalSource);
      });
    };
    const stopObserving = observeMotionSignalChanges(handleSignalChange);

    return () => {
      stopObserving();
      if (pendingPolicyFrame !== null) window.cancelAnimationFrame(pendingPolicyFrame);
    };
  }, [applyDevicePolicy, locale]);

  useEffect(() => {
    if (motionLevel < 2) return;

    let disposed = false;
    let controller: ScrollNarrativeController | null = null;
    let pendingFrame: number | null = null;

    void ScrollNarrativeController.createForBrowser().then((createdController) => {
      if (disposed) {
        createdController?.dispose();
        return;
      }

      controller = createdController;
      if (controller === null) {
        degradeToStatic();
        return;
      }

      const elements = new Map<ChapterId, HTMLElement>();
      for (const chapter of ACTIVE_CHAPTER_IDS) {
        const element = document.getElementById(CHAPTER_ELEMENT_IDS[chapter]);
        if (element !== null) elements.set(chapter, element);
      }

      if (elements.size !== ACTIVE_CHAPTER_IDS.length) {
        controller.dispose();
        degradeToStatic();
        return;
      }

      const chapterProgress = new Map<ChapterId, number>();

      const commitActiveChapter = (activeChapter: ChapterId, progress: number) => {
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
      };

      const scheduleActiveChapter = () => {
        if (pendingFrame !== null) return;

        pendingFrame = window.requestAnimationFrame(() => {
          pendingFrame = null;
          if (disposed) return;

          const positions = Array.from(elements, ([chapter, element]) => {
            const bounds = element.getBoundingClientRect();
            return { chapter, top: bounds.top, bottom: bounds.bottom };
          });
          const activeChapter = resolveNearestChapter(positions, window.innerHeight);
          if (activeChapter === null) return;

          commitActiveChapter(activeChapter, chapterProgress.get(activeChapter) ?? 0);
        });
      };

      const mounted = controller.mount(elements, (chapter, progress) => {
        if (!ACTIVE_CHAPTER_IDS.includes(chapter)) return;
        chapterProgress.set(chapter, progress);
        scheduleActiveChapter();
      });
      if (!mounted || !controller.refresh()) {
        degradeToStatic();
        return;
      }
      scheduleActiveChapter();
    });

    return () => {
      disposed = true;
      if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
      controller?.dispose();
    };
  }, [degradeToStatic, locale, motionLevel]);

  const toggleMotion = useCallback(() => {
    if (!explicitlyReduced && !systemAllowsAdvanced) return;

    const nextReduced = !explicitlyReduced;
    persistExplicitReduction(nextReduced);
    explicitlyReducedRef.current = nextReduced;
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

  const handleQualityChange = useCallback((nextQuality: QualityProfile) => {
    setQuality((currentQuality) =>
      currentQuality === nextQuality ? currentQuality : nextQuality
    );
  }, []);

  const visual = motionLevel < 2 ? (
    <ExploreFallback poster={poster} label={fallbackLabel} />
  ) : (
    <NarrativeEnhancementBoundary
      fallback={<ExploreFallback poster={poster} label={fallbackLabel} />}
      onFailure={degradeToStatic}
    >
      <Suspense fallback={<ExploreFallback poster={poster} label={fallbackLabel} />}>
        <LazyExploreCanvas
          motionLevel={motionLevel}
          quality={quality}
          poster={poster}
          fallbackLabel={fallbackLabel}
          canvasLabel={copy.canvasLabel}
          onQualityChange={handleQualityChange}
          onRuntimeFailure={degradeToStatic}
        >
          <Suspense fallback={<SceneTransitionFallback />}>
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
    </NarrativeEnhancementBoundary>
  );
  const motionControlState = resolveMotionControlState(
    explicitlyReduced,
    systemAllowsAdvanced
  );

  return (
    <div
      className="explore-visual"
      data-motion-level={motionLevel}
      data-quality-profile={quality}
      data-active-chapter={sceneState.chapter}
      data-runtime-unavailable={runtimeUnavailable ? "true" : "false"}
    >
      <div className="explore-controls" data-pagefind-ignore>
        <a href={evaluateHref}>{copy.evaluate}</a>
        <MotionControl locale={locale} state={motionControlState} onToggle={toggleMotion} />
      </div>
      <div className="explore-canvas-frame">{visual}</div>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

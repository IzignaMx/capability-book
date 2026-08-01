export type MotionLevel = 0 | 1 | 2 | 3;

export interface MotionSignals {
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  readonly webgl: boolean;
  readonly memoryGb?: number;
  readonly cores?: number;
}

export type MotionSignalChangeSource = "policy" | "viewport";

interface NetworkInformationLike {
  readonly saveData?: boolean;
  addEventListener?(type: "change", listener: EventListener): void;
  removeEventListener?(type: "change", listener: EventListener): void;
}

type NavigatorWithMotionHints = Navigator & {
  readonly connection?: NetworkInformationLike;
  readonly deviceMemory?: number;
};

const DEFAULT_MEMORY_GB = 4;
const DEFAULT_CORES = 4;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const WEBGL_CONTEXT_OPTIONS = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  failIfMajorPerformanceCaveat: true,
  powerPreference: "low-power"
} satisfies WebGLContextAttributes;

function positiveFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

export function resolveMotionPolicy(signals: MotionSignals): MotionLevel {
  if (signals.reducedMotion || signals.saveData || !signals.webgl) return 0;

  const memoryGb = positiveFiniteNumber(signals.memoryGb) ?? DEFAULT_MEMORY_GB;
  const cores = positiveFiniteNumber(signals.cores) ?? DEFAULT_CORES;

  if (memoryGb <= 2 || cores <= 2) return 1;
  if (memoryGb < 6 || cores < 6) return 2;
  return 3;
}

function prefersReducedMotion(runtimeWindow: Window): boolean {
  if (typeof runtimeWindow.matchMedia !== "function") return true;

  try {
    return runtimeWindow.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return true;
  }
}

function isWebglContext(
  context: RenderingContext | null
): context is WebGL2RenderingContext | WebGLRenderingContext {
  return context !== null && "getExtension" in context;
}

function detectTransientWebgl(runtimeDocument: Document): boolean {
  for (const contextType of ["webgl2", "webgl"] as const) {
    const canvas = runtimeDocument.createElement("canvas");

    try {
      const context = canvas.getContext(contextType, WEBGL_CONTEXT_OPTIONS);
      if (!isWebglContext(context)) continue;

      try {
        context.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // Context disposal support is optional; the capability result remains valid.
      }

      return true;
    } catch {
      // A blocked or failed context is treated conservatively as unavailable.
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  return false;
}

export function readMotionSignals(): MotionSignals {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { reducedMotion: false, saveData: false, webgl: false };
  }

  const runtimeNavigator = window.navigator as NavigatorWithMotionHints;
  const reducedMotion = prefersReducedMotion(window);
  const saveData = runtimeNavigator.connection?.saveData === true;
  const memoryGb = positiveFiniteNumber(runtimeNavigator.deviceMemory);
  const cores = positiveFiniteNumber(runtimeNavigator.hardwareConcurrency);
  const resourceSignals = {
    ...(memoryGb === undefined ? {} : { memoryGb }),
    ...(cores === undefined ? {} : { cores })
  };

  if (reducedMotion || saveData) {
    return { reducedMotion, saveData, webgl: false, ...resourceSignals };
  }

  return {
    reducedMotion,
    saveData,
    webgl: detectTransientWebgl(document),
    ...resourceSignals
  };
}

export function observeMotionSignalChanges(
  onChange: (source: MotionSignalChangeSource) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const cleanups: Array<() => void> = [];
  const mediaQuery = window.matchMedia?.(REDUCED_MOTION_QUERY);
  const runtimeNavigator = window.navigator as NavigatorWithMotionHints;
  const connection = runtimeNavigator.connection;

  if (
    mediaQuery &&
    typeof mediaQuery.addEventListener === "function" &&
    typeof mediaQuery.removeEventListener === "function"
  ) {
    const handleMediaChange = () => onChange("policy");
    mediaQuery.addEventListener("change", handleMediaChange);
    cleanups.push(() => mediaQuery.removeEventListener("change", handleMediaChange));
  }

  if (connection?.addEventListener && connection.removeEventListener) {
    const handleConnectionChange = () => onChange("policy");
    connection.addEventListener("change", handleConnectionChange);
    cleanups.push(() => connection.removeEventListener?.("change", handleConnectionChange));
  }

  const handleViewportChange = () => onChange("viewport");
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("orientationchange", handleViewportChange);
  cleanups.push(() => window.removeEventListener("resize", handleViewportChange));
  cleanups.push(() => window.removeEventListener("orientationchange", handleViewportChange));

  return () => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  };
}

import { Canvas } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode
} from "react";
import type { QualityProfile } from "../../3d/quality/RenderQualityController";
import { AdaptiveQualityProbe } from "../../3d/quality/AdaptiveQualityProbe";
import type { MotionLevel } from "../../motion/preferences/MotionPreferenceService";
import { ExploreFallback } from "./ExploreFallback";

export interface ExploreCanvasProps {
  readonly motionLevel: MotionLevel;
  readonly quality: QualityProfile;
  readonly poster: string;
  readonly fallbackLabel: string;
  readonly canvasLabel: string;
  readonly onQualityChange?: (quality: QualityProfile) => void;
  readonly onRuntimeFailure?: () => void;
  readonly children?: ReactNode;
}

interface CanvasBoundaryProps {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly resetKey: number;
  readonly onFailure: () => void;
}

interface CanvasBoundaryState {
  readonly failed: boolean;
}

const DPR_BY_QUALITY: Record<QualityProfile, [number, number]> = {
  low: [1, 1.5],
  medium: [1, 1.75],
  high: [1, 2]
};

const CANVAS_INITIALIZATION_TIMEOUT_MS = 1_500;
export const WEBGL_CONTEXT_RESTORE_TIMEOUT_MS = 2_000;

class CanvasErrorBoundary extends Component<CanvasBoundaryProps, CanvasBoundaryState> {
  state: CanvasBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onFailure();
  }

  componentDidUpdate(previousProps: CanvasBoundaryProps): void {
    if (previousProps.resetKey === this.props.resetKey || !this.state.failed) return;
    this.setState({ failed: false });
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export function ExploreCanvas({
  motionLevel,
  quality,
  poster,
  fallbackLabel,
  canvasLabel,
  onQualityChange,
  onRuntimeFailure,
  children
}: ExploreCanvasProps) {
  const [attempt, setAttempt] = useState<0 | 1>(0);
  const [terminalFailure, setTerminalFailure] = useState(false);
  const failedAttempts = useRef(new Set<number>());
  const readyAttempts = useRef(new Set<number>());
  const contextCleanupRef = useRef<(() => void) | null>(null);

  const handleFailure = useCallback(() => {
    if (failedAttempts.current.has(attempt)) return;
    failedAttempts.current.add(attempt);

    if (attempt === 0) setAttempt(1);
    else {
      setTerminalFailure(true);
      onRuntimeFailure?.();
    }
  }, [attempt, onRuntimeFailure]);

  const handleRuntimeFailure = useCallback(() => {
    contextCleanupRef.current?.();
    contextCleanupRef.current = null;
    setTerminalFailure(true);
    onRuntimeFailure?.();
  }, [onRuntimeFailure]);

  const handleCreated = useCallback(
    (state: RootState) => {
      readyAttempts.current.add(attempt);
      contextCleanupRef.current?.();

      const canvas = state.gl.domElement;
      let restoreTimeout: number | null = null;
      const clearRestoreTimeout = () => {
        if (restoreTimeout === null) return;
        window.clearTimeout(restoreTimeout);
        restoreTimeout = null;
      };
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        clearRestoreTimeout();
        restoreTimeout = window.setTimeout(
          handleRuntimeFailure,
          WEBGL_CONTEXT_RESTORE_TIMEOUT_MS
        );
      };
      const handleContextRestored = () => clearRestoreTimeout();

      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
      contextCleanupRef.current = () => {
        clearRestoreTimeout();
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      };
    },
    [attempt, handleRuntimeFailure]
  );

  useEffect(() => {
    if (motionLevel < 2 || terminalFailure || readyAttempts.current.has(attempt)) return;

    const timeout = window.setTimeout(() => {
      if (!readyAttempts.current.has(attempt)) handleFailure();
    }, CANVAS_INITIALIZATION_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [attempt, handleFailure, motionLevel, terminalFailure]);

  useEffect(() => {
    if (motionLevel >= 2 && !terminalFailure) return;
    contextCleanupRef.current?.();
    contextCleanupRef.current = null;
  }, [motionLevel, terminalFailure]);

  useEffect(
    () => () => {
      contextCleanupRef.current?.();
      contextCleanupRef.current = null;
    },
    []
  );

  if (motionLevel < 2 || terminalFailure) {
    return <ExploreFallback poster={poster} label={fallbackLabel} />;
  }

  const fallback = <ExploreFallback poster={poster} label={fallbackLabel} />;

  return (
    <CanvasErrorBoundary
      fallback={fallback}
      resetKey={attempt}
      onFailure={handleFailure}
    >
      <Canvas
        key={attempt}
        role="img"
        aria-label={canvasLabel}
        dpr={DPR_BY_QUALITY[quality]}
        frameloop="demand"
        onCreated={handleCreated}
        gl={{
          antialias: quality !== "low",
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: true
        }}
        fallback={fallback}
      >
        <AdaptiveQualityProbe
          initialQuality={quality}
          onQualityChange={onQualityChange ?? (() => undefined)}
        />
        {children}
      </Canvas>
    </CanvasErrorBoundary>
  );
}

import { Canvas } from "@react-three/fiber";
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
import type { MotionLevel } from "../../motion/preferences/MotionPreferenceService";
import { ExploreFallback } from "./ExploreFallback";

export interface ExploreCanvasProps {
  readonly motionLevel: MotionLevel;
  readonly quality: QualityProfile;
  readonly poster: string;
  readonly fallbackLabel: string;
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
  children
}: ExploreCanvasProps) {
  const [attempt, setAttempt] = useState<0 | 1>(0);
  const [terminalFailure, setTerminalFailure] = useState(false);
  const failedAttempts = useRef(new Set<number>());
  const readyAttempts = useRef(new Set<number>());

  const handleFailure = useCallback(() => {
    if (failedAttempts.current.has(attempt)) return;
    failedAttempts.current.add(attempt);

    if (attempt === 0) setAttempt(1);
    else setTerminalFailure(true);
  }, [attempt]);

  const handleCreated = useCallback(() => {
    readyAttempts.current.add(attempt);
  }, [attempt]);

  useEffect(() => {
    if (motionLevel < 2 || terminalFailure || readyAttempts.current.has(attempt)) return;

    const timeout = window.setTimeout(() => {
      if (!readyAttempts.current.has(attempt)) handleFailure();
    }, CANVAS_INITIALIZATION_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [attempt, handleFailure, motionLevel, terminalFailure]);

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
        aria-label="Visualización espacial de capacidades de IzignaMx"
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
        {children}
      </Canvas>
    </CanvasErrorBoundary>
  );
}

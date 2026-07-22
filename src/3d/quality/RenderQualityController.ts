import type { MotionLevel } from "../../motion/preferences/MotionPreferenceService";

export type QualityProfile = "low" | "medium" | "high";

export interface QualitySignals {
  readonly width: number;
  readonly memoryGb?: number;
  readonly cores?: number;
  readonly motionLevel: MotionLevel;
}

const DEFAULT_MEMORY_GB = 4;
const DEFAULT_CORES = 4;
const SLOW_FRAME_THRESHOLD_MS = 20;

const LOWER_QUALITY: Record<QualityProfile, QualityProfile> = {
  high: "medium",
  medium: "low",
  low: "low"
};

function positiveFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function assertFrameDuration(milliseconds: number): void {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("Average frame time must be a finite, non-negative number");
  }
}

export function selectInitialQuality(signals: QualitySignals): QualityProfile {
  const width = positiveFiniteNumber(signals.width, 0);
  const memoryGb = positiveFiniteNumber(signals.memoryGb, DEFAULT_MEMORY_GB);
  const cores = positiveFiniteNumber(signals.cores, DEFAULT_CORES);

  if (signals.motionLevel < 2 || width < 768 || memoryGb <= 4 || cores <= 4) return "low";
  if (width < 1440 || memoryGb < 8 || cores < 8) return "medium";
  return "high";
}

export class RenderQualityController {
  constructor(private current: QualityProfile) {}

  get profile(): QualityProfile {
    return this.current;
  }

  observeAverageFrameTime(milliseconds: number): QualityProfile {
    assertFrameDuration(milliseconds);

    if (milliseconds > SLOW_FRAME_THRESHOLD_MS) {
      this.current = LOWER_QUALITY[this.current];
    }

    return this.current;
  }
}

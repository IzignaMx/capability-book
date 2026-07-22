const SAMPLE_WINDOW_SIZE = 120;

function assertFrameDuration(milliseconds: number): void {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("Frame time must be a finite, non-negative number");
  }
}

export class FrameSampler {
  private sampleCount = 0;
  private totalMilliseconds = 0;

  push(milliseconds: number): number | null {
    assertFrameDuration(milliseconds);

    this.sampleCount += 1;
    this.totalMilliseconds += milliseconds;

    if (this.sampleCount < SAMPLE_WINDOW_SIZE) return null;

    const average = this.totalMilliseconds / this.sampleCount;
    this.reset();
    return average;
  }

  reset(): void {
    this.sampleCount = 0;
    this.totalMilliseconds = 0;
  }
}

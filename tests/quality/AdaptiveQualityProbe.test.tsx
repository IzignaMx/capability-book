import { act, render } from "@testing-library/react";
import type { RootState } from "@react-three/fiber";
import { beforeEach, describe, expect, it, vi } from "vitest";

const qualityHarness = vi.hoisted(() => ({
  frame: undefined as ((state: RootState, delta: number) => void) | undefined,
  invalidate: vi.fn(),
  setDpr: vi.fn(),
  canvas: document.createElement("canvas")
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: (state: RootState, delta: number) => void) => {
    qualityHarness.frame = callback;
  },
  useThree: (selector: (state: RootState) => unknown) =>
    selector({
      invalidate: qualityHarness.invalidate,
      setDpr: qualityHarness.setDpr,
      gl: { domElement: qualityHarness.canvas }
    } as unknown as RootState)
}));

import { AdaptiveQualityProbe } from "../../src/3d/quality/AdaptiveQualityProbe";

describe("AdaptiveQualityProbe", () => {
  beforeEach(() => {
    qualityHarness.frame = undefined;
    qualityHarness.invalidate.mockClear();
    qualityHarness.setDpr.mockClear();
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2
    });
  });

  it("uses the R3F frame loop to downgrade one tier after 120 slow samples", () => {
    const onQualityChange = vi.fn();
    const requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame");
    render(
      <AdaptiveQualityProbe initialQuality="high" onQualityChange={onQualityChange} />
    );

    expect(qualityHarness.frame).toBeTypeOf("function");
    act(() => qualityHarness.frame?.({} as RootState, 0.021));
    for (let index = 0; index < 120; index += 1) {
      act(() => qualityHarness.frame?.({} as RootState, 0.021));
    }

    expect(onQualityChange).toHaveBeenCalledWith("medium");
    expect(qualityHarness.setDpr).toHaveBeenCalledWith(1.75);
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import {
  RenderQualityController,
  selectInitialQuality
} from "../../src/3d/quality/RenderQualityController";
import { FrameSampler } from "../../src/3d/quality/frameSampler";

describe("render quality", () => {
  it("starts low on mobile or constrained hardware", () => {
    expect(
      selectInitialQuality({ width: 390, memoryGb: 4, cores: 4, motionLevel: 3 })
    ).toBe("low");
    expect(
      selectInitialQuality({ width: 1920, memoryGb: 8, cores: 8, motionLevel: 1 })
    ).toBe("low");
    expect(
      selectInitialQuality({ width: 1920, memoryGb: 4, cores: 8, motionLevel: 3 })
    ).toBe("low");
  });

  it("starts medium for mid-range devices and low for unknown hardware", () => {
    expect(
      selectInitialQuality({ width: 1024, memoryGb: 8, cores: 8, motionLevel: 3 })
    ).toBe("medium");
    expect(
      selectInitialQuality({ width: 1920, memoryGb: 6, cores: 8, motionLevel: 3 })
    ).toBe("medium");
    expect(selectInitialQuality({ width: 1920, motionLevel: 3 })).toBe("low");
  });

  it("starts high only when every capability threshold is met", () => {
    expect(
      selectInitialQuality({ width: 1440, memoryGb: 8, cores: 8, motionLevel: 2 })
    ).toBe("high");
  });

  it("downgrades after sustained slow frames and never upgrades automatically", () => {
    const controller = new RenderQualityController("high");

    expect(controller.observeAverageFrameTime(24)).toBe("medium");
    expect(controller.observeAverageFrameTime(30)).toBe("low");
    expect(controller.observeAverageFrameTime(10)).toBe("low");
    expect(controller.profile).toBe("low");
  });

  it("does not downgrade at the exact frame-time threshold", () => {
    const controller = new RenderQualityController("high");

    expect(controller.observeAverageFrameTime(20)).toBe("high");
  });

  it("rejects invalid average frame times", () => {
    const controller = new RenderQualityController("high");

    expect(() => controller.observeAverageFrameTime(Number.NaN)).toThrow(RangeError);
    expect(() => controller.observeAverageFrameTime(-1)).toThrow(RangeError);
  });

  it("returns one average for each complete 120-frame window", () => {
    const sampler = new FrameSampler();

    for (let index = 0; index < 119; index += 1) {
      expect(sampler.push(16)).toBeNull();
    }

    expect(sampler.push(32)).toBeCloseTo((119 * 16 + 32) / 120);
    expect(sampler.push(10)).toBeNull();
  });

  it("can reset a partial frame window", () => {
    const sampler = new FrameSampler();

    for (let index = 0; index < 60; index += 1) sampler.push(10);
    sampler.reset();
    for (let index = 0; index < 60; index += 1) expect(sampler.push(30)).toBeNull();
  });

  it("rejects invalid raw frame times", () => {
    const sampler = new FrameSampler();

    expect(() => sampler.push(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => sampler.push(-1)).toThrow(RangeError);
  });
});

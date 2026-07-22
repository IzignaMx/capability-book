import { describe, expect, it, vi } from "vitest";
import {
  readMotionSignals,
  resolveMotionPolicy
} from "../../src/motion/preferences/MotionPreferenceService";

describe("motion policy", () => {
  it("selects static for reduced motion, save data, or WebGL failure", () => {
    expect(
      resolveMotionPolicy({
        reducedMotion: true,
        saveData: false,
        webgl: true,
        memoryGb: 8,
        cores: 8
      })
    ).toBe(0);
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: true,
        webgl: true,
        memoryGb: 8,
        cores: 8
      })
    ).toBe(0);
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: false,
        webgl: false,
        memoryGb: 8,
        cores: 8
      })
    ).toBe(0);
  });

  it("limits low-resource devices to interface motion", () => {
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: false,
        webgl: true,
        memoryGb: 2,
        cores: 8
      })
    ).toBe(1);
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: false,
        webgl: true,
        memoryGb: 8,
        cores: 2
      })
    ).toBe(1);
  });

  it("uses scroll choreography for mid-range or unknown hardware", () => {
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: false,
        webgl: true,
        memoryGb: 4,
        cores: 8
      })
    ).toBe(2);
    expect(
      resolveMotionPolicy({ reducedMotion: false, saveData: false, webgl: true })
    ).toBe(2);
  });

  it("allows advanced scenes only on capable devices", () => {
    expect(
      resolveMotionPolicy({
        reducedMotion: false,
        saveData: false,
        webgl: true,
        memoryGb: 8,
        cores: 8
      })
    ).toBe(3);
  });

  it("does not probe WebGL when reduced motion is requested", () => {
    const createElement = vi.spyOn(document, "createElement");
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true } satisfies Pick<MediaQueryList, "matches">)
    );

    try {
      expect(readMotionSignals()).toMatchObject({ reducedMotion: true, webgl: false });
      expect(createElement).not.toHaveBeenCalled();
    } finally {
      createElement.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("returns a static-compatible signal set outside a browser runtime", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    try {
      expect(readMotionSignals()).toEqual({
        reducedMotion: false,
        saveData: false,
        webgl: false
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

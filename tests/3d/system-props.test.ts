// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  clampParticleCount,
  generateParticlePositions
} from "../../src/3d/systems/ParticleField";
import {
  createIzCoreTransforms,
  DEFAULT_ENERGY_COLOR
} from "../../src/3d/systems/IzCore";
import {
  createTelemetryTransforms,
  normalizeTelemetryProgress,
  normalizeTelemetrySegments
} from "../../src/3d/systems/TelemetryRing";

describe("reusable spatial systems", () => {
  it("clamps particle workloads to the selected quality profile", () => {
    expect(clampParticleCount(10_000, "low")).toBe(800);
    expect(clampParticleCount(10_000, "medium")).toBe(2_000);
    expect(clampParticleCount(10_000, "high")).toBe(5_000);
    expect(clampParticleCount(-5, "high")).toBe(0);
    expect(clampParticleCount(Number.NaN, "high")).toBe(0);
  });

  it("generates stable positions for the same seed and distinct fields for new seeds", () => {
    const options = { count: 12, seed: 731, radius: 4, quality: "high" } as const;
    const first = generateParticlePositions(options);
    const second = generateParticlePositions(options);
    const different = generateParticlePositions({ ...options, seed: 732 });

    expect(first).toBeInstanceOf(Float32Array);
    expect(first).toHaveLength(36);
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(Array.from(first)).not.toEqual(Array.from(different));
  });

  it("uses the canonical IzignaMx blue as its default energy color", () => {
    expect(DEFAULT_ENERGY_COLOR).toBe("#3b82f6");
  });

  it("normalizes telemetry topology and produces deterministic instanced matrices", () => {
    expect(normalizeTelemetrySegments(2)).toBe(3);
    expect(normalizeTelemetrySegments(1_000)).toBe(256);
    expect(normalizeTelemetryProgress(-1)).toBe(0);
    expect(normalizeTelemetryProgress(2)).toBe(1);

    const first = createTelemetryTransforms(2, 12, 0.4);
    const second = createTelemetryTransforms(2, 12, 0.4);
    const advanced = createTelemetryTransforms(2, 12, 0.7);

    expect(first.count).toBe(12);
    expect(first.matrices).toHaveLength(12 * 16);
    expect(Array.from(first.matrices)).toEqual(Array.from(second.matrices));
    expect(Array.from(first.matrices)).not.toEqual(Array.from(advanced.matrices));
  });

  it("moves every core module into its assembled position deterministically", () => {
    const dispersed = createIzCoreTransforms(0);
    const assembled = createIzCoreTransforms(1);

    expect(dispersed).toHaveLength(4);
    expect(assembled).toHaveLength(4);
    expect(dispersed).not.toEqual(assembled);
    expect(createIzCoreTransforms(1)).toEqual(assembled);
    expect(createIzCoreTransforms(Number.POSITIVE_INFINITY)).toEqual(dispersed);
  });

  it("contains none of the prohibited warm identity literals", () => {
    const source = ["ParticleField", "IzCore", "TelemetryRing"]
      .map((name) =>
        readFileSync(
          new URL(`../../src/3d/systems/${name}.tsx`, import.meta.url),
          "utf8"
        )
      )
      .join("\n");
    const prohibited = new RegExp(
      ["#ff" + "6a1a", "#f9" + "7316", "ora" + "nge"].join("|"),
      "i"
    );

    expect(source).not.toMatch(prohibited);
  });
});

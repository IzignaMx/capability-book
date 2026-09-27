// @vitest-environment node
import { test, expect } from "vitest";
const m: any = await import("../atlas/book/constellation-model").catch(() => ({}));
test("project coordinates are deterministic, bounded and unique", () => {
  expect(typeof m.nodePosition).toBe("function");
  const points = Array.from({ length: 6 }, (_, i) => m.nodePosition(i, 1));
  expect(new Set(points.map((p) => p.join(","))).size).toBe(6);
  for (const p of points)
    expect(p.every((x: number) => Number.isFinite(x) && Math.abs(x) < 6)).toBe(true);
});
test("invalid controls are bounded and spread changes geometry", () => {
  expect(typeof m.normalizeView).toBe("function");
  expect(m.normalizeView({ zoom: Infinity, spread: NaN })).toEqual({ zoom: 10, spread: 1 });
  expect(m.nodePosition(2, 0.7)).not.toEqual(m.nodePosition(2, 1.4));
});

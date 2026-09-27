export function normalizeView(v: { zoom?: number; spread?: number }) {
  const n = (x: unknown, f: number, a: number, b: number) =>
    typeof x === "number" && Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : f;
  return { zoom: n(v.zoom, 10, 6, 15), spread: n(v.spread, 1, 0.6, 1.5) };
}
export function nodePosition(index: number, spread = 1, count = 6): [number, number, number] {
  const s = normalizeView({ spread }).spread,
    a = (index * Math.PI * 2) / Math.max(1, Math.min(64, Number.isFinite(count) ? Math.trunc(count) : 6)) + 0.3,
    r = 2.7 * s;
  return [Math.cos(a) * r, Math.sin(index * 2.1) * 1.05 * s, Math.sin(a) * r];
}

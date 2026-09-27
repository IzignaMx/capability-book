// @vitest-environment node
import { describe, test, expect } from "vitest";
const m: any = await import("../atlas/book/model").catch(() => ({}));
describe("Book atlas contracts", () => {
  test("all six published cases remain bilingual", () => {
    expect(m.projects?.length).toBe(6);
    for (const p of m.projects) {
      expect(p.es.title.length).toBeGreaterThan(2);
      expect(p.en.title.length).toBeGreaterThan(2);
      expect(p.es.chapters.length).toBeGreaterThan(4);
      expect(p.media.length).toBeGreaterThan(0);
    }
  });
  test("routes recognize original Spanish and English case URLs", () => {
    expect(m.parseRoute?.("/es/proyectos/omnisync/")).toEqual({
      locale: "es",
      page: "case",
      slug: "omnisync",
    });
    expect(m.parseRoute?.("/en/projects/vald/")).toEqual({
      locale: "en",
      page: "case",
      slug: "vald",
    });
    expect(m.parseRoute?.("/es/proyectos/__proto__/")).toBeNull();
    expect(m.parseRoute?.("/fr/")).toBeNull();
  });
  test("selection is allowlisted, deduplicated and limited", () => {
    expect(m.cleanSelection?.("omnisync,omnisync,unknown,vald,tecuiyo,nutrichilango")).toEqual([
      "omnisync",
      "vald",
      "tecuiyo",
    ]);
    expect(m.cleanSelection?.("__proto__")).toEqual([]);
  });
  test("search normalizes accents and combines with category", () => {
    expect(m.filterProjects?.("nutricion", "all", "es").map((p: any) => p.slug)).toContain(
      "nutrichilango",
    );
    expect(m.filterProjects?.("omnisync", "commerce", "es").map((p: any) => p.slug)).toEqual([
      "omnisync",
    ]);
    expect(m.filterProjects?.("nada-que-existe", "all", "es")).toEqual([]);
  });
  test("brief does not invent a send or persist personal fields", () => {
    const r = m.prepareBrief?.(
      {
        name: "Ana",
        goal: "Mejorar mi tienda",
        email: "",
        channel: "whatsapp",
        projects: ["omnisync"],
        details: "Necesito integrar inventario",
      },
      "es",
    );
    expect(r?.ok).toBe(true);
    expect(r?.text).toContain("OmniSync");
    expect(r?.href?.startsWith("https://wa.me/")).toBe(true);
    expect(m.prepareBrief?.({ name: "", goal: "", channel: "email", email: "no" }, "es").ok).toBe(
      false,
    );
  });
  test("private sources are not offered as public evidence", () => {
    const p = m.projects?.find((p: any) => p.slug === "omnisync");
    expect(p?.links.length).toBe(0);
    expect(p?.classification).toBe("internal");
  });
  test("generated route collection has no duplicates", () => {
    expect(m.allRoutes?.length).toBeGreaterThan(20);
    expect(new Set(m.allRoutes).size).toBe(m.allRoutes?.length);
  });
});

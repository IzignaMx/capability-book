// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const qualitySource = readFileSync(
  new URL("../src/components/explore/QualityScan.astro", import.meta.url),
  "utf8"
);
const uplinkSource = readFileSync(
  new URL("../src/components/explore/UplinkCTA.astro", import.meta.url),
  "utf8"
);
const accessibilitySources = [
  "es/accesibilidad.astro",
  "en/accessibility.astro"
].map((route) =>
  readFileSync(new URL(`../src/pages/${route}`, import.meta.url), "utf8")
);

describe("quality scan and conversion uplink", () => {
  it("defines exactly six traceable quality categories", () => {
    const categoryIds = [
      ...qualitySource.matchAll(/^\s+id: "([a-z]+)",$/gm)
    ].map((match) => match[1]);

    expect(categoryIds).toEqual([
      "accessibility",
      "performance",
      "security",
      "testing",
      "seo",
      "deployment"
    ]);
    expect(qualitySource).toContain("scripts/verify-budgets.ts");
    expect(qualitySource).toContain("actions/workflows/quality.yml");
    expect(qualitySource).toContain("/sitemap-index.xml");
    expect(qualitySource).not.toMatch(/\b(?:9\d|100)(?:\s*%|\/100)\b/);
  });

  it("keeps the final uplink contextual, bilingual, and privacy-linked", () => {
    expect(uplinkSource).toContain("Conectemos tu siguiente sistema.");
    expect(uplinkSource).toContain("Let's connect your next system.");
    expect(uplinkSource).toContain("concept=quality-scan&service=web-experiences");
    expect(uplinkSource).toContain("/es/privacidad/");
    expect(uplinkSource).toContain("/en/privacy/");
    expect(uplinkSource).not.toMatch(/urgente|última oportunidad|limited time/i);
  });

  it("renders both final chapters as server HTML in each locale", () => {
    for (const locale of ["es", "en"] as const) {
      const page = readFileSync(
        new URL(`../src/pages/${locale}/index.astro`, import.meta.url),
        "utf8"
      );
      expect(page).toContain(`<QualityScan locale="${locale}" />`);
      expect(page).toContain(`<UplinkCTA locale="${locale}"`);
    }
  });

  it("documents the live reduce/restore control rather than a future promise", () => {
    for (const source of accessibilitySources) {
      expect(source).not.toMatch(/Antes de activar experiencias|Before advanced experiences/i);
      expect(source).toMatch(/Restaurar movimiento avanzado|Restore advanced motion/);
    }
  });
});

import { describe, expect, it } from "vitest";
import type { ProjectVisualEvidence } from "../src/domain/projects/PortfolioProject";
import {
  canonicalCoverKey,
  resolveProjectVisual,
  type ProjectVisualSource
} from "../src/domain/projects/projectVisualResolver";

const evidence: ProjectVisualEvidence = {
  id: "home-production",
  role: "screenshot",
  path: "/media/projects/tecuiyo/evidence/home-desktop.avif",
  width: 1440,
  height: 900,
  alt: "Portada de producción de Tecuiyo.",
  caption: "Captura revisada.",
  license: "owned",
  variants: {
    mobile: {
      avif: "/media/projects/tecuiyo/evidence/home-mobile.avif",
      webp: "/media/projects/tecuiyo/evidence/home-mobile.webp",
      width: 390,
      height: 844,
      avifSha256: "a".repeat(64),
      webpSha256: "b".repeat(64)
    },
    desktop: {
      avif: "/media/projects/tecuiyo/evidence/home-desktop.avif",
      webp: "/media/projects/tecuiyo/evidence/home-desktop.webp",
      width: 1440,
      height: 900,
      avifSha256: "c".repeat(64),
      webpSha256: "d".repeat(64)
    }
  },
  provenance: {
    kind: "direct-production-capture",
    repository: "https://github.com/IzignaMx/tecuiyo",
    commit: "a".repeat(40),
    sourceUrl: "https://tecuiyo.izignamx.com/",
    capturedAt: "2026-08-02T00:00:00.000Z",
    rightsBasis: "IzignaMx-approved portfolio evidence.",
    approvedBy: "IzignaMx",
    reviewedAt: "2026-08-02"
  }
};

const project: ProjectVisualSource = {
  slug: "tecuiyo",
  locale: "es",
  title: "Tecuiyo",
  fallbackPoster: "/media/projects/tecuiyo/poster.avif",
  visualEvidence: [evidence]
};

const projectWithoutEvidence: ProjectVisualSource = {
  ...project,
  slug: "omnisync",
  title: "OmniSync",
  fallbackPoster: "/media/projects/omnisync/poster.avif",
  visualEvidence: []
};

describe("resolveProjectVisual", () => {
  it("resolves the same canonical asset across all cover contexts (rule 9)", () => {
    const keys = ["catalog-cover", "explore-encounter", "case-study-cover"].map((context) =>
      canonicalCoverKey(project, context as "catalog-cover")
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe("evidence:/media/projects/tecuiyo/evidence/home-desktop.webp:8/5");
  });

  it("never uses the vertical mobile variant inside a landscape cover (rule 4)", () => {
    for (const context of ["catalog-cover", "explore-encounter", "case-study-cover"] as const) {
      const visual = resolveProjectVisual(project, context);
      expect(visual.mobile).toBeNull();
      expect(visual.desktop.src).toBe("/media/projects/tecuiyo/evidence/home-desktop.webp");
      expect(visual.aspectRatio).toBe("8 / 5");
    }
  });

  it("keeps the vertical mobile variant only for full-evidence", () => {
    const visual = resolveProjectVisual(project, "full-evidence");
    expect(visual.mobile).not.toBeNull();
    expect(visual.mobile?.src).toBe("/media/projects/tecuiyo/evidence/home-mobile.webp");
    expect(visual.aspectRatio).toBe("390 / 844");
  });

  it("keeps a non-empty alt for informative evidence", () => {
    const visual = resolveProjectVisual(project, "catalog-cover");
    expect(visual.alt.length).toBeGreaterThan(0);
    expect(visual.alt).toBe("Portada de producción de Tecuiyo.");
  });

  it("falls back to the approved 8:5 poster derivative when evidence is missing (rule 6)", () => {
    const visual = resolveProjectVisual(projectWithoutEvidence, "catalog-cover");
    expect(visual.sourceKind).toBe("fallback");
    expect(visual.stateKind).toBe("illustrative");
    expect(visual.desktop.src).toBe("/media/projects/omnisync/poster-cover.avif");
    expect(visual.desktop.width).toBe(1280);
    expect(visual.desktop.height).toBe(800);
    expect(visual.aspectRatio).toBe("8 / 5");
    expect(visual.alt).toBe("Portada ilustrativa de OmniSync");
  });

  it("falls back to the approved poster for full-evidence without evidence", () => {
    const visual = resolveProjectVisual(projectWithoutEvidence, "full-evidence");
    expect(visual.sourceKind).toBe("fallback");
    expect(visual.desktop.src).toBe("/media/projects/omnisync/poster.avif");
    expect(visual.aspectRatio).toBe("16 / 9");
  });

  it("applies per-project overrides only when provided (rule 5)", () => {
    const visual = resolveProjectVisual(
      project,
      "catalog-cover",
      {},
      { objectPosition: "center 30%", fit: "contain" }
    );
    expect(visual.objectPosition).toBe("center 30%");
    expect(visual.objectFit).toBe("contain");

    const defaultVisual = resolveProjectVisual(project, "catalog-cover");
    expect(defaultVisual.objectPosition).toBe("top center");
    expect(defaultVisual.objectFit).toBe("cover");
  });

  it("loads eagerly only above-the-fold case-study covers (rule 9)", () => {
    expect(resolveProjectVisual(project, "case-study-cover").loading).toBe("eager");
    expect(resolveProjectVisual(project, "case-study-cover").fetchPriority).toBe("high");
    expect(resolveProjectVisual(project, "catalog-cover").loading).toBe("lazy");
    expect(resolveProjectVisual(project, "catalog-cover").fetchPriority).toBe("auto");
    expect(resolveProjectVisual(project, "explore-encounter").loading).toBe("lazy");
  });

  it("preserves the evidence state kind for accessible labeling (rule 7)", () => {
    const visual = resolveProjectVisual(project, "catalog-cover");
    expect(visual.stateKind).toBe("direct-production-capture");
    expect(visual.caption).toContain("Captura directa de producción");
  });
});
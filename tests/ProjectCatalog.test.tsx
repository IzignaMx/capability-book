import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectCatalog } from "../src/components/projects/ProjectCatalog";
import type { PortfolioProject, ProjectVisualEvidence } from "../src/domain/projects/PortfolioProject";

const visualEvidence: ProjectVisualEvidence = {
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

function project(
  slug: string,
  title: string,
  capabilities: string[],
  evidence: ProjectVisualEvidence[] = []
): PortfolioProject {
  return {
    slug,
    locale: "es",
    classification: "real",
    title,
    elevatorPitch: `${title} convierte evidencia en una experiencia verificable.`,
    challenge: `Reto de ${title}`,
    constraints: ["Evidencia pública"],
    strategy: `Estrategia de ${title}`,
    solution: `Solución de ${title}`,
    capabilities,
    industries: ["Technology"],
    technologies: ["TypeScript"],
    outcomes: [],
    fallbackPoster: `/media/projects/${slug}/poster.avif`,
    visualEvidence: evidence,
    confidentiality: "public",
    accessibilityNotes: ["Static parity"],
    relatedServices: ["Engineering"],
    ctaPreset: slug
  };
}

const projects = [
  project("omnisync", "OmniSync", ["Commerce Systems"]),
  project("tecuiyo", "Tecuiyo", ["Web Experiences"], [visualEvidence])
];

describe("ProjectCatalog", () => {
  it("filters and announces the localized result count", async () => {
    const user = userEvent.setup();
    render(<ProjectCatalog locale="es" projects={projects} />);

    await user.type(screen.getByRole("searchbox", { name: "Buscar proyectos" }), "Omni");

    expect(screen.getByRole("status")).toHaveTextContent("1 proyecto");
    expect(screen.getByRole("link", { name: /Abrir caso: OmniSync/i })).toHaveAttribute(
      "href",
      "/es/proyectos/omnisync/"
    );
    expect(screen.queryByRole("heading", { name: "Tecuiyo" })).not.toBeInTheDocument();
  });

  it("filters by one visibly labeled capability", async () => {
    const user = userEvent.setup();
    render(<ProjectCatalog locale="es" projects={projects} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Capacidad" }), "Web Experiences");

    expect(screen.getByRole("status")).toHaveTextContent("1 proyecto");
    expect(screen.getByRole("heading", { name: "Tecuiyo" })).toBeInTheDocument();
  });

  it("prioritizes canonical landscape evidence and retains an illustrative fallback", () => {
    const { container } = render(<ProjectCatalog locale="es" projects={projects} />);

    const productionCover = container
      .querySelector(
        '[data-project-cover][data-cover-context="catalog-cover"] img[src="/media/projects/tecuiyo/evidence/home-desktop.webp"]'
      )
      ?.closest('[data-project-cover]');
    expect(productionCover).toHaveAttribute("data-cover-kind", "direct-production-capture");
    expect(productionCover).toHaveAttribute("data-cover-src", "evidence");
    expect(productionCover?.querySelector("img")).toHaveAttribute(
      "src",
      "/media/projects/tecuiyo/evidence/home-desktop.webp"
    );
    expect(productionCover?.querySelector("img")).toHaveAttribute("alt", "Portada de producción de Tecuiyo.");
    expect(productionCover?.querySelector("img")).toHaveAttribute("width", "1440");
    expect(productionCover?.querySelector("img")).toHaveAttribute("height", "900");
    expect(productionCover?.querySelector('source[type="image/avif"]')).toHaveAttribute(
      "srcset",
      "/media/projects/tecuiyo/evidence/home-desktop.avif"
    );
    expect(productionCover?.querySelector('source[media*="40rem"]')).toBeNull();

    const fallback = container.querySelector('img[src="/media/projects/omnisync/poster-cover.avif"]');
    expect(fallback).toHaveAttribute("alt", "Portada ilustrativa de OmniSync");
    expect(fallback).toHaveAttribute("width", "1280");
    expect(fallback).toHaveAttribute("height", "800");
  });
});

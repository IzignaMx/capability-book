import { describe, expect, it } from "vitest";
import type {
  PortfolioProject,
  ProjectClassification
} from "../src/domain/projects/PortfolioProject";
import { filterProjects } from "../src/features/evaluate-mode/projectFilters";

function project(
  slug: string,
  options: {
    locale?: "es" | "en";
    title: string;
    capabilities: string[];
    industries?: string[];
    technologies?: string[];
    classification?: ProjectClassification;
  }
): PortfolioProject {
  return {
    slug,
    locale: options.locale ?? "es",
    classification: options.classification ?? "real",
    title: options.title,
    elevatorPitch: `${options.title} entrega una experiencia verificable.`,
    challenge: `Reto de ${options.title}`,
    constraints: ["Evidencia pública"],
    strategy: `Estrategia de ${options.title}`,
    solution: `Solución de ${options.title}`,
    capabilities: options.capabilities,
    industries: options.industries ?? ["Technology"],
    technologies: options.technologies ?? ["TypeScript"],
    outcomes: [
      {
        kind: "demonstrated-capability",
        label: "Built",
        description: "Observable implementation"
      }
    ],
    fallbackPoster: `/media/projects/${slug}/poster.avif`,
    confidentiality: "public",
    accessibilityNotes: ["Static parity"],
    relatedServices: ["Engineering"],
    ctaPreset: slug
  };
}

const projects = [
  project("automation", {
    title: "Automatización ágil",
    capabilities: ["AI and Automation", "Developer Products"],
    industries: ["Commerce", "Technology"],
    technologies: ["TypeScript", "Python"],
    classification: "open-source"
  }),
  project("website", {
    title: "Website",
    capabilities: ["Web Experiences"],
    industries: ["Technology"],
    technologies: ["Astro"]
  }),
  project("english", {
    locale: "en",
    title: "Automation platform",
    capabilities: ["AI and Automation"]
  })
];

describe("filterProjects", () => {
  it("combines text and capability filters", () => {
    const result = filterProjects(projects, {
      locale: "es",
      capabilities: ["AI and Automation"],
      text: "auto"
    });

    expect(result.map((item) => item.slug)).toEqual(["automation"]);
  });

  it("normalizes case, surrounding whitespace, and diacritics", () => {
    const result = filterProjects(projects, {
      locale: "es",
      text: "  AUTOMATIZACION AGIL  "
    });

    expect(result.map((item) => item.slug)).toEqual(["automation"]);
  });

  it("requires every selected value within each filter dimension", () => {
    const result = filterProjects(projects, {
      locale: "es",
      capabilities: ["AI and Automation", "Developer Products"],
      industries: ["Commerce", "Technology"],
      technologies: ["TypeScript", "Python"],
      classification: ["open-source"]
    });

    expect(result.map((item) => item.slug)).toEqual(["automation"]);
  });

  it("always limits results to the requested locale", () => {
    const result = filterProjects(projects, {
      locale: "en",
      capabilities: ["AI and Automation"]
    });

    expect(result.map((item) => item.slug)).toEqual(["english"]);
  });

  it("preserves source order without mutating the input", () => {
    const originalOrder = projects.map((item) => item.slug);
    const result = filterProjects(projects, { locale: "es" });

    expect(result.map((item) => item.slug)).toEqual(["automation", "website"]);
    expect(projects.map((item) => item.slug)).toEqual(originalOrder);
  });
});

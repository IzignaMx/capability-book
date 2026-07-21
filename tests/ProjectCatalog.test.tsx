import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectCatalog } from "../src/components/projects/ProjectCatalog";
import type { PortfolioProject } from "../src/domain/projects/PortfolioProject";

function project(
  slug: string,
  title: string,
  capabilities: string[]
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
    confidentiality: "public",
    accessibilityNotes: ["Static parity"],
    relatedServices: ["Engineering"],
    ctaPreset: slug
  };
}

const projects = [
  project("omnisync", "OmniSync", ["Commerce Systems"]),
  project("tecuiyo", "Tecuiyo", ["Web Experiences"])
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
});

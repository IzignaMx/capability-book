import { describe, expect, it } from "vitest";
import type {
  PortfolioProject,
  ProjectClassification
} from "../src/domain/projects/PortfolioProject";

describe("portfolio domain", () => {
  it("accepts the canonical classification vocabulary", () => {
    const classifications: ProjectClassification[] = [
      "real",
      "open-source",
      "internal",
      "concept"
    ];

    expect(classifications).toHaveLength(4);
  });

  it("requires locale and evidence-backed outcomes", () => {
    const project = {
      slug: "omnisync",
      locale: "es",
      classification: "real",
      outcomes: [
        {
          kind: "demonstrated-capability",
          label: "Arquitectura observable",
          description: "La evidencia pública demuestra la capacidad descrita."
        }
      ]
    } satisfies Pick<
      PortfolioProject,
      "slug" | "locale" | "classification" | "outcomes"
    >;

    expect(project.outcomes.at(0)?.kind).toBe("demonstrated-capability");
  });
});

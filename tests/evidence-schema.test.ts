import { readFile } from "node:fs/promises";
import Ajv2020Module from "ajv/dist/2020.js";
import AjvFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";

const Ajv2020 = Ajv2020Module.default;
const addFormats = AjvFormatsModule.default;

const schema = JSON.parse(
  await readFile(new URL("../data/evidence.schema.json", import.meta.url), "utf8")
) as object;

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const validRecord = {
  project: {
    slug: "sample-project",
    title: "Sample Project",
    owner: "IzignaMx",
    summary: "Una descripción suficientemente detallada para validar el registro de evidencia."
  },
  classification: "real",
  publication: {
    confidentiality: "public",
    publishable: true,
    reviewedAt: "2026-07-20"
  },
  proofPoints: [
    {
      kind: "demonstrated-capability",
      label: "Arquitectura modular",
      description: "El sistema demuestra separación explícita de responsabilidades.",
      sourceIds: ["repository"]
    }
  ],
  sources: [
    {
      id: "repository",
      label: "Repositorio público",
      type: "repository",
      url: "https://github.com/IzignaMx/example"
    }
  ],
  links: [
    {
      label: "Sitio público",
      url: "https://example.com/",
      public: true
    }
  ],
  media: [
    {
      id: "fallback-poster",
      role: "fallback-poster",
      path: "/media/sample-project/poster.avif",
      license: "owned"
    }
  ]
};

describe("evidence schema", () => {
  it("accepts a complete, classified evidence record", () => {
    expect(validate(validRecord)).toBe(true);
  });

  it("rejects an unsupported brand spelling and an unclassified outcome", () => {
    const invalidRecord = structuredClone(validRecord);
    invalidRecord.project.title = "Izigna";
    invalidRecord.proofPoints[0]!.kind = "claim";

    expect(validate(invalidRecord)).toBe(false);
  });

  it("rejects a publishable record classified as private", () => {
    const invalidRecord = structuredClone(validRecord);
    invalidRecord.publication.confidentiality = "private";

    expect(validate(invalidRecord)).toBe(false);
  });

  it("requires a licensed fallback poster", () => {
    const invalidRecord = structuredClone(validRecord);
    invalidRecord.media[0]!.role = "screenshot";

    expect(validate(invalidRecord)).toBe(false);
  });
});

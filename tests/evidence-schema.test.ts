// @vitest-environment node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import AjvFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";

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
      path: "/media/projects/sample-project/poster.avif",
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

  it("accepts localized, responsive screenshot evidence with provenance", () => {
    const record = {
      ...structuredClone(validRecord),
      media: [
        ...validRecord.media,
        {
          id: "home-production",
          role: "screenshot",
          path: "/media/projects/sample-project/evidence/home-desktop.avif",
          license: "open-license",
          width: 1440,
          height: 900,
          alt: { es: "Captura directa del proyecto de ejemplo en producción.", en: "Direct production capture of the sample project." },
          caption: { es: "Captura directa verificada del sitio público.", en: "Verified direct capture of the public site." },
          variants: {
            mobile: {
              avif: "/media/projects/sample-project/evidence/home-mobile.avif",
              webp: "/media/projects/sample-project/evidence/home-mobile.webp",
              width: 390,
              height: 844,
              avifSha256: "a".repeat(64),
              webpSha256: "b".repeat(64)
            },
            desktop: {
              avif: "/media/projects/sample-project/evidence/home-desktop.avif",
              webp: "/media/projects/sample-project/evidence/home-desktop.webp",
              width: 1440,
              height: 900,
              avifSha256: "c".repeat(64),
              webpSha256: "d".repeat(64)
            }
          },
          provenance: {
            kind: "direct-production-capture",
            repository: "https://github.com/IzignaMx/example",
            commit: "e".repeat(40),
            sourceUrl: "https://example.com/",
            capturedAt: "2026-08-01T18:44:00Z",
            sourceSha256: { mobile: "f".repeat(64), desktop: "0".repeat(64) },
            rightsBasis: "Open-license project approved for portfolio evidence.",
            approvedBy: "IzignaMx",
            reviewedAt: "2026-08-01"
          }
        }
      ]
    };

    expect(validate(record)).toBe(true);
  });

  it("accepts authorized local-development capture provenance", () => {
    const localScreenshot = {
      id: "home-local-demo",
      role: "screenshot",
      path: "/media/projects/sample-project/evidence/home-desktop.avif",
      license: "owned",
      width: 1440,
      height: 900,
      alt: { es: "Captura local autorizada.", en: "Authorized local capture." },
      caption: { es: "Dashboard demo local.", en: "Local demo dashboard." },
      variants: {
        mobile: {
          avif: "/media/projects/sample-project/evidence/home-mobile.avif",
          webp: "/media/projects/sample-project/evidence/home-mobile.webp",
          width: 390,
          height: 844,
          avifSha256: "a".repeat(64),
          webpSha256: "b".repeat(64)
        },
        desktop: {
          avif: "/media/projects/sample-project/evidence/home-desktop.avif",
          webp: "/media/projects/sample-project/evidence/home-desktop.webp",
          width: 1440,
          height: 900,
          avifSha256: "c".repeat(64),
          webpSha256: "d".repeat(64)
        }
      },
      provenance: {
        kind: "local-development-capture",
        repository: "https://github.com/IzignaMx/example",
        commit: "e".repeat(40),
        sourceUrl: "https://github.com/IzignaMx/example",
        capturedAt: "2026-08-03T04:41:02Z",
        sourceSha256: { mobile: "f".repeat(64), desktop: "0".repeat(64) },
        rightsBasis: "IzignaMx approved this local demo capture for portfolio evidence.",
        approvedBy: "IzignaMx",
        reviewedAt: "2026-08-03"
      }
    };
    const record = { ...structuredClone(validRecord), media: [...validRecord.media, localScreenshot] };

    expect(validate(record)).toBe(true);
  });
});

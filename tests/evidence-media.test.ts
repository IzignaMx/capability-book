// @vitest-environment node

import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const evidenceDirectory = new URL("../data/evidence/", import.meta.url);
const evidenceFigureSource = await readFile(
  new URL("../src/components/projects/ProjectEvidenceFigure.astro", import.meta.url),
  "utf8"
);

describe("published visual evidence", () => {
  it("publishes reviewed captures with provenance that distinguishes production from local development", async () => {
    const files = (await readdir(evidenceDirectory)).filter((file) => file.endsWith(".json"));
    const records = await Promise.all(
      files.map(async (file) => JSON.parse(await readFile(new URL(file, evidenceDirectory), "utf8")) as {
        project: { slug: string };
        media: Array<{
          role: string;
          path: string;
          provenance?: { kind: string };
          variants?: Record<"mobile" | "desktop", { avif: string; webp: string }>;
        }>;
      })
    );

    const captured = records.filter((record) => record.media.some((item) => item.role === "screenshot"));
    expect(captured.map((record) => record.project.slug).sort()).toEqual([
      "developer-tools",
      "hamburguesa-nomada",
      "nutrichilango",
      "omnisync",
      "tecuiyo",
      "vald"
    ]);

    const expectedKinds: Record<string, string> = {
      "developer-tools": "direct-production-capture",
      "hamburguesa-nomada": "direct-production-capture",
      nutrichilango: "direct-production-capture",
      omnisync: "local-development-capture",
      tecuiyo: "direct-production-capture",
      vald: "direct-production-capture"
    };

    for (const record of records) {
      expect(record.media.every((item) => item.path.startsWith(`/media/projects/${record.project.slug}/`))).toBe(true);
      for (const screenshot of record.media.filter((item) => item.role === "screenshot")) {
        expect(screenshot.provenance?.kind).toBe(expectedKinds[record.project.slug]);
        const expectedPrefix = `/media/projects/${record.project.slug}/evidence/`;
        for (const variant of Object.values(screenshot.variants ?? {})) {
          expect(variant.avif.startsWith(expectedPrefix)).toBe(true);
          expect(variant.webp.startsWith(expectedPrefix)).toBe(true);
        }
      }
    }
  });

  it("declares intrinsic dimensions for mobile and desktop picture sources", () => {
    expect(evidenceFigureSource).toMatch(/<source[\s\S]*width=\{evidence\.variants\.mobile\.width\}[\s\S]*height=\{evidence\.variants\.mobile\.height\}/);
    expect(evidenceFigureSource).toMatch(/<source[\s\S]*width=\{evidence\.variants\.desktop\.width\}[\s\S]*height=\{evidence\.variants\.desktop\.height\}/);
  });
});

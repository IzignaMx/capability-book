import { describe, expect, it } from "vitest";
import {
  scanTokenViolations,
  stripComments,
  type TokenScanFile
} from "../scripts/check-tokens.js";

const file = (path: string, content: string): TokenScanFile => ({ path, content });

describe("stripComments", () => {
  it("removes block comments", () => {
    expect(stripComments("a /* comment */ b")).toBe("a  b");
  });

  it("removes line comments but keeps URLs", () => {
    expect(stripComments("a // comment\nb https://example.com")).toBe(
      "a \nb https://example.com"
    );
  });
});

describe("check-tokens", () => {
  it("accepts a defined token consumer", () => {
    const report = scanTokenViolations([
      file("tokens.scss", ":root { --space-5: 1.25rem; }"),
      file("a.scss", ".x { gap: var(--space-5); }")
    ]);
    expect(report.violations).toEqual([]);
  });

  it("reports an undefined token consumer", () => {
    const report = scanTokenViolations([
      file("a.scss", ".x { gap: var(--space-99); }")
    ]);
    expect(report.violations).toEqual([
      { file: "a.scss", line: 1, token: "--space-99" }
    ]);
  });

  it("accepts a consumer with an inline fallback", () => {
    const report = scanTokenViolations([
      file("a.scss", ".x { gap: var(--space-99, 1rem); }")
    ]);
    expect(report.violations).toEqual([]);
  });

  it("ignores tokens inside comments", () => {
    const report = scanTokenViolations([
      file("a.scss", "/* var(--space-99) */ // var(--space-98)\n.x {}")
    ]);
    expect(report.violations).toEqual([]);
  });

  it("tracks unused and cross-file duplicate definitions", () => {
    const report = scanTokenViolations([
      file("tokens.scss", ":root { --unused: 1rem; --dup: 1rem; }"),
      file("b.scss", ":root { --dup: 2rem; } .x { gap: var(--dup); }")
    ]);
    expect(report.unusedTokens).toEqual(["--unused"]);
    expect(report.duplicateDefinitions).toEqual(["--dup"]);
  });

  it("allows media-query re-declarations within the same file", () => {
    const report = scanTokenViolations([
      file(
        "tokens.scss",
        ":root { --page-gutter: 1.5rem; } @media (min-width: 48rem) { :root { --page-gutter: 2rem; } }"
      )
    ]);
    expect(report.duplicateDefinitions).toEqual([]);
  });

  it("scans astro and tsx style blocks", () => {
    const report = scanTokenViolations([
      file("page.astro", "<style>.x { gap: var(--content-gap); }</style>"),
      file("catalog.tsx", "` .card { gap: var(--card-padding); } `"),
      file("tokens.scss", ":root { --content-gap: 1.25rem; --card-padding: 1rem; }")
    ]);
    expect(report.violations).toEqual([]);
  });
});

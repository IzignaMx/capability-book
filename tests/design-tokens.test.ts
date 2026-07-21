import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.scss", "utf8").toLowerCase();

describe("IzignaMx tokens", () => {
  it("uses blue as the brand color and excludes orange identity values", () => {
    expect(tokens).toContain("--color-brand: #3b82f6");
    expect(tokens).not.toMatch(/--color-(brand|accent|primary|focus).*#(?:ff6a1a|f97316)/);
  });

  it("defines accessible focus and motion foundations", () => {
    expect(tokens).toContain("--focus-ring:");
    expect(tokens).toContain("--motion-standard:");
  });
});

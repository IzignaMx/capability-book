import { describe, expect, it } from "vitest";
import { scanBrandViolations } from "../scripts/check-brand.js";

describe("brand guard", () => {
  it("rejects invalid names and orange identity tokens", () => {
    expect(
      scanBrandViolations("IzignaMX --color-brand: #ff6a1a", "sample.css")
    ).toEqual([
      "sample.css: disallowed brand spelling IzignaMX",
      "sample.css: orange cannot be assigned to a global brand token"
    ]);
  });

  it("rejects orange assigned through JSON design tokens", () => {
    expect(
      scanBrandViolations('{"accent":"#f97316"}', "tokens.json")
    ).toEqual([
      "tokens.json: orange cannot be assigned to a global brand token"
    ]);
  });

  it("accepts canonical naming and IzignaMx Blue", () => {
    expect(
      scanBrandViolations(
        "IzignaMx --color-brand: #3b82f6",
        "sample.css"
      )
    ).toEqual([]);
  });
});

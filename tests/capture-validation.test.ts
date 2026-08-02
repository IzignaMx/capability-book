// @vitest-environment node

import { describe, expect, it } from "vitest";
import { detectCaptureChallenge } from "../scripts/capture-validation";

describe("capture challenge validation", () => {
  it.each([
    "Verify you are human",
    "Performing security verification",
    "Attention Required",
    "Cloudflare Ray ID: abc123"
  ])("rejects challenge content: %s", (content) => {
    expect(detectCaptureChallenge(content)).not.toBeNull();
  });

  it("accepts ordinary project content", () => {
    expect(detectCaptureChallenge("Hamburguesa Nómada — resultados y reconocimientos")).toBeNull();
  });
});

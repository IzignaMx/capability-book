// @vitest-environment node

import { describe, expect, it } from "vitest";
import { detectCaptureBlock, detectCaptureChallenge } from "../scripts/capture-validation";

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

  it.each([401, 403, 429, 503])("classifies HTTP %i as a verified access block", (status) => {
    expect(detectCaptureBlock("", status)).toBe(`http-${status}`);
  });

  it.each([400, 404, 500, 502])("keeps HTTP %i as an unexpected capture error", (status) => {
    expect(detectCaptureBlock("", status)).toBeNull();
  });

  it("prefers a challenge marker when the response also has a blocked status", () => {
    expect(detectCaptureBlock("Verify you are human", 403)).toBe("verify you are human");
  });
});

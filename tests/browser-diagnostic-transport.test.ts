import { describe, expect, it, vi } from "vitest";
import {
  DiagnosticDeliveryError,
  DiagnosticTransportConfigurationError,
  deliverDiagnosticSubmission,
  parseDiagnosticEndpoint
} from "../src/features/diagnostic/BrowserDiagnosticTransport";
import type { DiagnosticSubmission } from "../src/features/diagnostic/BrowserDiagnosticTransport";

const submission: DiagnosticSubmission = {
  name: "Ada Lovelace",
  contactMethod: "ada@example.com",
  organization: "Analytical Engines",
  request: "Build a verifiable experience",
  context: {
    sourceRoute: "/en/diagnostic/",
    selectedServices: ["commerce"],
    locale: "en"
  },
  consent: true,
  website: ""
};

describe("browser diagnostic transport", () => {
  it("leaves delivery unavailable when no endpoint is configured", () => {
    expect(parseDiagnosticEndpoint(undefined)).toBeUndefined();
    expect(parseDiagnosticEndpoint("")).toBeUndefined();
  });

  it.each(["not-a-url", "http://forms.example.com/diagnostic"])(
    "rejects invalid or non-HTTPS configuration: %s",
    (endpoint) => {
      expect(() => parseDiagnosticEndpoint(endpoint)).toThrow(
        DiagnosticTransportConfigurationError
      );
    }
  );

  it("delivers the hosting-neutral JSON contract once", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const endpoint = parseDiagnosticEndpoint("https://forms.example.com/diagnostic");

    if (!endpoint) throw new Error("Expected configured endpoint");
    await deliverDiagnosticSubmission(endpoint, submission, request);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submission)
      })
    );
  });

  it("fails on a non-2xx response without retrying", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    const endpoint = parseDiagnosticEndpoint("https://forms.example.com/diagnostic");

    if (!endpoint) throw new Error("Expected configured endpoint");
    await expect(deliverDiagnosticSubmission(endpoint, submission, request)).rejects.toMatchObject({
      name: DiagnosticDeliveryError.name,
      status: 429
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from "vitest";
import { isAllowedPublicUrl } from "../scripts/check-links.js";

describe("public link policy", () => {
  it("allows HTTPS and rejects localhost, credentials, and insecure HTTP", () => {
    expect(isAllowedPublicUrl("https://nomada.izignamx.com/")).toBe(true);
    expect(isAllowedPublicUrl("http://localhost:4321/")).toBe(false);
    expect(isAllowedPublicUrl("https://user:pass@example.com/")).toBe(false);
    expect(isAllowedPublicUrl("http://example.com/")).toBe(false);
  });

  it("rejects loopback, private-network, and local hostnames", () => {
    expect(isAllowedPublicUrl("https://127.0.0.1/")).toBe(false);
    expect(isAllowedPublicUrl("https://10.0.0.8/")).toBe(false);
    expect(isAllowedPublicUrl("https://172.16.0.8/")).toBe(false);
    expect(isAllowedPublicUrl("https://192.168.1.8/")).toBe(false);
    expect(isAllowedPublicUrl("https://service.local/")).toBe(false);
    expect(isAllowedPublicUrl("https://[::1]/")).toBe(false);
  });
});

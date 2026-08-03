import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const canonicalBrandAsset = "https://izignamx.com/favicon.svg";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("canonical brand asset", () => {
  it("uses the IzignaMx favicon in both document heads", () => {
    expect(source("../src/layouts/BaseLayout.astro")).toContain(canonicalBrandAsset);
    expect(source("../src/pages/index.astro")).toContain(canonicalBrandAsset);
  });

  it("uses the canonical asset for header branding and organization metadata", () => {
    const header = source("../src/components/navigation/SiteHeader.astro");
    const organizationSchema = source("../src/components/core/OrganizationSchema.astro");

    expect(header).toContain(`src=\"${canonicalBrandAsset}\"`);
    expect(header).toContain('alt=""');
    expect(organizationSchema).toContain(`logo: "${canonicalBrandAsset}"`);
  });
});

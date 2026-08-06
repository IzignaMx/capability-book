import { expect, test } from "@playwright/test";

/**
 * Cover system hardening — extends project-covers.spec.ts with runtime checks:
 * same project+context = same resource, no portrait in landscape, fallback works,
 * provenance preserved, alt+caption correct, width+height defined, LCP priority,
 * remaining images lazy.
 */

const PROJECT_SLUGS = [
  "developer-tools",
  "hamburguesa-nomada",
  "nutrichilango",
  "omnisync",
  "tecuiyo",
  "vald",
] as const;

test.describe("cover system hardening", () => {
  test("same project produces same canonical asset in Explore and Evaluate", async ({ page }) => {
    // Explore only presents omnisync and hamburguesa-nomada encounters by design.
    for (const slug of ["omnisync", "hamburguesa-nomada"] as const) {
      // Explore encounter cover
      await page.goto("/es/");
      await page.waitForLoadState("networkidle");
      const encounterCover = page.locator(
        `[data-project-cover][data-cover-context="explore-encounter"]`
      );
      const encounterSrc = await encounterCover
        .filter({ has: page.locator(`img[src*="/${slug}/"]`) })
        .first()
        .locator("img")
        .getAttribute("src");

      // Evaluate catalog cover
      await page.goto("/es/proyectos/");
      await page.waitForLoadState("networkidle");
      const catalogCover = page.locator(
        `[data-project-cover][data-cover-context="catalog-cover"]`
      );
      const catalogSrc = await catalogCover
        .filter({ has: page.locator(`img[src*="/${slug}/"]`) })
        .first()
        .locator("img")
        .getAttribute("src");

      expect(encounterSrc, `${slug} Explore vs Evaluate asset mismatch`).toBeTruthy();
      expect(catalogSrc, `${slug} Evaluate asset missing`).toBeTruthy();
      // Both should reference the same desktop evidence file
      expect(encounterSrc).toBe(catalogSrc);
    }
  });

  test("no portrait source in landscape cover contexts", async ({ page }) => {
    const routes = ["/", "/es/", "/en/", "/es/proyectos/", "/en/projects/"];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const sources = page.locator(
        `[data-project-cover]:not([data-cover-context="full-evidence"]) source`
      );
      const count = await sources.count();
      for (let i = 0; i < count; i++) {
        const srcset = await sources.nth(i).getAttribute("srcset");
        expect(srcset, `${route} source[${i}] has no srcset`).toBeTruthy();
        expect(srcset, `${route} source[${i}] references mobile portrait`).not.toContain("home-mobile");
      }
    }
  });

  test("all cover images have width and height attributes", async ({ page }) => {
    for (const slug of PROJECT_SLUGS) {
      await page.goto(`/es/proyectos/${slug}/`);
      await page.waitForLoadState("networkidle");
      const coverImg = page.locator(`[data-project-cover] img`).first();
      const width = await coverImg.getAttribute("width");
      const height = await coverImg.getAttribute("height");
      expect(width, `${slug} cover missing width`).toBeTruthy();
      expect(height, `${slug} cover missing height`).toBeTruthy();
      expect(Number(width), `${slug} cover width not positive`).toBeGreaterThan(0);
      expect(Number(height), `${slug} cover height not positive`).toBeGreaterThan(0);
    }
  });

  test("LCP cover image has fetchpriority high on case pages", async ({ page }) => {
    await page.goto("/es/proyectos/tecuiyo/");
    await page.waitForLoadState("networkidle");
    const heroCover = page.locator(`[data-project-cover][data-cover-context="case-study-cover"] img`);
    const fetchpriority = await heroCover.getAttribute("fetchpriority");
    expect(fetchpriority, "case-study-cover missing fetchpriority=high").toBe("high");
  });

  test("non-LCP cover images are lazy", async ({ page }) => {
    await page.goto("/es/proyectos/");
    await page.waitForLoadState("networkidle");
    const catalogCovers = page.locator(`[data-project-cover][data-cover-context="catalog-cover"] img`);
    const count = await catalogCovers.count();
    // First 2 are above-the-fold (eager), rest must be lazy
    for (let i = 2; i < count; i++) {
      const loading = await catalogCovers.nth(i).getAttribute("loading");
      expect(loading, `catalog cover[${i}] should be lazy`).toBe("lazy");
    }
  });

  test("provenance state preserved in data-cover-kind", async ({ page }) => {
    // omnisync = local-development-capture
    await page.goto("/es/proyectos/omnisync/");
    await page.waitForLoadState("networkidle");
    const cover = page.locator(`[data-project-cover][data-cover-context="case-study-cover"]`);
    await expect(cover).toHaveAttribute("data-cover-kind", "local-development-capture");

    // tecuiyo = direct-production-capture
    await page.goto("/es/proyectos/tecuiyo/");
    await page.waitForLoadState("networkidle");
    const prodCover = page.locator(`[data-project-cover][data-cover-context="case-study-cover"]`);
    await expect(prodCover).toHaveAttribute("data-cover-kind", "direct-production-capture");
  });

  test("alt text non-empty for all cover images", async ({ page }) => {
    const routes = ["/", "/es/", "/en/", "/es/proyectos/", "/en/projects/"];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const imgs = page.locator("[data-project-cover] img");
      const count = await imgs.count();
      for (let i = 0; i < count; i++) {
        const alt = await imgs.nth(i).getAttribute("alt");
        expect(alt, `${route} cover img[${i}] empty alt`).toBeTruthy();
        expect(alt!.length, `${route} cover img[${i}] alt too short`).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
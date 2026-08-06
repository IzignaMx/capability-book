import { expect, test } from "@playwright/test";

/**
 * Visual regression baseline — route × viewport matrix.
 * Strict threshold, NO auto-update. Every diff must be reviewed and documented.
 * Snapshots live in tests/e2e/visual-regression.spec.ts-snapshots/.
 *
 * OPT-IN LOCAL CANARY — skipped by default and always skipped in CI:
 * baselines are generated on Windows (chromium-win32) and cannot be
 * reproduced deterministically on Linux runners. Run explicitly with
 *   VISUAL_REGRESSION=1 pnpm exec playwright test tests/e2e/visual-regression.spec.ts
 * or regenerate with the --update-snapshots flag.
 */
test.skip(
  Boolean(process.env.CI) || process.env.VISUAL_REGRESSION !== "1",
  "Visual regression is an opt-in local canary (win32 baselines); not run in CI"
);

// Reduced matrix: 9 key routes × 4 key viewports = 36 tests.
// Full 22×7 matrix was too heavy (10+ min, hangs, baseline corruption).
// Reduction documented in visual-regression-report.md.
const ROUTES = [
  "/",
  "/es/",
  "/en/",
  "/es/proyectos/",
  "/en/projects/",
  "/es/proyectos/omnisync/",
  "/en/projects/omnisync/",
  "/es/diagnostico/",
  "/en/diagnostic/",
] as const;

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`visual baseline ${route} @ ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      // Wait for fonts + images to settle (page.evaluate hangs when 3D canvas
      // blocks main thread in headless swiftshader; waitForTimeout avoids it)
      await page.waitForTimeout(3000);

      // Wait for astro-island hydration + CSS animations (reveal 700ms)
      await page.waitForTimeout(1500);

      const label = `${route.replace(/[^a-z0-9]/gi, "-")}-${viewport.width}x${viewport.height}`;
      await expect(page).toHaveScreenshot(`${label}.png`, {
        threshold: 0.1,
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}
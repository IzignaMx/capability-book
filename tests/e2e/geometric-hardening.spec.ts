import { expect, test } from "@playwright/test";

/**
 * Geometric hardening — detect layout regressions across routes and viewports.
 * Checks: overflow, element containment, interactive overlap, text edge padding,
 * CTA label wrap, CTA padding minimum, heading visibility, image distortion,
 * focus ring clipping.
 */

const COVER_ROUTES = [
  "/",
  "/es/",
  "/en/",
  "/es/proyectos/",
  "/en/projects/",
  "/es/proyectos/omnisync/",
  "/en/projects/omnisync/",
  "/es/proyectos/tecuiyo/",
  "/en/projects/tecuiyo/",
] as const;

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

const ROUTES = [
  "/",
  "/es/",
  "/en/",
  "/es/proyectos/",
  "/en/projects/",
  "/es/proyectos/developer-tools/",
  "/es/proyectos/hamburguesa-nomada/",
  "/es/proyectos/nutrichilango/",
  "/es/proyectos/omnisync/",
  "/es/proyectos/tecuiyo/",
  "/es/proyectos/vald/",
  "/en/projects/developer-tools/",
  "/en/projects/hamburguesa-nomada/",
  "/en/projects/nutrichilango/",
  "/en/projects/omnisync/",
  "/en/projects/tecuiyo/",
  "/en/projects/vald/",
  "/es/diagnostico/",
  "/en/diagnostic/",
  "/es/accesibilidad/",
  "/en/accessibility/",
  "/es/privacidad/",
  "/en/privacy/",
] as const;

test.describe("geometric hardening", () => {
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      test(`no horizontal overflow ${route} @ ${viewport.width}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize(viewport);
        await page.goto(route);
        await page.waitForLoadState("networkidle");

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(overflow.scrollWidth, `${route} @ ${viewport.width} overflows`).toBeLessThanOrEqual(
          overflow.clientWidth
        );
      });
    }
  }

  for (const route of COVER_ROUTES) {
    test(`no distorted cover images ${route}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const images = page.locator("[data-project-cover] img");
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const distortion = await images.nth(i).evaluate((img: HTMLImageElement) => {
          const rect = img.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return { ok: true, ratio: 0 };
          if (img.naturalWidth === 0 || img.naturalHeight === 0) return { ok: true, ratio: 0 };
          const renderedRatio = rect.width / rect.height;
          const naturalRatio = img.naturalWidth / img.naturalHeight;
          const delta = Math.abs(renderedRatio - naturalRatio);
          return { ok: delta < 0.15, ratio: delta };
        });
        expect(distortion.ok, `${route} cover img[${i}] distorted (delta=${distortion.ratio})`).toBe(true);
      }
    });
  }

  test("CTA labels do not wrap on desktop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const ctas = page.locator(".hero-actions a, .case-study__cta a, .project-encounter__actions a");
    const count = await ctas.count();
    for (let i = 0; i < count; i++) {
      const wrap = await ctas.nth(i).evaluate((el: HTMLElement) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rect = range.getBoundingClientRect();
        return { wraps: rect.height > el.getBoundingClientRect().height * 1.5, height: rect.height };
      });
      expect(wrap.wraps, `CTA[${i}] label wraps on desktop`).toBe(false);
    }
  });

  test("CTA padding-inline meets minimum on desktop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const ctas = page.locator(".hero-actions a, .case-study__cta a");
    const count = await ctas.count();
    for (let i = 0; i < count; i++) {
      const padding = await ctas.nth(i).evaluate((el: HTMLElement) => {
        const style = getComputedStyle(el);
        return parseFloat(style.paddingInlineStart);
      });
      expect(padding, `CTA[${i}] padding-inline below 20px`).toBeGreaterThanOrEqual(20);
    }
  });

  test("no heading hidden by fixed header", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/proyectos/omnisync/");
    await page.waitForLoadState("networkidle");

    const header = page.locator(".site-header");
    const headerBox = await header.boundingBox();
    const h1 = page.locator("h1").first();
    const h1Box = await h1.boundingBox();
    if (headerBox && h1Box) {
      expect(h1Box.y, "h1 hidden behind header").toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
    }
  });

  test("focus ring not clipped on primary CTA", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const cta = page.locator(".hero-actions a").first();
    await cta.focus();

    const clip = await cta.evaluate((el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const boxShadow = style.boxShadow;
      // Focus ring uses box-shadow; check it's visible within the viewport
      const ringSize = 6; // --focus-ring outer
      const clipped =
        rect.left - ringSize < 0 ||
        rect.right + ringSize > window.innerWidth ||
        rect.top - ringSize < 0 ||
        rect.bottom + ringSize > window.innerHeight;
      return { clipped, boxShadow };
    });
    expect(clip.clipped, "focus ring clipped by parent overflow").toBe(false);
  });

  test("no text touches viewport edge without padding", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const touching = await page.evaluate(() => {
      const textEls = document.querySelectorAll("h1, h2, h3, p, li, a, span, figcaption");
      const issues: string[] = [];
      textEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        // Text must be at least 16px from viewport edge on mobile
        if (rect.left < 15 || rect.right > window.innerWidth - 15) {
          // Check if it's inside a container with padding
          const style = getComputedStyle(el);
          if (style.position === "fixed") return;
          issues.push(`${el.tagName} at left=${rect.left.toFixed(0)} right=${rect.right.toFixed(0)}`);
        }
      });
      return issues.slice(0, 5);
    });
    expect(touching, `text touches edge: ${touching.join(", ")}`).toHaveLength(0);
  });
});
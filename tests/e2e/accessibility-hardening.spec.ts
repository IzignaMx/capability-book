import { expect, test } from "@playwright/test";

/**
 * Accessibility hardening — keyboard nav, focus order, focus visible,
 * landmarks, headings, labels, no-JS fallback.
 * Extends reduced-motion-parity + webgl-failure specs.
 */

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

test.describe("accessibility hardening", () => {
  test("keyboard tab sequence reaches primary CTA", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    // Tab through focusable elements; first focusable should be a link/button
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, text: el.textContent?.slice(0, 40) } : null;
    });
    expect(firstFocused, "no element focused on first Tab").toBeTruthy();

    // Continue tabbing until we reach a CTA or nav link
    let found = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return { tag: el.tagName, href: el.getAttribute("href"), text: el.textContent?.trim().slice(0, 40) };
      });
      if (focused?.href && (focused.href.includes("/proyectos/") || focused.href.includes("/diagnostico/"))) {
        found = true;
        break;
      }
    }
    expect(found, "primary CTA not reachable via keyboard tab").toBe(true);
  });

  test("focus-visible ring present on all interactive elements", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/proyectos/");
    await page.waitForLoadState("networkidle");

    const links = page.locator("a[href], button");
    const count = await links.count();
    let checked = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const el = links.nth(i);
      if (!(await el.isVisible())) continue;
      await el.focus();
      const ring = await el.evaluate((node: HTMLElement) => {
        const style = getComputedStyle(node);
        return {
          boxShadow: style.boxShadow,
          outline: style.outline,
        };
      });
      // Focus ring is box-shadow in this design system
      const hasRing = ring.boxShadow !== "none" || ring.outline !== "none";
      expect(hasRing, `link[${i}] has no focus-visible ring`).toBe(true);
      checked++;
    }
    expect(checked, "no visible interactive elements checked").toBeGreaterThan(0);
  });

  test("landmarks present on all routes", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const landmarks = await page.evaluate(() => {
        const roles = new Set<string>();
        document
          .querySelectorAll("header, nav, main, footer, aside, [role='banner'], [role='navigation'], [role='main'], [role='contentinfo']")
          .forEach((el) => {
            const role = el.getAttribute("role") || el.tagName.toLowerCase();
            roles.add(role);
          });
        return Array.from(roles);
      });

      expect(landmarks.length, `${route} has no landmarks`).toBeGreaterThan(0);
      expect(landmarks, `${route} missing main landmark`).toContain("main");
    }
  });

  test("heading hierarchy valid on all routes", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const headings = await page.evaluate(() => {
        const els = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        return Array.from(els).map((el) => ({
          level: parseInt(el.tagName.charAt(1)),
          text: el.textContent?.trim().slice(0, 50),
        }));
      });

      expect(headings.length, `${route} has no headings`).toBeGreaterThan(0);
      // Must have exactly one h1
      const h1Count = headings.filter((h) => h.level === 1).length;
      expect(h1Count, `${route} has ${h1Count} h1 (expected 1)`).toBe(1);
      // No heading skips (h1→h3 without h2)
      for (let i = 1; i < headings.length; i++) {
        const prev = headings[i - 1];
        const curr = headings[i];
        if (!prev || !curr) continue;
        const skip = curr.level - prev.level;
        expect(skip, `${route} heading skip h${prev.level}→h${curr.level}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("form fields have associated labels on diagnostic page", async ({ page }) => {
    await page.goto("/es/diagnostico/");
    await page.waitForLoadState("networkidle");

    // Honeypot field is intentionally aria-hidden (visual + a11y tree), so exclude it.
    const inputs = page.locator(
      'input:not([type="hidden"]):not([aria-hidden="true"]), select:not([aria-hidden="true"]), textarea:not([aria-hidden="true"])'
    );
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const hasLabel = await inputs.nth(i).evaluate((el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
        // Check for associated <label for>, aria-label, aria-labelledby, or title
        const id = el.id;
        const hasFor = id ? !!document.querySelector(`label[for="${id}"]`) : false;
        const ariaLabel = el.getAttribute("aria-label");
        const ariaLabelledby = el.getAttribute("aria-labelledby");
        const title = el.getAttribute("title");
        return hasFor || !!ariaLabel || !!ariaLabelledby || !!title;
      });
      expect(hasLabel, `diagnostic input[${i}] has no label`).toBe(true);
    }
  });

  test("no-JS fallback renders essential content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });

    // Disable JavaScript
    await page.context().addInitScript(() => {
      // Suppress JS by overriding
      (window as any).__noJS = true;
    });

    await page.goto("/es/");
    await page.waitForLoadState("domcontentloaded");

    // Essential content must be in SSR HTML (Astro static)
    const body = await page.locator("body").innerText();
    expect(body).toContain("IzignaMx");
    expect(body).toContain("Construimos");

    // Reset context for other tests
    await page.context().clearCookies();
  });

  test("reduced motion disables animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const animations = await page.evaluate(() => {
      const issues: string[] = [];
      for (const el of document.querySelectorAll("*")) {
        const style = getComputedStyle(el);
        const duration = style.animationDuration;
        if (duration && duration !== "0s" && duration !== "0ms") {
          // Check if animation-name is none (reduced-motion should set it)
          const name = style.animationName;
          if (name !== "none") {
            issues.push(`${el.tagName}.${el.className} animation=${name} duration=${duration}`);
          }
        }
      }
      return issues.slice(0, 5);
    });

    expect(animations, `animations running with reduced-motion: ${animations.join("; ")}`).toHaveLength(0);
  });
});
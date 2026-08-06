import { expect, test, type Page } from "@playwright/test";

/**
 * Spacing foundation e2e — validates the Phase 0 spacing metric:
 * - no horizontal overflow at common viewports
 * - page gutters follow the 20/24/32/48px scale
 * - footer cluster links never concatenate
 * - interactive controls respect 44px min-height + 20px inline padding
 * - focus-visible ring is visible after keyboard navigation
 * - header navigation stays within viewport without collisions
 */

const OVERFLOW_ROUTES = ["/es/", "/es/proyectos/", "/es/diagnostico/"];

async function assertNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(
    metrics.scrollWidth,
    `${label}: horizontal overflow (scrollWidth ${metrics.scrollWidth} > innerWidth ${metrics.innerWidth})`
  ).toBeLessThanOrEqual(metrics.innerWidth);
}

test.describe("no horizontal overflow", () => {
  for (const width of [360, 390]) {
    for (const route of OVERFLOW_ROUTES) {
      test(`${route} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(route);
        await assertNoHorizontalOverflow(page, `${route}@${width}`);
      });
    }
  }
});

test.describe("page gutters follow the spacing scale", () => {
  const cases: Array<{ width: number; minGutter: number }> = [
    { width: 360, minGutter: 20 },
    { width: 390, minGutter: 24 },
    { width: 768, minGutter: 32 },
    { width: 1280, minGutter: 48 }
  ];

  for (const { width, minGutter } of cases) {
    test(`container gutter >= ${minGutter}px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/es/");

      const gutter = await page.locator(".container").first().evaluate((element) => {
        const viewport = window.innerWidth;
        const width = element.getBoundingClientRect().width;
        return (viewport - width) / 2;
      });

      expect(gutter, `gutter at ${width}px`).toBeGreaterThanOrEqual(minGutter - 1);
    });
  }
});

test.describe("footer cluster spacing", () => {
  test("footer links never concatenate at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/");

    const gaps = await page.locator(".site-footer nav a").evaluateAll((links) => {
      const boxes = links.map((link) => {
        const rect = link.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      });
      boxes.sort((a, b) => a.left - b.left);
      const gaps: number[] = [];
      for (let index = 1; index < boxes.length; index += 1) {
        const current = boxes[index];
        const previous = boxes[index - 1];
        if (current && previous) {
          gaps.push(current.left - previous.right);
        }
      }
      return gaps;
    });

    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(gap, "footer link gap").toBeGreaterThan(0);
    }
  });

  test("footer links keep a readable gap on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/");

    const gaps = await page.locator(".site-footer nav a").evaluateAll((links) => {
      const boxes = links.map((link) => link.getBoundingClientRect());
      boxes.sort((a, b) => a.left - b.left);
      const gaps: number[] = [];
      for (let index = 1; index < boxes.length; index += 1) {
        const current = boxes[index];
        const previous = boxes[index - 1];
        if (current && previous) {
          gaps.push(current.left - previous.right);
        }
      }
      return gaps;
    });

    for (const gap of gaps) {
      expect(gap).toBeGreaterThan(16);
    }
  });
});

test.describe("interactive control metrics", () => {
  test("case CTA meets 44px height with >= 20px inline padding and fits one line", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/proyectos/omnisync/");

    const cta = page.getByRole("link", { name: "Solicitar diagnóstico para OmniSync" });
    await expect(cta).toBeVisible();

    const metrics = await cta.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        paddingInline: parseFloat(style.paddingInlineStart),
        singleLine: element.scrollWidth <= element.clientWidth
      };
    });

    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.paddingInline).toBeGreaterThanOrEqual(20);
    expect(metrics.singleLine, "CTA text must not wrap on desktop").toBe(true);
  });

  test("home hero primary action wraps to a single line at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/");

    const action = page.locator(".hero-actions .primary-action");
    await expect(action).toBeVisible();

    const singleLine = await action.evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(singleLine, "primary action must not wrap at 390px").toBe(true);
  });

  test("catalog filter controls meet 44px height and >= 20px inline padding", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/proyectos/");

    const searchInput = page.locator(".project-catalog__controls input");
    await expect(searchInput).toBeVisible();

    const metrics = await searchInput.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        paddingInline: parseFloat(style.paddingInlineStart)
      };
    });

    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.paddingInline).toBeGreaterThanOrEqual(20);
  });
});

test.describe("focus-visible ring", () => {
  test("primary hero action shows a focus ring after Tab", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es/");

    await page.getByRole("link", { name: "Evaluar proyectos" }).focus();
    const hasRing = await page
      .getByRole("link", { name: "Evaluar proyectos" })
      .evaluate((element) => getComputedStyle(element).boxShadow !== "none");
    expect(hasRing, "focus-visible box-shadow ring").toBe(true);
  });
});

test.describe("header navigation fits the viewport", () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header links within viewport and non-colliding at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/es/");

      const boxes = await page.locator(".site-header a").evaluateAll((links) =>
        links.map((link) => {
          const rect = link.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        })
      );

      for (const box of boxes) {
        expect(box.left, "link left edge").toBeGreaterThanOrEqual(0);
        expect(box.right, "link right edge").toBeLessThanOrEqual(width + 0.5);
      }

      // Only links sharing a vertical band can collide; the header stacks
      // ModeSwitch and primary-navigation on separate rows at small widths.
      for (let index = 0; index < boxes.length; index += 1) {
        const current = boxes[index];
        if (!current) continue;
        for (let other = index + 1; other < boxes.length; other += 1) {
          const candidate = boxes[other];
          if (!candidate) continue;
          const sameRow = current.top < candidate.bottom && candidate.top < current.bottom;
          if (!sameRow) continue;
          const overlap = Math.min(current.right, candidate.right) - Math.max(current.left, candidate.left);
          expect(overlap, "overlapping header links").toBeLessThanOrEqual(0.5);
        }
      }
    });
  }
});

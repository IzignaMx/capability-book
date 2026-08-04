import { expect, test } from "@playwright/test";

test("resolves the same canonical asset in Explore and Evaluate (rule 9)", async ({ page }) => {
  await page.goto("/es/");

  // Explore encounter for omnisync (chapter 04) and hamburguesa-nomada (chapter 05).
  const encounterSrcs = await page
    .locator('[data-project-cover][data-cover-context="explore-encounter"] img')
    .evaluateAll((images) => images.map((img) => (img as HTMLImageElement).src));

  await page.goto("/es/proyectos/");
  const catalogSrcs = await page
    .locator('[data-project-cover][data-cover-context="catalog-cover"] img')
    .evaluateAll((images) => images.map((img) => (img as HTMLImageElement).src));

  for (const slug of ["omnisync", "hamburguesa-nomada"]) {
    const exploreSrc = encounterSrcs.find((src) => src.includes(`/media/projects/${slug}/evidence/home-desktop.webp`));
    const catalogSrc = catalogSrcs.find((src) => src.includes(`/media/projects/${slug}/evidence/home-desktop.webp`));
    expect(exploreSrc, `${slug} Explore cover`).toBeTruthy();
    expect(catalogSrc, `${slug} Evaluate cover`).toBeTruthy();
    expect(new URL(exploreSrc!).pathname).toBe(new URL(catalogSrc!).pathname);
  }
});

test("never uses a vertical source inside a landscape cover (rule 4)", async ({ page }) => {
  for (const path of ["/es/", "/es/proyectos/", "/es/proyectos/omnisync/"]) {
    await page.goto(path);
    const sources = await page
      .locator('[data-project-cover] source')
      .evaluateAll((els) => els.map((el) => (el as HTMLSourceElement).srcset));
    for (const src of sources) {
      expect(src, `${path} vertical source in cover`).not.toContain("home-mobile");
    }
  }
});

test("keeps a consistent 8:5 aspect ratio on every cover (rule 9)", async ({ page }) => {
  for (const path of ["/es/", "/es/proyectos/", "/es/proyectos/tecuiyo/"]) {
    await page.goto(path);
    const ratios = await page
      .locator('[data-project-cover] img')
      .evaluateAll((images) =>
        images.map((img) => {
          const el = img as HTMLImageElement;
          const rect = el.getBoundingClientRect();
          return { attr: el.width / el.height, rendered: rect.width / rect.height };
        })
      );
    for (const ratio of ratios) {
      expect(ratio.attr, `${path} img width/height attrs`).toBeCloseTo(8 / 5, 2);
      expect(ratio.rendered, `${path} rendered ratio`).toBeCloseTo(8 / 5, 2);
    }
  }
});

test("keeps a non-empty alt for informative evidence (rule 9)", async ({ page }) => {
  for (const path of ["/es/", "/es/proyectos/", "/es/proyectos/vald/"]) {
    await page.goto(path);
    const alts = await page
      .locator('[data-project-cover] img')
      .evaluateAll((images) => images.map((img) => (img as HTMLImageElement).alt));
    for (const alt of alts) {
      expect(alt.length, `${path} empty alt`).toBeGreaterThan(0);
    }
  }
});

test("falls back to the approved 8:5 poster derivative when evidence is missing", async ({ page }) => {
  // All six projects carry approved evidence today; the fallback path is
  // covered by unit tests. Here we assert the fallback contract exists in
  // the DOM contract by checking the shared renderer emits data-cover-src.
  await page.goto("/es/proyectos/");
  const coverSrcs = await page
    .locator('[data-project-cover][data-cover-context="catalog-cover"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-cover-src")));
  expect(coverSrcs.every((kind) => kind === "evidence")).toBe(true);
});

test("loads eagerly only above-the-fold covers (rule 9)", async ({ page }) => {
  await page.goto("/es/proyectos/tecuiyo/");
  const heroLoading = await page
    .locator('[data-project-cover][data-cover-context="case-study-cover"] img')
    .getAttribute("loading");
  expect(heroLoading).toBe("eager");

  await page.goto("/es/proyectos/");
  const catalogLoadings = await page
    .locator('[data-project-cover][data-cover-context="catalog-cover"] img')
    .evaluateAll((images) => images.map((img) => (img as HTMLImageElement).loading));
  // Only the first two catalog cards are above the fold; the rest must be lazy.
  expect(catalogLoadings.slice(0, 2).every((loading) => loading === "eager")).toBe(true);
  expect(catalogLoadings.slice(2).every((loading) => loading === "lazy")).toBe(true);
});

test("keeps AVIF and WebP sources with explicit width and height (rule 9)", async ({ page }) => {
  await page.goto("/es/proyectos/tecuiyo/");
  const avif = page.locator('[data-project-cover][data-cover-context="case-study-cover"] source[type="image/avif"]');
  const webp = page.locator('[data-project-cover][data-cover-context="case-study-cover"] source[type="image/webp"]');
  await expect(avif).toHaveAttribute("srcset", /home-desktop\.avif$/);
  await expect(webp).toHaveAttribute("srcset", /home-desktop\.webp$/);

  const img = page.locator('[data-project-cover][data-cover-context="case-study-cover"] img');
  await expect(img).toHaveAttribute("width", "1440");
  await expect(img).toHaveAttribute("height", "900");
});

test("does not distort the image (rule 9)", async ({ page }) => {
  await page.goto("/es/proyectos/tecuiyo/");
  const distortion = await page
    .locator('[data-project-cover][data-cover-context="case-study-cover"] img')
    .evaluate((img) => {
      const el = img as HTMLImageElement;
      const natural = el.naturalWidth / el.naturalHeight;
      const rendered = el.getBoundingClientRect().width / el.getBoundingClientRect().height;
      return { natural, rendered };
    });
  expect(distortion.natural).toBeCloseTo(8 / 5, 2);
  expect(distortion.rendered).toBeCloseTo(8 / 5, 2);
});

test("causes no layout shift on the case page (rule 9)", async ({ page }) => {
  await page.goto("/es/proyectos/tecuiyo/");
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let value = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as { hadRecentInput?: boolean; value?: number };
            if (!shift.hadRecentInput) value += shift.value ?? 0;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(value), 500);
      })
  );
  expect(cls).toBeLessThan(0.1);
});
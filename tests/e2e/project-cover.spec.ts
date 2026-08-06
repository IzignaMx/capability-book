import { expect, test } from "@playwright/test";

const productionEvidenceProjects = [
  "hamburguesa-nomada",
  "vald",
  "nutrichilango",
  "tecuiyo",
  "developer-tools"
] as const;
const evidenceProjects = [...productionEvidenceProjects, "omnisync"] as const;

test("uses reviewed evidence covers and distinguishes the authorized local capture", async ({ page }) => {
  for (const slug of productionEvidenceProjects) {
    await page.goto(`/es/proyectos/${slug}/`);
    const cover = page.locator('[data-project-cover][data-cover-context="case-study-cover"]');
    await expect(cover).toHaveAttribute("data-cover-kind", "direct-production-capture");
    await expect(cover.locator("img")).toHaveAttribute("src", new RegExp(`/media/projects/${slug}/evidence/home-desktop\\.webp$`));
  }

  await page.goto("/es/proyectos/omnisync/");
  const localCover = page.locator('[data-project-cover][data-cover-context="case-study-cover"]');
  await expect(localCover).toHaveAttribute("data-cover-kind", "local-development-capture");
  await expect(localCover.locator("img")).toHaveAttribute("src", /\/media\/projects\/omnisync\/evidence\/home-desktop\.webp$/);
});

test("uses the same evidence covers in Spanish and English project catalogs", async ({ page }) => {
  for (const path of ["/es/proyectos/", "/en/projects/"]) {
    await page.goto(path);

    for (const slug of evidenceProjects) {
      const cover = page
        .locator('[data-project-cover][data-cover-context="catalog-cover"]')
        .filter({ has: page.locator(`img[src$="/media/projects/${slug}/evidence/home-desktop.webp"]`) });
      await expect(cover).toHaveAttribute(
        "data-cover-kind",
        slug === "omnisync" ? "local-development-capture" : "direct-production-capture"
      );
    }
  }
});

test("keeps the longest bilingual project heroes clear at every responsive transition", async ({ page }) => {
  const projects = [
    { path: "/es/proyectos/hamburguesa-nomada/", slug: "hamburguesa-nomada" },
    { path: "/en/projects/developer-tools/", slug: "developer-tools" }
  ] as const;

  for (const project of projects) {
    await page.goto(project.path);

    for (const width of [390, 833, 900, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      const coverImage = page.locator('[data-project-cover][data-cover-context="case-study-cover"] img');
      // Rule 4: landscape desktop capture at ALL breakpoints — never the vertical mobile variant.
      await expect.poll(async () => {
        const currentSrc = await coverImage.evaluate((image: HTMLImageElement) => image.currentSrc);
        return currentSrc ? new URL(currentSrc).pathname : "";
      }).toBe(`/media/projects/${project.slug}/evidence/home-desktop.avif`);

      const geometry = await page.locator(".project-hero").evaluate((hero) => {
        const opening = hero.querySelector<HTMLElement>(".project-hero__opening");
        const title = hero.querySelector<HTMLElement>("h1");
        const media = hero.querySelector<HTMLElement>("[data-project-cover]");
        if (!opening || !title || !media) throw new Error("Project hero geometry hooks are missing.");

        const openingRect = opening.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const mediaRect = media.getBoundingClientRect();
        const separated = (first: DOMRect, second: DOMRect) =>
          first.right <= second.left + 0.5 ||
          first.bottom <= second.top + 0.5 ||
          first.left >= second.right - 0.5 ||
          first.top >= second.bottom - 0.5;

        return {
          openingSeparated: separated(openingRect, mediaRect),
          titleSeparated: separated(titleRect, mediaRect),
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      });

      expect(geometry.openingSeparated, `${project.path} at ${width}px overlaps the project cover`).toBe(true);
      expect(geometry.titleSeparated, `${project.path} at ${width}px title overlaps the project cover`).toBe(true);
      expect(geometry.documentWidth, `${project.path} at ${width}px has horizontal overflow`).toBeLessThanOrEqual(geometry.viewportWidth);
    }
  }
});
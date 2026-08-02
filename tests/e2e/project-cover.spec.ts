import { expect, test } from "@playwright/test";

const publicEvidenceProjects = [
  "hamburguesa-nomada",
  "vald",
  "nutrichilango",
  "tecuiyo",
  "developer-tools"
] as const;

test("uses reviewed production captures as project covers and preserves the private fallback", async ({ page }) => {
  for (const slug of publicEvidenceProjects) {
    await page.goto(`/es/proyectos/${slug}/`);
    const cover = page.locator("[data-project-cover]");
    await expect(cover).toHaveAttribute("data-cover-kind", "production");
    await expect(cover.locator("img")).toHaveAttribute("src", new RegExp(`/media/projects/${slug}/evidence/home-desktop\\.webp$`));
  }

  await page.goto("/es/proyectos/omnisync/");
  const privateCover = page.locator("[data-project-cover]");
  await expect(privateCover).toHaveAttribute("data-cover-kind", "illustrative");
  await expect(privateCover.locator("img")).toHaveAttribute("src", "/media/projects/omnisync/poster.avif");
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

      const coverImage = page.locator("[data-project-cover] img");
      const expectedVariant = width <= 640 ? "mobile" : "desktop";
      await expect.poll(async () => {
        const currentSrc = await coverImage.evaluate((image: HTMLImageElement) => image.currentSrc);
        return currentSrc ? new URL(currentSrc).pathname : "";
      }).toBe(`/media/projects/${project.slug}/evidence/home-${expectedVariant}.avif`);

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

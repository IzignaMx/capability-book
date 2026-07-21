import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, type Page, type ViewportSize } from "@playwright/test";

type CaptureViewport = ViewportSize & {
  name: string;
};

type CaptureProject = {
  slug: string;
  url: string;
};

type CaptureManifest = {
  viewports: CaptureViewport[];
  projects: CaptureProject[];
};

const manifest = JSON.parse(
  await readFile(new URL("../data/media-manifest.json", import.meta.url), "utf8")
) as CaptureManifest;

async function preparePage(page: Page, url: string): Promise<void> {
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "reduce"
  });
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45_000
  });

  try {
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
  } catch {
    console.warn(`Network remained active for ${url}; capturing stable DOM state.`);
  }

  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

const browser = await chromium.launch({ headless: true });

try {
  for (const project of manifest.projects) {
    for (const viewport of manifest.viewports) {
      const page = await browser.newPage({
        viewport: {
          width: viewport.width,
          height: viewport.height
        },
        deviceScaleFactor: 1
      });

      try {
        await preparePage(page, project.url);
        const directory = new URL(
          `../artifacts/captures/${project.slug}/`,
          import.meta.url
        );
        await mkdir(directory, { recursive: true });
        const output = new URL(`${viewport.name}.png`, directory);

        await page.screenshot({
          path: fileURLToPath(output),
          fullPage: true,
          animations: "disabled",
          caret: "hide"
        });
        console.log(`Captured ${project.slug}/${viewport.name}.png`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

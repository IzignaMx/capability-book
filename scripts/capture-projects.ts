import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, type Page, type ViewportSize } from "@playwright/test";
import { detectCaptureChallenge } from "./capture-validation";

type CaptureViewport = ViewportSize & { name: string };
type CapturePolicy = "best-effort" | "skip";

type CaptureProject = {
  slug: string;
  policy: CapturePolicy;
  url?: string;
  reason?: string;
};

type CaptureManifest = {
  viewports: CaptureViewport[];
  projects: CaptureProject[];
};

type CaptureStatus = "captured" | "blocked" | "skipped" | "error";

interface CaptureResult {
  slug: string;
  viewport: string;
  status: CaptureStatus;
  url?: string;
  httpStatus?: number;
  heading?: string;
  marker?: string;
  reason?: string;
  path?: string;
  sha256?: string;
  capturedAt: string;
}

const manifest = JSON.parse(
  await readFile(new URL("../data/media-manifest.json", import.meta.url), "utf8")
) as CaptureManifest;
const artifactRoot = new URL("../artifacts/captures/", import.meta.url);
const results: CaptureResult[] = [];

function hash(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function inspectPage(page: Page, url: string) {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const bodyText = await page.locator("body").innerText();
  const marker = detectCaptureChallenge(bodyText);
  if (marker) return { response, marker };

  if (!response?.ok()) {
    throw new Error(`${url} returned HTTP ${response?.status() ?? "unknown"}`);
  }

  const heading = page.locator("h1:visible").first();
  await heading.waitFor({ state: "visible", timeout: 15_000 });
  await page.evaluate(`(async () => {
    await document.fonts.ready;
    await new Promise((resolve, reject) => {
      let quietTimer;
      const deadline = setTimeout(() => {
        observer.disconnect();
        clearTimeout(quietTimer);
        reject(new Error("Visible document did not stabilize within 3000ms"));
      }, 3000);
      const settle = () => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => {
          observer.disconnect();
          clearTimeout(deadline);
          resolve();
        }, 500);
      };
      const observer = new MutationObserver(settle);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      settle();
    });

    const helpers = {
      intersectsViewport(element) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      },
      async waitBeforeRetry() {
        await new Promise((resolve) => setTimeout(resolve, 250));
      },
      async decodeWithRetry(decode, url) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            await decode();
            return;
          } catch {
            if (attempt === 0) await this.waitBeforeRetry();
          }
        }
        throw new Error("Visible visual asset failed to decode: " + url);
      }
    };

    const decodedUrls = new Set();
    for (const image of document.images) {
      if (!helpers.intersectsViewport(image)) continue;
      const url = image.currentSrc || image.src;
      if (!url) continue;
      await helpers.decodeWithRetry(async () => {
        if (image.complete && image.naturalWidth > 0) return;
        await image.decode();
        if (image.naturalWidth === 0) throw new Error("Decoded image has no pixels");
      }, url);
      decodedUrls.add(url);
    }

    const backgroundUrls = new Set();
    for (const element of document.querySelectorAll("*")) {
      if (!helpers.intersectsViewport(element)) continue;
      const backgroundImage = getComputedStyle(element).backgroundImage;
      for (const match of backgroundImage.matchAll(/url\\(["']?([^"')]+)["']?\\)/g)) {
        if (!match[1]) continue;
        const url = new URL(match[1], document.baseURI).href;
        if (!decodedUrls.has(url)) backgroundUrls.add(url);
      }
    }

    await Promise.all(
      [...backgroundUrls].map((url) =>
        helpers.decodeWithRetry(async () => {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (image.naturalWidth === 0) throw new Error("Decoded background has no pixels");
        }, url)
      )
    );
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  })()`);
  return { response, heading: (await heading.innerText()).trim() };
}

await rm(artifactRoot, { recursive: true, force: true });
await mkdir(artifactRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const project of manifest.projects) {
    for (const viewport of manifest.viewports) {
      if (project.policy === "skip") {
        results.push({
          slug: project.slug,
          viewport: viewport.name,
          status: "skipped",
          reason: project.reason ?? "Capture disabled by evidence policy.",
          capturedAt: new Date().toISOString()
        });
        continue;
      }

      if (!project.url) {
        results.push({
          slug: project.slug,
          viewport: viewport.name,
          status: "error",
          reason: "Capture URL is required for best-effort projects.",
          capturedAt: new Date().toISOString()
        });
        continue;
      }

      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        locale: "es-MX",
        timezoneId: "America/Mexico_City"
      });

      try {
        const inspection = await inspectPage(page, project.url);
        if (inspection.marker) {
          results.push({
            slug: project.slug,
            viewport: viewport.name,
            status: "blocked",
            url: project.url,
            ...(inspection.response ? { httpStatus: inspection.response.status() } : {}),
            marker: inspection.marker,
            reason: "Automated capture was rejected; no image was accepted as evidence.",
            capturedAt: new Date().toISOString()
          });
          continue;
        }

        const directory = new URL(`./${project.slug}/`, artifactRoot);
        await mkdir(directory, { recursive: true });
        const output = new URL(`${viewport.name}.png`, directory);
        const outputPath = fileURLToPath(output);
        await page.screenshot({ path: outputPath, fullPage: false, animations: "disabled", caret: "hide" });
        const screenshot = await readFile(output);
        results.push({
          slug: project.slug,
          viewport: viewport.name,
          status: "captured",
          url: project.url,
          ...(inspection.response ? { httpStatus: inspection.response.status() } : {}),
          heading: inspection.heading,
          path: `${project.slug}/${viewport.name}.png`,
          sha256: hash(screenshot),
          capturedAt: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          slug: project.slug,
          viewport: viewport.name,
          status: "error",
          url: project.url,
          reason: error instanceof Error ? error.message : "Unknown capture failure",
          capturedAt: new Date().toISOString()
        });
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  await writeFile(new URL("report.json", artifactRoot), `${JSON.stringify(results, null, 2)}\n`, "utf8");
}

const errors = results.filter((result) => result.status === "error");
if (errors.length) {
  throw new Error(`Capture audit failed for ${errors.map((result) => `${result.slug}/${result.viewport}`).join(", ")}`);
}

for (const result of results) {
  console.log(`${result.status.toUpperCase()}: ${result.slug}/${result.viewport}`);
}

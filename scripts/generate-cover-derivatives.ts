import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

/**
 * Generates the canonical 8:5 cover derivative from the approved 16:9
 * fallback poster (poster.avif → poster-cover.avif + poster-cover.webp).
 *
 * Rule: no stretch, no destructive crop. The 16:9 → 8:5 conversion is a
 * centered cover crop — safe for the generated posters (title + signal
 * centered, no critical content at the horizontal edges). Deterministic
 * (position: "centre") so builds are reproducible.
 */

const PROJECT_SLUGS = [
  "developer-tools",
  "hamburguesa-nomada",
  "nutrichilango",
  "omnisync",
  "tecuiyo",
  "vald",
] as const;

const COVER_WIDTH = 1280;
const COVER_HEIGHT = 800; // 8:5

async function main(): Promise<void> {
  let generated = 0;
  for (const slug of PROJECT_SLUGS) {
    const dir = resolve("public", "media", "projects", slug);
    const posterPath = resolve(dir, "poster.avif");
    await mkdir(dir, { recursive: true });

    const pipeline = sharp(posterPath)
      .resize(COVER_WIDTH, COVER_HEIGHT, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: false,
      });

    await pipeline
      .clone()
      .avif({ quality: 72, effort: 6 })
      .toFile(resolve(dir, "poster-cover.avif"));
    await pipeline
      .clone()
      .webp({ quality: 80, effort: 6 })
      .toFile(resolve(dir, "poster-cover.webp"));

    generated += 1;
    console.log(`generated 8:5 cover for ${slug}`);
  }
  console.log(`cover derivatives complete (${generated} projects)`);
}

await main();

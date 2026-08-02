import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type ViewportName = "mobile" | "desktop";

interface ScreenshotMedia {
  id: string;
  role: "screenshot";
  variants: Record<ViewportName, {
    avif: string;
    webp: string;
    width: number;
    height: number;
    avifSha256: string;
    webpSha256: string;
  }>;
  provenance: {
    sourceSha256: Record<ViewportName, string>;
  };
}

interface EvidenceRecord {
  project: { slug: string };
  media: Array<{ role: string } | ScreenshotMedia>;
}

const sourceDirectory = process.env.EVIDENCE_CAPTURE_SOURCE_DIR;
if (!sourceDirectory) {
  throw new Error("EVIDENCE_CAPTURE_SOURCE_DIR must point to reviewed source PNG captures.");
}

const projectRoot = new URL("../", import.meta.url);
const evidenceDirectory = new URL("data/evidence/", projectRoot);
const viewportNames = ["mobile", "desktop"] as const;
const updateHashes = process.env.EVIDENCE_UPDATE_HASHES === "true";

function publicFileUrl(publicPath: string, projectSlug: string): URL {
  const expectedPrefix = `/media/projects/${projectSlug}/evidence/`;
  if (!publicPath.startsWith(expectedPrefix)) {
    throw new Error(`Evidence output must use ${expectedPrefix}: ${publicPath}`);
  }
  return new URL(`public${publicPath}`, projectRoot);
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

const files = (await readdir(evidenceDirectory)).filter((file) => file.endsWith(".json")).sort();
let promoted = 0;

for (const file of files) {
  const record = JSON.parse(await readFile(new URL(file, evidenceDirectory), "utf8")) as EvidenceRecord;
  const screenshots = record.media.filter((item): item is ScreenshotMedia => item.role === "screenshot");

  for (const screenshot of screenshots) {
    for (const viewportName of viewportNames) {
      const variant = screenshot.variants[viewportName];
      const sourcePath = resolve(sourceDirectory, record.project.slug, `${viewportName}.png`);
      const source = await readFile(sourcePath);
      const actualSourceHash = sha256(source);
      const expectedSourceHash = screenshot.provenance.sourceSha256[viewportName];
      if (actualSourceHash !== expectedSourceHash) {
        throw new Error(`${record.project.slug}/${viewportName}: source SHA-256 mismatch`);
      }

      const metadata = await sharp(source).metadata();
      if (metadata.width !== variant.width || metadata.height !== variant.height) {
        throw new Error(
          `${record.project.slug}/${viewportName}: expected ${variant.width}x${variant.height}, received ${metadata.width}x${metadata.height}`
        );
      }

      const avifOutput = publicFileUrl(variant.avif, record.project.slug);
      const webpOutput = publicFileUrl(variant.webp, record.project.slug);
      const [avif, webp] = await Promise.all([
        sharp(source).avif({ quality: 68, effort: 6 }).toBuffer(),
        sharp(source).webp({ quality: 82, effort: 5 }).toBuffer()
      ]);
      const avifHash = sha256(avif);
      const webpHash = sha256(webp);
      if (!updateHashes && (avifHash !== variant.avifSha256 || webpHash !== variant.webpSha256)) {
        throw new Error(`${record.project.slug}/${viewportName}: promoted output SHA-256 mismatch`);
      }
      if (updateHashes) {
        variant.avifSha256 = avifHash;
        variant.webpSha256 = webpHash;
      }

      await mkdir(new URL("./", avifOutput), { recursive: true });
      const avifPath = fileURLToPath(avifOutput);
      const webpPath = fileURLToPath(webpOutput);
      const nonce = `${process.pid}-${Date.now()}-${viewportName}`;
      const avifTemporaryPath = `${avifPath}.${nonce}.tmp`;
      const webpTemporaryPath = `${webpPath}.${nonce}.tmp`;
      try {
        await Promise.all([
          writeFile(avifTemporaryPath, avif),
          writeFile(webpTemporaryPath, webp)
        ]);
        await Promise.all([
          rename(avifTemporaryPath, avifPath),
          rename(webpTemporaryPath, webpPath)
        ]);
      } finally {
        await Promise.all([
          rm(avifTemporaryPath, { force: true }),
          rm(webpTemporaryPath, { force: true })
        ]);
      }
      promoted += 2;
    }
  }

  if (updateHashes && screenshots.length > 0) {
    await writeFile(new URL(file, evidenceDirectory), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  }
}

console.log(`Promoted ${promoted} optimized evidence images from reviewed source captures.`);

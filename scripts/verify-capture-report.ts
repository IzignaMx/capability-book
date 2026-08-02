import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { hasCaptureSourceDrift } from "./capture-validation";

interface CaptureResult {
  slug: string;
  viewport: string;
  status: "captured" | "blocked" | "skipped" | "error";
  path?: string;
  marker?: string;
  sha256?: string;
  url?: string;
}

interface ScreenshotEvidence {
  role: "screenshot";
  provenance: {
    sourceUrl: string;
    sourceSha256: Record<"mobile" | "desktop", string>;
  };
}

interface EvidenceRecord {
  project: { slug: string };
  media: Array<{ role: string } | ScreenshotEvidence>;
}

const root = new URL("../", import.meta.url);
const report = JSON.parse(
  await readFile(new URL("artifacts/captures/report.json", root), "utf8")
) as CaptureResult[];
const evidenceDirectory = new URL("data/evidence/", root);
const evidenceFiles = (await readdir(evidenceDirectory)).filter((file) => file.endsWith(".json"));
const evidenceBySlug = new Map<string, ScreenshotEvidence>();
const sourceDrifts: string[] = [];

for (const file of evidenceFiles) {
  const record = JSON.parse(await readFile(new URL(file, evidenceDirectory), "utf8")) as EvidenceRecord;
  const screenshot = record.media.find((item): item is ScreenshotEvidence => item.role === "screenshot");
  if (screenshot) evidenceBySlug.set(record.project.slug, screenshot);
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

if (report.length !== 12) throw new Error(`Expected 12 capture audit results, received ${report.length}`);
if (report.some((result) => result.status === "error")) throw new Error("Capture report contains errors");

for (const result of report) {
  if (result.status === "captured") {
    if (!result.path) throw new Error(`${result.slug}/${result.viewport}: captured result has no file path`);
    if (!result.sha256) throw new Error(`${result.slug}/${result.viewport}: captured result has no SHA-256`);
    const capture = await readFile(new URL(`artifacts/captures/${result.path}`, root));
    const actualHash = sha256(capture);
    if (actualHash !== result.sha256) {
      throw new Error(`${result.slug}/${result.viewport}: capture SHA-256 does not match its report`);
    }

    const publishedEvidence = evidenceBySlug.get(result.slug);
    if (publishedEvidence) {
      if (result.url !== publishedEvidence.provenance.sourceUrl) {
        throw new Error(`${result.slug}/${result.viewport}: capture URL does not match published provenance`);
      }
      if (result.viewport !== "mobile" && result.viewport !== "desktop") {
        throw new Error(`${result.slug}/${result.viewport}: unsupported evidence viewport`);
      }
      if (hasCaptureSourceDrift(actualHash, publishedEvidence.provenance.sourceSha256[result.viewport])) {
        sourceDrifts.push(`${result.slug}/${result.viewport}`);
      }
    }
  }
  if (result.status === "blocked" && !result.marker) {
    throw new Error(`${result.slug}/${result.viewport}: blocked result has no verified challenge marker`);
  }
  if (result.status !== "captured" && result.path) {
    throw new Error(`${result.slug}/${result.viewport}: rejected result must not expose a screenshot path`);
  }
}

for (const drift of sourceDrifts) {
  const message = `${drift}: current cross-platform capture differs from the reviewed source master; inspect the audit artifact before updating evidence`;
  console.warn(process.env.GITHUB_ACTIONS ? `::warning title=Visual evidence drift::${message}` : `WARNING: ${message}`);
}

console.log(`Verified ${report.length} capture audit results without accepting blocked pages as evidence.`);

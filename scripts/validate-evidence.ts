import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import AjvFormatsModule from "ajv-formats";
import sharp from "sharp";

const addFormats = AjvFormatsModule.default;

type EvidenceSource = {
  id: string;
};

type ProofPoint = {
  sourceIds: string[];
};

type EvidenceRecord = {
  project: { slug: string };
  sources: EvidenceSource[];
  proofPoints: ProofPoint[];
  media: EvidenceMedia[];
};

type MediaVariant = {
  avif: string;
  webp: string;
  width: number;
  height: number;
  avifSha256: string;
  webpSha256: string;
};

type EvidenceMedia = {
  id: string;
  role: string;
  path: string;
  variants?: { mobile: MediaVariant; desktop: MediaVariant };
};

const root = new URL("../", import.meta.url);
const schema = JSON.parse(
  await readFile(new URL("data/evidence.schema.json", root), "utf8")
) as object;
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const directory = new URL("data/evidence/", root);
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".json"))
  .sort();

if (files.length !== 6) {
  throw new Error(`Expected exactly 6 flagship evidence files, found ${files.length}`);
}

function publicMediaUrl(path: string): URL {
  return new URL(`public${path}`, root);
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function validateVariant(projectSlug: string, viewport: string, variant: MediaVariant): Promise<void> {
  for (const [format, path, expectedHash] of [
    ["avif", variant.avif, variant.avifSha256],
    ["webp", variant.webp, variant.webpSha256]
  ] as const) {
    const expectedPrefix = `/media/projects/${projectSlug}/evidence/`;
    if (!path.startsWith(expectedPrefix)) {
      throw new Error(`${projectSlug}: ${viewport} ${format} evidence must use ${expectedPrefix}`);
    }
    const file = await readFile(publicMediaUrl(path));
    if (sha256(file) !== expectedHash) {
      throw new Error(`${projectSlug}: ${viewport} ${format} evidence hash does not match its record`);
    }

    const metadata = await sharp(file).metadata();
    if (metadata.width !== variant.width || metadata.height !== variant.height) {
      throw new Error(
        `${projectSlug}: ${viewport} ${format} expected ${variant.width}x${variant.height}, received ${metadata.width}x${metadata.height}`
      );
    }
  }
}

for (const file of files) {
  const value = JSON.parse(
    await readFile(new URL(file, directory), "utf8")
  ) as EvidenceRecord;

  if (!validate(value)) {
    throw new Error(
      `${file}: ${ajv.errorsText(validate.errors, { separator: "\n" })}`
    );
  }

  if (`${value.project.slug}.json` !== file) {
    throw new Error(`${file}: project slug must match the evidence filename`);
  }

  const sourceIds = new Set(value.sources.map((source) => source.id));
  if (sourceIds.size !== value.sources.length) {
    throw new Error(`${file}: source IDs must be unique`);
  }

  for (const point of value.proofPoints) {
    for (const sourceId of point.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(
          `${file}: proof point references missing source ${sourceId}`
        );
      }
    }
  }

  const canonicalMediaPrefix = `/media/projects/${value.project.slug}/`;
  for (const media of value.media) {
    if (!media.path.startsWith(canonicalMediaPrefix)) {
      throw new Error(`${file}: media ${media.id} must use ${canonicalMediaPrefix}`);
    }
    await readFile(publicMediaUrl(media.path));

    if (media.role === "screenshot") {
      if (!media.variants) throw new Error(`${file}: screenshot ${media.id} is missing variants`);
      await validateVariant(value.project.slug, "mobile", media.variants.mobile);
      await validateVariant(value.project.slug, "desktop", media.variants.desktop);
    }
  }
}

console.log(`Validated ${files.length} flagship evidence records.`);

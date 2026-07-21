import { readdir, readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import AjvFormatsModule from "ajv-formats";

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
}

console.log(`Validated ${files.length} flagship evidence records.`);

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

type EvidenceRecord = {
  project: {
    title: string;
  };
  classification: string;
  publication: {
    confidentiality: string;
    publishable: boolean;
  };
  proofPoints: unknown[];
  sources: unknown[];
  links: Array<{ public: boolean }>;
};

const directory = new URL("../data/evidence/", import.meta.url);
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".json"))
  .sort();
const records = await Promise.all(
  files.map(async (file) =>
    JSON.parse(await readFile(new URL(file, directory), "utf8")) as EvidenceRecord
  )
);

if (records.length !== 6) {
  throw new Error(`Expected six flagship records, found ${records.length}`);
}

const publishable = records.filter((record) => record.publication.publishable);
if (publishable.length !== 6) {
  throw new Error(
    `Expected six publishable flagship records, found ${publishable.length}`
  );
}

const lines = [
  "# Flagship evidence summary",
  "",
  "| Project | Classification | Boundary | Publishable | Proof points | Sources | Public links |",
  "|---|---|---|---:|---:|---:|---:|",
  ...records.map(
    (record) =>
      `| ${record.project.title} | ${record.classification} | ${record.publication.confidentiality} | ${record.publication.publishable ? "yes" : "no"} | ${record.proofPoints.length} | ${record.sources.length} | ${record.links.filter((link) => link.public).length} |`
  ),
  "",
  `**Publishable flagship entries:** ${publishable.length}`,
  ""
];
const artifacts = new URL("../artifacts/", import.meta.url);
await mkdir(artifacts, { recursive: true });
await writeFile(new URL("evidence-summary.md", artifacts), lines.join("\n"));
console.log(`Generated evidence summary for ${records.length} flagship records.`);

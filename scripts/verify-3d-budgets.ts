import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import {
  findSingleBuiltModule,
  readBuiltModuleGraph,
  staticModuleClosure
} from "./built-module-graph";

const distDirectory = resolve("dist");
const publicDirectory = resolve("public");
const exploreMediaDirectory = resolve("public", "media", "explore");
const nomadaPoster = resolve(
  publicDirectory,
  "media",
  "projects",
  "hamburguesa-nomada",
  "poster.avif"
);

const LIMITS = {
  bootstrapGzip: 250 * 1024,
  heroModel: 700 * 1024,
  deferredSceneGzip: 1.5 * 1024 * 1024,
  mobilePoster: 180 * 1024,
  desktopPoster: 320 * 1024,
  png: 200 * 1024
} as const;

interface BudgetFailure {
  readonly assetName: string;
  readonly message: string;
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(path);
      return entry.isFile() ? [path] : [];
    })
  );
  return files.flat().sort();
}

async function gzipBytes(files: ReadonlySet<string>): Promise<number> {
  const sizes = await Promise.all(
    [...files].map(async (file) => gzipSync(await readFile(file), { level: 9 }).byteLength)
  );
  return sizes.reduce((total, size) => total + size, 0);
}

async function transferredAssetBytes(file: string): Promise<number> {
  try {
    return (await stat(file)).size;
  } catch {
    throw new Error(
      `Deferred scene asset is missing: ${relative(publicDirectory, file).replaceAll("\\", "/")}`
    );
  }
}

function without(files: ReadonlySet<string>, excluded: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...files].filter((file) => !excluded.has(file)));
}

function exceptionPath(assetName: string): string {
  const slug = assetName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `docs/architecture/adr/exceptions/${slug}.md`;
}

function enforce(
  failures: BudgetFailure[],
  assetName: string,
  actual: number,
  limit: number,
  unit: "bytes" | "bytes gzip" | "bytes transfer"
): void {
  console.log(`- ${assetName}: ${actual} / ${limit} ${unit}`);
  if (actual <= limit) return;
  failures.push({
    assetName,
    message: `${assetName} exceeds its budget by ${Math.ceil(actual - limit)} ${unit}`
  });
}

const graph = await readBuiltModuleGraph(distDirectory);
const exploreCanvas = findSingleBuiltModule(graph, "ExploreCanvas");
const heroSignal = findSingleBuiltModule(graph, "HeroSignalScene");
const capabilityOrbit = findSingleBuiltModule(graph, "CapabilityOrbitScene");
const omniSync = findSingleBuiltModule(graph, "OmniSyncScene");
const nomada = findSingleBuiltModule(graph, "NomadaScene");

const bootstrapClosure = staticModuleClosure(graph, [exploreCanvas, heroSignal]);
const bootstrapBytes = await gzipBytes(bootstrapClosure);
const failures: BudgetFailure[] = [];

console.log("Cinematic JavaScript budgets:");
enforce(failures, "initial-3d-bootstrap", bootstrapBytes, LIMITS.bootstrapGzip, "bytes gzip");

for (const [name, entry, assets] of [
  ["capability-orbit-scene", capabilityOrbit, []],
  ["omnisync-scene", omniSync, []],
  ["nomada-scene", nomada, [nomadaPoster]]
] as const) {
  const deferredClosure = without(staticModuleClosure(graph, [entry]), bootstrapClosure);
  const packageBytes = await gzipBytes(deferredClosure) +
    (await Promise.all(assets.map(transferredAssetBytes))).reduce(
      (total, assetBytes) => total + assetBytes,
      0
    );
  enforce(
    failures,
    name,
    packageBytes,
    LIMITS.deferredSceneGzip,
    "bytes transfer"
  );
}

const mediaFiles = await collectFiles(exploreMediaDirectory);
const poster = mediaFiles.find((file) => basename(file) === "hero.avif");
if (poster === undefined) throw new Error("Explore fallback poster is missing: public/media/explore/hero.avif");

console.log("Cinematic asset budgets:");
const posterBytes = (await stat(poster)).size;
enforce(failures, "mobile-explore-poster", posterBytes, LIMITS.mobilePoster, "bytes");
enforce(failures, "desktop-explore-poster", posterBytes, LIMITS.desktopPoster, "bytes");

const heroModels = mediaFiles.filter((file) => extname(file).toLowerCase() === ".glb");
if (heroModels.length === 0) {
  console.log("- hero-model: procedural primitives (no GLB transfer)");
} else {
  for (const model of heroModels) {
    enforce(
      failures,
      relative(exploreMediaDirectory, model).replaceAll("\\", "/"),
      (await stat(model)).size,
      LIMITS.heroModel,
      "bytes"
    );
  }
}

for (const png of mediaFiles.filter((file) => extname(file).toLowerCase() === ".png")) {
  enforce(
    failures,
    relative(exploreMediaDirectory, png).replaceAll("\\", "/"),
    (await stat(png)).size,
    LIMITS.png,
    "bytes"
  );
}

if (failures.length > 0) {
  const report = failures
    .map(({ assetName, message }) => `${message}. Exception template: ${exceptionPath(assetName)}`)
    .join("\n");
  throw new Error(`Cinematic budget validation failed:\n${report}`);
}

console.log("Cinematic performance budgets passed.");

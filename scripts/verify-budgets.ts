import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const distDirectory = resolve("dist");
const spanishHome = resolve(distDirectory, "es", "index.html");
const criticalBudget = 120 * 1024;
const javascriptBudget = 180 * 1024;

async function collectInitialAssets(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectInitialAssets(entryPath);
      return entry.isFile() && [".html", ".css", ".js"].includes(extname(entry.name))
        ? [entryPath]
        : [];
    })
  );
  return files.flat().sort();
}

function localAssetPaths(html: string, extension: ".css" | ".js"): string[] {
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .flatMap((match) => match[1] ? [match[1]] : [])
    .flatMap((value) => {
      const [path] = value.split(/[?#]/, 1);
      return path ? [path] : [];
    })
    .filter((value): value is string => Boolean(value) && value.endsWith(extension))
    .map((value) => resolve(distDirectory, value.replace(/^\//, "")));
  return [...new Set(references)];
}

async function gzipBytes(file: string): Promise<number> {
  return gzipSync(await readFile(file), { level: 9 }).byteLength;
}

const assets = await collectInitialAssets(distDirectory);
if (!assets.length) throw new Error("No HTML, CSS, or JavaScript assets found in dist.");

console.log("Compressed static asset sizes:");
for (const file of assets) {
  console.log(`- ${relative(distDirectory, file).replaceAll("\\", "/")}: ${await gzipBytes(file)} bytes gzip`);
}

const homeHtml = await readFile(spanishHome, "utf8");
const homeCss = localAssetPaths(homeHtml, ".css");
const homeJavascript = localAssetPaths(homeHtml, ".js");
const criticalBytes = await gzipBytes(spanishHome) +
  (await Promise.all(homeCss.map(gzipBytes))).reduce((total, bytes) => total + bytes, 0);
const javascriptBytes = (await Promise.all(homeJavascript.map(gzipBytes))).reduce(
  (total, bytes) => total + bytes,
  0
);

console.log(`Critical /es/ HTML + CSS: ${criticalBytes} / ${criticalBudget} bytes gzip`);
console.log(`Initial /es/ JavaScript: ${javascriptBytes} / ${javascriptBudget} bytes gzip`);

if (criticalBytes > criticalBudget) {
  throw new Error(`Critical HTML + CSS budget exceeded by ${criticalBytes - criticalBudget} bytes.`);
}
if (javascriptBytes > javascriptBudget) {
  throw new Error(`Initial JavaScript budget exceeded by ${javascriptBytes - javascriptBudget} bytes.`);
}

import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const distDirectory = resolve("dist");

async function collectHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectHtmlFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
    })
  );
  return files.flat().sort();
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1];
}

function validateHtml(file: string, html: string): string[] {
  const errors: string[] = [];
  const path = relative(distDirectory, file).replaceAll("\\", "/");

  if (!/<html\b[^>]*\slang=["'][a-z]{2}(?:-[A-Z]{2})?["']/i.test(html)) {
    errors.push("missing <html lang>");
  }
  if (!/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/[^"']+["'])[^>]*>/i.test(html)) {
    errors.push("missing absolute HTTPS canonical link");
  }
  if (/IzignaMX|IZIGNAMX|Izigna\s+Mx|Izigna-Mx/.test(html)) {
    errors.push("contains invalid IzignaMx brand spelling");
  }

  const isProjectPage = /^(?:es\/proyectos|en\/projects)\/[^/]+\/index\.html$/.test(path);
  if (isProjectPage && !/class=["'][^"']*case-study__classification[^"']*["']/.test(html)) {
    errors.push("project page is missing its classification label");
  }

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = image[0];
    for (const required of ["alt", "width", "height"] as const) {
      if (attribute(tag, required) === undefined) {
        errors.push(`image is missing ${required}: ${tag.slice(0, 140)}`);
      }
    }
  }

  for (const anchor of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = anchor[0];
    const href = attribute(tag, "href");
    if (attribute(tag, "target") !== "_blank" || !href?.startsWith("http")) continue;
    const rel = new Set((attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/));
    if (!rel.has("noopener")) {
      errors.push(`external _blank link is missing noopener: ${tag.slice(0, 140)}`);
    }
  }

  return errors.map((error) => `${path}: ${error}`);
}

const htmlFiles = await collectHtmlFiles(distDirectory);
if (!htmlFiles.length) throw new Error("No HTML files found in dist. Run the Astro build first.");

const errors = (
  await Promise.all(
    htmlFiles.map(async (file) => validateHtml(file, await readFile(file, "utf8")))
  )
).flat();

if (errors.length) {
  throw new Error(`Built HTML validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
}

console.log(`Validated ${htmlFiles.length} built HTML files.`);

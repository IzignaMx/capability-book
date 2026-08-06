import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * check-tokens.ts — validates CSS custom property usage in the codebase.
 *
 * Fails when a `var(--token)` reference has no matching `--token` definition
 * and no inline fallback (e.g. `var(--space-5, 1.25rem)`). Reports unused
 * tokens and cross-file duplicate definitions as warnings.
 *
 * Definitions may live in any scanned file (tokens.scss is the canonical
 * source); media-query re-declarations within the same file are allowed.
 */

export interface TokenScanFile {
  path: string;
  content: string;
}

export interface TokenViolation {
  file: string;
  line: number;
  token: string;
}

export interface TokenScanReport {
  violations: TokenViolation[];
  unusedTokens: string[];
  duplicateDefinitions: string[];
}

const definitionPattern = /(--[a-z0-9-]+)\s*:/g;
const consumerPattern = /var\(\s*(--[a-z0-9-]+)\s*(,|\))/g;

export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");
}

export function scanTokenViolations(files: TokenScanFile[]): TokenScanReport {
  const definitions = new Map<string, Set<string>>();
  const consumers: Array<{
    file: string;
    line: number;
    token: string;
    hasFallback: boolean;
  }> = [];

  for (const file of files) {
    const text = stripComments(file.content);

    for (const match of text.matchAll(definitionPattern)) {
      const token = match[1];
      if (!token) continue;
      if (!definitions.has(token)) definitions.set(token, new Set());
      definitions.get(token)!.add(file.path);
    }

    for (const match of text.matchAll(consumerPattern)) {
      const token = match[1];
      if (!token) continue;
      const line = text.slice(0, match.index).split("\n").length;
      consumers.push({
        file: file.path,
        line,
        token,
        hasFallback: match[2] === ","
      });
    }
  }

  const violations = consumers
    .filter((consumer) => !consumer.hasFallback && !definitions.has(consumer.token))
    .map(({ file, line, token }) => ({ file, line, token }));

  const usedTokens = new Set(consumers.map((consumer) => consumer.token));
  const unusedTokens = [...definitions.keys()]
    .filter((token) => !usedTokens.has(token))
    .sort();

  const duplicateDefinitions = [...definitions.entries()]
    .filter(([, filesSet]) => filesSet.size > 1)
    .map(([token]) => token)
    .sort();

  return { violations, unusedTokens, duplicateDefinitions };
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(resolved)));
      continue;
    }

    if (/\.(scss|astro|tsx|ts)$/.test(entry.name)) {
      files.push(resolved);
    }
  }

  return files;
}

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = await collectFiles(path.join(root, "src"));
  const report = scanTokenViolations(
    await Promise.all(
      files.map(async (file) => ({
        path: path.relative(root, file),
        content: await readFile(file, "utf8")
      }))
    )
  );

  if (report.violations.length > 0) {
    console.error(
      report.violations
        .map(
          (violation) =>
            `${violation.file}:${violation.line}: undefined CSS variable ${violation.token}`
        )
        .join("\n")
    );
    process.exitCode = 1;
    return;
  }

  for (const token of report.duplicateDefinitions) {
    console.warn(
      `warning: token ${token} is defined in more than one file; canonical source is src/styles/tokens.scss`
    );
  }

  for (const token of report.unusedTokens) {
    console.warn(`warning: token ${token} is defined but never consumed`);
  }

  console.log(
    `Spacing tokens validated (${files.length} files, ${report.unusedTokens.length} unused, ${report.duplicateDefinitions.length} cross-file duplicates).`
  );
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) {
  await main();
}

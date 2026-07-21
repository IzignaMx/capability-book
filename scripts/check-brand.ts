import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const invalidNames = [
  { label: "IzignaMX", pattern: /\bIzignaMX\b/ },
  { label: "Izignamx", pattern: /\bIzignamx\b/ },
  { label: "IZIGNA", pattern: /\bIZIGNA\b/ },
  { label: "Izigna", pattern: /\bIzigna\b(?!Mx)/ }
] as const;

const orangeValues = "(?:#ff6a1a|#f97316|orange)";
const cssOrangeTokenPattern = new RegExp(
  `--(?:color-)?(?:brand|accent|primary|focus|active|selection|progress)\\s*:\\s*${orangeValues}\\b`,
  "i"
);
const jsonOrangeTokenPattern = new RegExp(
  `"(?:brand|accent|primary|focus|active|selection|progress)"\\s*:\\s*"${orangeValues}"`,
  "i"
);

export function scanBrandViolations(
  text: string,
  filePath: string
): string[] {
  const violations: string[] = [];

  for (const rule of invalidNames) {
    if (rule.pattern.test(text)) {
      violations.push(
        `${filePath}: disallowed brand spelling ${rule.label}`
      );
    }
  }

  if (
    cssOrangeTokenPattern.test(text) ||
    jsonOrangeTokenPattern.test(text)
  ) {
    violations.push(
      `${filePath}: orange cannot be assigned to a global brand token`
    );
  }

  return violations;
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

    if (entry.isSymbolicLink()) {
      const metadata = await stat(resolved);
      if (metadata.isDirectory()) continue;
    }

    if (/\.(astro|css|json|md|mdx|scss|ts|tsx|yml|yaml)$/.test(entry.name)) {
      files.push(resolved);
    }
  }

  return files;
}

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const roots = ["src", "public", "data/evidence", "docs/evidence"];
  const fileGroups = await Promise.all(
    roots.map(async (entry) => {
      try {
        return await collectFiles(path.join(root, entry));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw error;
      }
    })
  );

  const optionalFiles = ["data/media-manifest.json", "data/measurement-plan.json"];
  const explicitFiles = (
    await Promise.all(
      optionalFiles.map(async (entry) => {
        const file = path.join(root, entry);
        try {
          await stat(file);
          return file;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
          throw error;
        }
      })
    )
  ).filter((file): file is string => file !== null);

  const violations = (
    await Promise.all(
      [...fileGroups.flat(), ...explicitFiles]
        .map(async (file) =>
          scanBrandViolations(
            await readFile(file, "utf8"),
            path.relative(root, file)
          )
        )
    )
  ).flat();

  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("IzignaMx brand constraints passed.");
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) {
  await main();
}

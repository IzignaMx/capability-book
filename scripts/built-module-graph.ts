import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import ts from "typescript";

export interface BuiltModule {
  readonly file: string;
  readonly staticImports: readonly string[];
  readonly dynamicImports: readonly string[];
}

export type BuiltModuleGraph = ReadonlyMap<string, BuiltModule>;

async function collectJavaScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectJavaScriptFiles(path);
      return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
    })
  );
  return files.flat().sort();
}

function resolveLocalImport(distDirectory: string, importer: string, specifier: string): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) return null;

  const resolved = specifier.startsWith("/")
    ? resolve(distDirectory, specifier.slice(1))
    : resolve(dirname(importer), specifier);
  const relativePath = relative(distDirectory, resolved);
  if (relativePath.startsWith(`..${sep}`) || relativePath === "..") {
    throw new Error(`Built import escapes dist: ${specifier} from ${relative(distDirectory, importer)}`);
  }
  return resolved;
}

function parseModuleImports(
  distDirectory: string,
  file: string,
  sourceText: string
): Pick<BuiltModule, "staticImports" | "dynamicImports"> {
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const staticImports = new Set<string>();
  const dynamicImports = new Set<string>();

  const record = (target: Set<string>, specifier: string) => {
    const resolved = resolveLocalImport(distDirectory, file, specifier);
    if (resolved !== null) target.add(resolved);
  };

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      record(staticImports, node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const [argument] = node.arguments;
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        record(dynamicImports, argument.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return {
    staticImports: [...staticImports].sort(),
    dynamicImports: [...dynamicImports].sort()
  };
}

export async function readBuiltModuleGraph(distDirectory: string): Promise<BuiltModuleGraph> {
  const files = await collectJavaScriptFiles(distDirectory);
  const records = await Promise.all(
    files.map(async (file): Promise<readonly [string, BuiltModule]> => {
      const imports = parseModuleImports(distDirectory, file, await readFile(file, "utf8"));
      return [file, { file, ...imports }] as const;
    })
  );
  return new Map(records);
}

export function staticModuleClosure(
  graph: BuiltModuleGraph,
  entryFiles: readonly string[]
): ReadonlySet<string> {
  const visited = new Set<string>();
  const pending = [...entryFiles];

  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || visited.has(file)) continue;

    const module = graph.get(file);
    if (module === undefined) {
      throw new Error(`Built JavaScript module is missing from graph: ${file}`);
    }

    visited.add(file);
    pending.push(...module.staticImports);
  }

  return visited;
}

export function findSingleBuiltModule(
  graph: BuiltModuleGraph,
  filenamePrefix: string
): string {
  const matches = [...graph.keys()].filter((file) => {
    const filename = file.slice(Math.max(file.lastIndexOf("/"), file.lastIndexOf("\\")) + 1);
    return filename.startsWith(`${filenamePrefix}.`) && filename.endsWith(".js");
  });

  if (matches.length !== 1) {
    throw new Error(
      `Expected one ${filenamePrefix} built module, found ${matches.length}: ${matches.join(", ")}`
    );
  }
  return matches[0] as string;
}

export function resolveBuiltReference(distDirectory: string, reference: string): string {
  const [path] = reference.split(/[?#]/, 1);
  if (path === undefined || path.length === 0) {
    throw new Error(`Invalid built asset reference: ${reference}`);
  }
  return resolve(distDirectory, path.replace(/^\//, ""));
}

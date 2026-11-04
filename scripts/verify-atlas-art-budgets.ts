import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import sharp from 'sharp';
import { findSingleBuiltModule, readBuiltModuleGraph } from './built-module-graph';

export const ATLAS_ART_LIMITS = {
  mobilePoster: 180 * 1024, desktopPoster: 320 * 1024, model: 700 * 1024,
  bootstrapGzip: 250 * 1024, deferredTransfer: 1.5 * 1024 * 1024,
} as const;
const phases = ['matter', 'trajectory', 'weave', 'constellation'];
type ProvenanceAsset = { path: string; sha256: string; bytes: number; width?: number; height?: number };
const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

/** Reject external fetch dependencies and placeholder/non-binary GLB files. */
export function validateEmbeddedGlb(bytes: Buffer): void {
  assert(bytes.length >= 28 && bytes.toString('ascii', 0, 4) === 'glTF', 'Invalid GLB header');
  assert(bytes.readUInt32LE(4) === 2 && bytes.readUInt32LE(8) === bytes.length, 'Invalid GLB version/length');
  let offset = 12;
  let document: Record<string, any> | undefined;
  let binaryLength = 0;
  while (offset < bytes.length) {
    assert(offset + 8 <= bytes.length, 'Truncated GLB chunk');
    const length = bytes.readUInt32LE(offset), kind = bytes.readUInt32LE(offset + 4);
    assert(length % 4 === 0 && offset + 8 + length <= bytes.length, 'Invalid GLB chunk length');
    if (offset === 12) {
      assert(kind === 0x4e4f534a, 'GLB must begin with JSON');
      document = JSON.parse(bytes.toString('utf8', offset + 8, offset + 8 + length));
    } else {
      assert(kind === 0x004e4942 && binaryLength === 0, 'Unexpected GLB chunk');
      binaryLength = length;
    }
    offset += 8 + length;
  }
  assert(document?.asset?.version === '2.0' && document.meshes?.length > 0, 'GLB must contain glTF 2 geometry');
  assert(binaryLength > 0 && document.buffers?.length === 1 &&
    Number.isSafeInteger(document.buffers[0].byteLength) && document.buffers[0].byteLength > 0 &&
    document.buffers[0].byteLength <= binaryLength, 'GLB must contain one embedded binary buffer');
  const checkUris = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'uri') assert(typeof child === 'string' && child.startsWith('data:'), 'GLB contains an external URI');
      else checkUris(child);
    }
  };
  checkUris(document);
}

export async function verifyAtlasArtBudgets(options: { root?: string; dist?: string; provenance?: string; report?: string } = {}) {
  const root = resolve(options.root ?? '.');
  const dist = resolve(root, options.dist ?? 'dist');
  const reportPath = resolve(root, options.report ?? 'docs/atlas/art-budgets.json');
  const report = {
    limits: ATLAS_ART_LIMITS,
    measurement: 'Each unique deferred JS static/dynamic descendant is gzip level 9; shared initial modules count conservatively. Transfer is JS gzip plus raw embedded GLB bytes. Posters use raw bytes.',
    assets: [] as { path: string; bytes: number; sha256: string; width?: number; height?: number }[],
    deferredModules: [] as string[], bootstrapGzipBytes: 0, deferredTransferBytes: 0, errors: [] as string[],
  };
  try {
    const provenance = JSON.parse(await readFile(resolve(root, options.provenance ?? 'docs/atlas/folio-provenance.json'), 'utf8'));
    assert(Array.isArray(provenance.assets), 'Folio provenance must contain assets');
    const records = new Map<string, ProvenanceAsset>();
    for (const asset of provenance.assets as ProvenanceAsset[]) {
      assert(typeof asset.path === 'string' && !records.has(asset.path), 'Duplicate/invalid provenance asset path');
      records.set(asset.path, asset);
    }
    const expected = phases.flatMap(phase => ['mobile', 'desktop'].flatMap(viewport =>
      ['avif', 'webp'].map(format => `/art/folio/${phase}-${viewport}.${format}`)));
    expected.push('/art/folio/folio.glb');
    const inventory = (await readdir(resolve(dist, 'art/folio'))).sort();
    assert(JSON.stringify(inventory) === JSON.stringify(expected.map(p => p.split('/').at(-1)).sort()), 'Unexpected/missing folio artifact files');
    assert(records.size === expected.length && expected.every(path => records.has(path)), 'Provenance must cover exactly all 17 folio assets');
    let modelBytes = 0;
    for (const path of expected) {
      const file = await readFile(resolve(dist, `.${path}`));
      const source = await readFile(resolve(root, `public${path}`));
      assert(file.equals(source), `${path}: artifact differs from public source`);
      const sha256 = createHash('sha256').update(file).digest('hex');
      const record = records.get(path)!;
      assert(record.sha256 === sha256 && record.bytes === file.length, `${path}: provenance hash/bytes mismatch`);
      if (path.endsWith('.glb')) {
        validateEmbeddedGlb(file);
        assert(file.length <= ATLAS_ART_LIMITS.model, `${path}: model exceeds 700 KiB`);
        modelBytes = file.length;
        report.assets.push({ path, bytes: file.length, sha256 });
      } else {
        const mobile = path.includes('-mobile.');
        const width = mobile ? 800 : 1600, height = mobile ? 1000 : 1100;
        const metadata = await sharp(file).metadata();
        assert(metadata.format === (path.endsWith('.avif') ? 'heif' : 'webp'), `${path}: image format mismatch`);
        assert(metadata.width === width && metadata.height === height, `${path}: incorrect dimensions`);
        assert(record.width === width && record.height === height, `${path}: provenance dimensions mismatch`);
        assert(file.length <= (mobile ? ATLAS_ART_LIMITS.mobilePoster : ATLAS_ART_LIMITS.desktopPoster), `${path}: poster byte budget exceeded`);
        report.assets.push({ path, bytes: file.length, sha256, width, height });
      }
    }
    const graph = await readBuiltModuleGraph(dist);
    const entry = findSingleBuiltModule(graph, 'ConstellationRuntime');
    const seen = new Set<string>(), pending = [entry];
    while (pending.length) {
      const file = pending.pop()!;
      if (seen.has(file)) continue;
      const module = graph.get(file);
      assert(module, `Missing deferred JS module: ${relative(dist, file)}`);
      seen.add(file);
      pending.push(...module.staticImports, ...module.dynamicImports);
    }
    report.deferredModules = [...seen].map(file => relative(dist, file).replaceAll('\\', '/')).sort();
    for (const file of seen) report.bootstrapGzipBytes += gzipSync(await readFile(file), { level: 9 }).length;
    report.deferredTransferBytes = report.bootstrapGzipBytes + modelBytes;
    assert(report.bootstrapGzipBytes <= ATLAS_ART_LIMITS.bootstrapGzip, 'Constellation bootstrap exceeds 250 KiB gzip');
    assert(report.deferredTransferBytes <= ATLAS_ART_LIMITS.deferredTransfer, 'Constellation deferred transfer exceeds 1.5 MiB');
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  assert(report.errors.length === 0, `Atlas art budgets failed: ${report.errors.join('; ')}`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verifyAtlasArtBudgets().then(report => console.log(`Atlas art budgets passed: ${report.assets.length} assets, ${report.bootstrapGzipBytes} bytes JS gzip, ${report.deferredTransferBytes} bytes deferred transfer.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

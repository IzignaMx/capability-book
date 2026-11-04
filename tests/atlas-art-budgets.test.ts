// @vitest-environment node
import { createHash, randomBytes } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { ATLAS_ART_LIMITS, validateEmbeddedGlb, verifyAtlasArtBudgets } from '../scripts/verify-atlas-art-budgets';

let template: string;
const temporary: string[] = [];
const poster = '/art/folio/matter-mobile.webp';
const triangleDocument = () => ({
  asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
  bufferViews: [{ buffer: 0, byteLength: 36 }], buffers: [{ byteLength: 36 }],
});
function encodeGlb(document: object, binary: Buffer): Buffer {
  const text = JSON.stringify(document), json = Buffer.from(text.padEnd(Math.ceil(Buffer.byteLength(text) / 4) * 4));
  const paddedBinary = Buffer.alloc(Math.ceil(binary.length / 4) * 4); binary.copy(paddedBinary);
  const result = Buffer.alloc(12 + 8 + json.length + 8 + paddedBinary.length);
  result.write('glTF'); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12); result.writeUInt32LE(0x4e4f534a, 16); json.copy(result, 20);
  result.writeUInt32LE(paddedBinary.length, 20 + json.length); result.writeUInt32LE(0x004e4942, 24 + json.length);
  paddedBinary.copy(result, 28 + json.length);
  return result;
}
const triangleVertices = () => {
  const bytes = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return bytes;
};
function glb(external = false): Buffer {
  const document = triangleDocument();
  if (external) Object.assign(document.buffers[0]!, { uri: 'https://example.com/model.bin' });
  return encodeGlb(document, triangleVertices());
}
function padGlbTo(bytes: Buffer, length: number): Buffer {
  const result = Buffer.alloc(length), binaryHeader = 20 + bytes.readUInt32LE(12);
  bytes.copy(result); result.writeUInt32LE(length, 8);
  result.writeUInt32LE(length - binaryHeader - 8, binaryHeader);
  return result;
}
async function replace(root: string, path: string, bytes: Buffer, dimensions?: { width: number; height: number }) {
  await writeFile(resolve(root, `public${path}`), bytes);
  await writeFile(resolve(root, `dist${path}`), bytes);
  const provenancePath = resolve(root, 'docs/atlas/folio-provenance.json');
  const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
  const record = provenance.assets.find((asset: { path: string }) => asset.path === path);
  Object.assign(record, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }, dimensions);
  await writeFile(provenancePath, JSON.stringify(provenance));
}
async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'atlas-budget-test-'));
  temporary.push(root); await cp(template, root, { recursive: true }); return root;
}
beforeAll(async () => {
  template = await mkdtemp(resolve(tmpdir(), 'atlas-budget-template-'));
  for (const path of ['public/art/folio', 'dist/art/folio', 'dist/_astro', 'docs/atlas'])
    await mkdir(resolve(template, path), { recursive: true });
  const assets = [];
  for (const phase of ['matter', 'trajectory', 'weave', 'constellation']) {
    for (const viewport of ['mobile', 'desktop']) {
      const width = viewport === 'mobile' ? 800 : 1600, height = viewport === 'mobile' ? 1000 : 1100;
      for (const format of ['avif', 'webp'] as const) {
        const path = `/art/folio/${phase}-${viewport}.${format}`;
        const bytes = await sharp({ create: { width, height, channels: 4, background: '#3b82f6' } }).toFormat(format).toBuffer();
        for (const prefix of ['public', 'dist']) await writeFile(resolve(template, `${prefix}${path}`), bytes);
        assets.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), width, height });
      }
    }
  }
  const path = '/art/folio/folio.glb', bytes = glb();
  for (const prefix of ['public', 'dist']) await writeFile(resolve(template, `${prefix}${path}`), bytes);
  assets.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  await writeFile(resolve(template, 'docs/atlas/folio-provenance.json'), JSON.stringify({ assets }));
  await writeFile(resolve(template, 'dist/_astro/ConstellationRuntime.fixture.js'), 'import "./three.fixture.js"; export const load = () => import("./GLTFLoader.fixture.js");');
  await writeFile(resolve(template, 'dist/_astro/three.fixture.js'), 'export const three = true;');
  await writeFile(resolve(template, 'dist/_astro/GLTFLoader.fixture.js'), 'import "./three.fixture.js"; export const loader = true;');
}, 30000);
afterEach(async () => { await Promise.all(temporary.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
afterAll(async () => { await rm(template, { recursive: true, force: true }); });

test('measures static and dynamic children once, including the deferred GLTF loader', async () => {
  const root = await fixture(), report = await verifyAtlasArtBudgets({ root });
  expect(report.assets).toHaveLength(17);
  expect(report.deferredModules).toEqual(['_astro/ConstellationRuntime.fixture.js', '_astro/GLTFLoader.fixture.js', '_astro/three.fixture.js']);
  expect(report.deferredTransferBytes).toBe(report.bootstrapGzipBytes + glb().length);
});
test('accepts a mobile image at the byte boundary and rejects one byte over', async () => {
  const root = await fixture(), original = await readFile(resolve(root, `public${poster}`));
  await replace(root, poster, Buffer.concat([original, Buffer.alloc(ATLAS_ART_LIMITS.mobilePoster - original.length)]));
  await expect(verifyAtlasArtBudgets({ root })).resolves.toBeDefined();
  await replace(root, poster, Buffer.concat([original, Buffer.alloc(ATLAS_ART_LIMITS.mobilePoster + 1 - original.length)]));
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('poster byte budget exceeded');
});
test('rejects incorrect image dimensions even with matching provenance bytes', async () => {
  const root = await fixture();
  await replace(root, poster, await sharp({ create: { width: 799, height: 1000, channels: 3, background: '#3b82f6' } }).webp().toBuffer());
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('incorrect dimensions');
});
test('rejects missing art and records failure in the report', async () => {
  const root = await fixture(); await rm(resolve(root, `dist${poster}`));
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('missing folio artifact files');
  expect(JSON.parse(await readFile(resolve(root, 'docs/atlas/art-budgets.json'), 'utf8')).errors).toHaveLength(1);
});
test('rejects a source/artifact edit that does not match provenance', async () => {
  const root = await fixture(), bytes = Buffer.concat([await readFile(resolve(root, `public${poster}`)), Buffer.from('edited')]);
  for (const prefix of ['public', 'dist']) await writeFile(resolve(root, `${prefix}${poster}`), bytes);
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('provenance hash/bytes mismatch');
});
test('rejects a GLB with external fetch dependencies even with matching provenance', async () => {
  const root = await fixture(); await replace(root, '/art/folio/folio.glb', glb(true));
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('external URI');
});
test('accepts the GLB byte boundary and rejects the next aligned binary chunk size', async () => {
  const root = await fixture();
  for (const extra of [0, 4]) {
    const bytes = padGlbTo(glb(), ATLAS_ART_LIMITS.model + extra);
    await replace(root, '/art/folio/folio.glb', bytes);
    if (extra === 0) await expect(verifyAtlasArtBudgets({ root })).resolves.toBeDefined();
    else await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('model exceeds 700 KiB');
  }
});
test('fails closed when the runtime entry or a deferred child is missing', async () => {
  const root = await fixture(); await rm(resolve(root, 'dist/_astro/GLTFLoader.fixture.js'));
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('Missing deferred JS module');
  await rm(resolve(root, 'dist/_astro/ConstellationRuntime.fixture.js'));
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('Expected one ConstellationRuntime');
});
test('rejects an oversized dynamic child that a static-only closure would omit', async () => {
  const root = await fixture();
  await writeFile(resolve(root, 'dist/_astro/GLTFLoader.fixture.js'), `export const payload = "${randomBytes(300000).toString('hex')}";`);
  await expect(verifyAtlasArtBudgets({ root })).rejects.toThrow('bootstrap exceeds 250 KiB gzip');
});

test('rejects the formerly accepted empty placeholder', () => {
  const placeholder = { asset: { version: '2.0' }, meshes: [{ primitives: [] }], buffers: [{ byteLength: 4 }] };
  expect(() => validateEmbeddedGlb(encodeGlb(placeholder, Buffer.alloc(4)))).toThrow('reachable scene');
});
test('rejects geometry that is present but unreachable from the scene', () => {
  const document = triangleDocument(); Object.assign(document.nodes[0]!, { mesh: undefined });
  expect(() => validateEmbeddedGlb(encodeGlb(document, triangleVertices()))).toThrow('reachable POSITION geometry');
});
test('rejects empty reachable primitives and invalid POSITION accessor shapes', () => {
  const empty = triangleDocument(); empty.meshes[0]!.primitives = [];
  expect(() => validateEmbeddedGlb(encodeGlb(empty, triangleVertices()))).toThrow('must contain primitives');
  const incorrect = triangleDocument(); incorrect.accessors[0]!.componentType = 5123;
  expect(() => validateEmbeddedGlb(encodeGlb(incorrect, triangleVertices()))).toThrow('float VEC3');
});
test('rejects POSITION accessor and bufferView ranges outside embedded bytes', () => {
  const accessor = triangleDocument(); accessor.accessors[0]!.count = 4;
  expect(() => validateEmbeddedGlb(encodeGlb(accessor, triangleVertices()))).toThrow('buffer bounds');
  const view = triangleDocument(); Object.assign(view.bufferViews[0]!, { byteOffset: 4 });
  expect(() => validateEmbeddedGlb(encodeGlb(view, triangleVertices()))).toThrow('buffer bounds');
});
test('rejects zero-extent and nonfinite POSITION geometry', () => {
  expect(() => validateEmbeddedGlb(encodeGlb(triangleDocument(), Buffer.alloc(36)))).toThrow('empty bounds');
  const vertices = triangleVertices(); vertices.writeFloatLE(NaN, 0);
  expect(() => validateEmbeddedGlb(encodeGlb(triangleDocument(), vertices))).toThrow('non-finite');
});
test('rejects a data URI buffer that would replace the validated binary chunk at runtime', () => {
  const document = triangleDocument();
  Object.assign(document.buffers[0]!, { uri: 'data:application/octet-stream;base64,AAAA' });
  expect(() => validateEmbeddedGlb(encodeGlb(document, triangleVertices()))).toThrow('must use its embedded binary chunk');
});

#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'atlas/book/projects.json';
const outputPath = 'public/portfolio-catalog.json';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (field, message) => { throw new Error(`${field}: ${message}`); };
const assert = (condition, field, message) => { if (!condition) fail(field, message); };
const text = (value, field) => assert(typeof value === 'string' && value.trim().length > 0, field, 'expected non-empty text');
const hash = (value, field) => assert(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), field, 'expected SHA-256');
const calendarDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const dimensions = (value, field) => {
  assert(value && Number.isSafeInteger(value.width) && value.width > 0 && Number.isSafeInteger(value.height) && value.height > 0, field, 'expected positive integer width and height');
};
const localized = (value, field) => {
  assert(value && typeof value === 'object', field, 'expected Spanish and English text');
  for (const locale of ['es', 'en']) text(value[locale], `${field}.${locale}`);
};
function httpsUrl(value, field) {
  let url;
  try { url = new URL(value); } catch { fail(field, 'expected absolute HTTPS URL'); }
  assert(typeof value === 'string' && url.protocol === 'https:' && !url.username && !url.password, field, 'expected absolute HTTPS URL without credentials');
  return url;
}

// Read dimensions from the screenshot formats already published by Atlas.
// No decoder, network request or dependency is needed to validate their metadata.
function webpSize(bytes, field) {
  assert(bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', field, 'invalid WebP header');
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  if (kind === 'VP8L') {
    assert(bytes[20] === 0x2f, field, 'invalid lossless WebP header');
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  assert(kind === 'VP8 ' && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a])), field, 'unsupported WebP screenshot');
  return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
}
function avifSize(bytes, field) {
  assert(bytes.length >= 16 && bytes.toString('ascii', 4, 8) === 'ftyp' && bytes.toString('ascii', 8, 12) === 'avif', field, 'invalid AVIF header');
  const sizes = [];
  function boxes(start, end) {
    for (let offset = start; offset < end;) {
      assert(offset + 8 <= end, field, 'truncated AVIF box');
      let size = bytes.readUInt32BE(offset), header = 8;
      const kind = bytes.toString('ascii', offset + 4, offset + 8);
      if (size === 1) {
        assert(offset + 16 <= end, field, 'truncated AVIF extended box');
        size = Number(bytes.readBigUInt64BE(offset + 8)); header = 16;
      } else if (size === 0) size = end - offset;
      assert(Number.isSafeInteger(size) && size >= header && offset + size <= end, field, 'invalid AVIF box size');
      if (kind === 'ispe') {
        assert(size >= header + 12, field, 'truncated AVIF spatial metadata');
        sizes.push({ width: bytes.readUInt32BE(offset + header + 4), height: bytes.readUInt32BE(offset + header + 8) });
      }
      if (['meta', 'iprp', 'ipco'].includes(kind)) boxes(offset + header + (kind === 'meta' ? 4 : 0), offset + size);
      offset += size;
    }
  }
  boxes(0, bytes.length);
  assert(sizes.length === 1, field, 'expected one AVIF screenshot image size');
  return sizes[0];
}

async function validateImage(project, root) {
  const field = `${project.slug}.image`, image = project.media?.[0];
  assert(image?.role === 'screenshot', field, 'first published media must be a screenshot');
  text(image.id, `${field}.id`);
  assert(['owned', 'client-authorized', 'open-license'].includes(image.license), `${field}.license`, 'expected published image rights');
  localized(image.alt, `${field}.alt`);
  localized(image.caption, `${field}.caption`);
  dimensions(image, field);
  assert(image.variants && Object.keys(image.variants).sort().join(',') === 'desktop,mobile', `${field}.variants`, 'expected desktop and mobile variants');
  assert(image.path === image.variants.desktop.avif && image.width === image.variants.desktop.width && image.height === image.variants.desktop.height, field, 'primary image must match the desktop variant');
  const provenance = image.provenance;
  assert(provenance && ['deterministic-reconstruction', 'direct-production-capture', 'local-development-capture'].includes(provenance.kind), `${field}.provenance.kind`, 'expected a documented capture kind');
  for (const key of ['repository', 'sourceUrl']) httpsUrl(provenance[key], `${field}.provenance.${key}`);
  assert(typeof provenance.commit === 'string' && /^[a-f0-9]{40}$/.test(provenance.commit), `${field}.provenance.commit`, 'expected full source revision');
  assert(typeof provenance.capturedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(provenance.capturedAt) && calendarDate(provenance.capturedAt.slice(0, 10)) && Number.isFinite(Date.parse(provenance.capturedAt)), `${field}.provenance.capturedAt`, 'expected capture timestamp');
  assert(calendarDate(provenance.reviewedAt), `${field}.provenance.reviewedAt`, 'expected review date');
  text(provenance.rightsBasis, `${field}.provenance.rightsBasis`);
  if (provenance.approvedBy !== undefined) assert(provenance.approvedBy === 'IzignaMx', `${field}.provenance.approvedBy`, 'unexpected approval identity');
  const publicRoot = await realpath(resolve(root, 'public'));
  for (const viewport of ['desktop', 'mobile']) {
    hash(provenance.sourceSha256?.[viewport], `${field}.provenance.sourceSha256.${viewport}`);
    const variant = image.variants[viewport], variantField = `${field}.variants.${viewport}`;
    dimensions(variant, variantField);
    for (const format of ['avif', 'webp']) {
      const path = variant[format], fileField = `${variantField}.${format}`;
      assert(typeof path === 'string' && new RegExp(`^/media/projects/${project.slug}/evidence/[a-z0-9-]+\\.${format}$`).test(path), fileField, 'expected canonical evidence asset path');
      hash(variant[`${format}Sha256`], `${fileField}Sha256`);
      let resolved;
      try { resolved = await realpath(resolve(publicRoot, `.${path}`)); }
      catch { fail(fileField, `missing published image ${path}`); }
      const local = relative(publicRoot, resolved);
      assert(local !== '..' && !local.startsWith('../') && !isAbsolute(local), fileField, 'asset resolves outside public directory');
      const bytes = await readFile(resolved);
      assert(sha256(bytes) === variant[`${format}Sha256`], fileField, 'published image SHA-256 mismatch');
      const actual = format === 'avif' ? avifSize(bytes, fileField) : webpSize(bytes, fileField);
      assert(actual.width === variant.width && actual.height === variant.height, fileField, `expected ${variant.width}x${variant.height}, received ${actual.width}x${actual.height}`);
    }
  }
  return {
    id: image.id,
    license: image.license,
    alt: image.alt,
    caption: image.caption,
    provenance: image.provenance,
    variants: image.variants,
  };
}

export async function createPortfolioCatalog(root = repositoryRoot) {
  const source = await readFile(resolve(root, sourcePath));
  const catalog = JSON.parse(source);
  assert(Array.isArray(catalog) && catalog.length > 0, sourcePath, 'expected a non-empty project catalog');
  const slugs = new Set(), projects = [];
  for (const project of catalog) {
    assert(typeof project.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) && !slugs.has(project.slug), sourcePath, 'expected unique project slugs');
    slugs.add(project.slug);
    assert(project.publication && (project.publication.publishable === undefined || project.publication.publishable === true) && ['public', 'partial'].includes(project.publication.confidentiality), project.slug, 'project is not approved for publication');
    assert(['real', 'open-source', 'internal', 'concept'].includes(project.classification), `${project.slug}.classification`, 'unknown classification');
    const title = { es: project.es?.title, en: project.en?.title };
    localized(title, `${project.slug}.title`);
    if (project.stage !== undefined) localized(project.stage, `${project.slug}.stage`);
    assert(Array.isArray(project.links), `${project.slug}.links`, 'expected public link inventory');
    const repositories = [], publicUrls = [];
    for (const link of project.links.filter((entry) => entry.public === true)) {
      const url = httpsUrl(link.url, `${project.slug}.links`);
      const urls = url.hostname === 'github.com' ? repositories : publicUrls;
      if (url.hostname === 'github.com') assert(/^\/[^/]+\/[^/]+\/?$/.test(url.pathname) && !url.search && !url.hash, `${project.slug}.links`, 'expected a public GitHub repository URL');
      if (!urls.includes(link.url)) urls.push(link.url);
    }
    projects.push({
      slug: project.slug,
      title,
      classification: project.classification,
      stage: project.stage ?? null,
      bookUrls: {
        es: `https://book.izignamx.com/es/proyectos/${project.slug}/`,
        en: `https://book.izignamx.com/en/projects/${project.slug}/`,
      },
      repositories,
      publicUrls,
      image: await validateImage(project, root),
    });
  }
  return { schemaVersion: 1, source: { repository: 'IzignaMx/capability-book', path: sourcePath, sha256: sha256(source) }, projects };
}

export async function syncPortfolioCatalog({ root = repositoryRoot, check = false } = {}) {
  const catalog = await createPortfolioCatalog(root);
  const generated = `${JSON.stringify(catalog, null, 2)}\n`;
  const target = resolve(root, outputPath);
  if (check) {
    let current;
    try { current = await readFile(target, 'utf8'); } catch { fail(outputPath, 'missing generated catalog; run pnpm sync:portfolio'); }
    assert(current === generated, outputPath, 'stale generated catalog; run pnpm sync:portfolio');
  } else await writeFile(target, generated);
  return catalog;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert(args.every((arg) => arg === '--check') && args.length <= 1, 'arguments', 'usage: node scripts/sync-portfolio-catalog.mjs [--check]');
    const check = args.includes('--check');
    const catalog = await syncPortfolioCatalog({ check });
    console.log(`${check ? 'Verified' : 'Generated'} ${outputPath}: ${catalog.projects.length} projects and ${catalog.projects.length * 4} image variants.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

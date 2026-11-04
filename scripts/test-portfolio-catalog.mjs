import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { syncPortfolioCatalog } from './sync-portfolio-catalog.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = 'atlas/book/projects.json';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'book-portfolio-'));
  try {
    await mkdir(join(root, 'atlas/book'), { recursive: true });
    await mkdir(join(root, 'public'), { recursive: true });
    await copyFile(join(repositoryRoot, sourcePath), join(root, sourcePath));
    const projects = JSON.parse(await readFile(join(root, sourcePath), 'utf8'));
    for (const project of projects) {
      for (const variant of Object.values(project.media[0].variants)) {
        for (const format of ['avif', 'webp']) {
          const relativePath = `public${variant[format]}`;
          await mkdir(dirname(join(root, relativePath)), { recursive: true });
          await copyFile(join(repositoryRoot, relativePath), join(root, relativePath));
        }
      }
    }
    await syncPortfolioCatalog({ root });
    await run(root, projects);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('published catalog checks all current cases without exposing private links as repositories', async () => {
  const catalog = await syncPortfolioCatalog({ check: true });
  assert.equal(catalog.projects.length, 8);
  const internal = catalog.projects.find((project) => project.slug === 'omnisync');
  assert.deepEqual(internal.repositories, []);
  assert.deepEqual(internal.publicUrls, []);
  assert.equal(internal.classification, 'internal');
  assert.equal(internal.image.provenance.kind, 'local-development-capture');
  assert.equal(catalog.projects.find((project) => project.slug === 'nexo').stage.en, 'Playable beta · 1.2');
});

test('check rejects edited output and stale source, then generation repairs the catalog', async () => {
  await fixture(async (root, projects) => {
    const output = join(root, 'public/portfolio-catalog.json');
    await writeFile(output, `${await readFile(output, 'utf8')} `);
    await assert.rejects(syncPortfolioCatalog({ root, check: true }), /stale generated catalog/);
    await syncPortfolioCatalog({ root });
    projects[0].es.title += ' updated';
    await writeFile(join(root, sourcePath), JSON.stringify(projects));
    await assert.rejects(syncPortfolioCatalog({ root, check: true }), /stale generated catalog/);
    await syncPortfolioCatalog({ root });
    await syncPortfolioCatalog({ root, check: true });
  });
});

test('check rejects missing or tampered evidence bytes even when the export is unchanged', async () => {
  await fixture(async (root, projects) => {
    const path = join(root, `public${projects[0].media[0].variants.mobile.webp}`);
    const bytes = await readFile(path);
    const tampered = Buffer.from(bytes); tampered[tampered.length - 1] ^= 1;
    await writeFile(path, tampered);
    await assert.rejects(syncPortfolioCatalog({ root, check: true }), /published image SHA-256 mismatch/);
    await unlink(path);
    await assert.rejects(syncPortfolioCatalog({ root, check: true }), /missing published image/);
  });
});

test('generation rejects inaccurate dimensions, missing alternative text and invalid approval flags', async () => {
  await fixture(async (root, projects) => {
    const update = () => writeFile(join(root, sourcePath), JSON.stringify(projects));
    projects[0].media[0].variants.mobile.width += 1;
    await update();
    await assert.rejects(syncPortfolioCatalog({ root }), /expected 391x844, received 390x844/);
    projects[0].media[0].variants.mobile.width -= 1;
    const originalAlt = projects[0].media[0].alt.en;
    projects[0].media[0].alt.en = '';
    await update();
    await assert.rejects(syncPortfolioCatalog({ root }), /image.alt.en: expected non-empty text/);
    projects[0].media[0].alt.en = originalAlt;
    projects[0].publication.publishable = 'false';
    await update();
    await assert.rejects(syncPortfolioCatalog({ root }), /project is not approved for publication/);
  });
});

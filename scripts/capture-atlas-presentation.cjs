/* Capture the actual static artifact. Outputs stay in ignored audit/, never in project evidence. */
const { chromium } = require('@playwright/test');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4210';
const output = resolve(process.env.ATLAS_PRESENTATION_DIR || 'audit/atlas-presentation');
const projects = JSON.parse(readFileSync('atlas/book/projects.json', 'utf8'));
const report = { base, capturedAt: new Date().toISOString(), release: null, captures: [], checks: [], errors: [] };
const check = (name, passed) => { report.checks.push({ name, passed }); if (!passed) throw Error(name); };
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    report.release = await (await fetch(base + '/release.json')).json();
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => report.errors.push(error.message));
    const ready = async () => {
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('img')]
        .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
        .every(image => image.complete));
    };
    const capture = async (path, name, viewport, selector) => {
      await page.setViewportSize(viewport);
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await ready();
      if (selector) { await page.locator(selector).scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
      check(`${name}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check(`${name}: visible content`, await page.locator('h1').count() === 1);
      const file = name + '.png';
      await page.screenshot({ path: join(output, file) });
      report.captures.push({ file, path, ...viewport, section: selector || 'opening' });
    };
    for (const locale of ['es', 'en']) {
      const section = locale === 'es' ? 'proyectos' : 'projects';
      for (const viewport of [{ width: 1600, height: 1200 }, { width: 390, height: 844 }]) {
        const suffix = viewport.width === 1600 ? 'desktop' : 'mobile';
        for (const project of projects) await capture(`/${locale}/${section}/${project.slug}/`, `${locale}-${project.slug}-${suffix}`, viewport);
        for (const path of ['', section, locale === 'es' ? 'enfoque' : 'approach', locale === 'es' ? 'diagnostico' : 'diagnostic', locale === 'es' ? 'constelacion' : 'constellation']) {
          await capture(`/${locale}/${path}${path ? '/' : ''}`, `${locale}-${path || 'home'}-${suffix}`, viewport);
        }
      }
    }
    for (const viewport of [{ width: 768, height: 1024 }, { width: 320, height: 568 }, { width: 1920, height: 720 }]) {
      for (const path of ['/es/', '/en/projects/', '/es/proyectos/hamburguesa-nomada/'])
        await capture(path, `layout-${path.split('/').filter(Boolean).join('-')}-${viewport.width}`, viewport);
    }
    for (const selector of ['.bk-atlas-selected', '.bk-atlas-disciplines']) {
      await capture('/es/', `home-${selector.slice(1)}`, { width: 1600, height: 1200 }, selector);
    }
    await capture('/es/', 'home-games', { width: 1600, height: 1200 }, '#book-games-title');
    await capture('/en/compare/?projects=omnisync,tecuiyo', 'en-compare', { width: 1600, height: 1200 });
    await capture('/es/proyectos/?layout=list', 'es-index-list-mobile', { width: 390, height: 844 });
    check('No uncaught application errors in capture matrix', report.errors.length === 0);
    await page.close();
    const context = await browser.newContext({ viewport: { width: 1600, height: 1200 },
      recordVideo: { dir: output, size: { width: 1600, height: 1200 } } });
    const film = await context.newPage();
    await film.goto(base + '/es/', { waitUntil: 'networkidle' });
    await film.evaluate(() => document.fonts.ready);
    await film.waitForTimeout(600);
    for (let i = 0; i < 4; i++) { await film.mouse.wheel(0, 300); await film.waitForTimeout(450); }
    await film.goto(base + '/es/proyectos/hamburguesa-nomada/', { waitUntil: 'networkidle' });
    await film.mouse.wheel(0, 650); await film.waitForTimeout(650);
    await film.goto(base + '/es/constelacion/', { waitUntil: 'networkidle' });
    await film.locator('.bk-map-workspace').scrollIntoViewIfNeeded();
    await film.locator('.bk-map-toolbar button').click();
    await film.waitForSelector('canvas[data-ready=true][data-folio=gltf]');
    await film.waitForTimeout(1000);
    const video = film.video();
    await context.close();
    await video.saveAs(join(output, 'book-actual-interface.webm'));
    report.recording = 'book-actual-interface.webm';
  } finally {
    await browser.close();
    writeFileSync(join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Captured ${report.captures.length} views and the actual interface recording in ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });

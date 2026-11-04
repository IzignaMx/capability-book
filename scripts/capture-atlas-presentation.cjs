/* Capture the actual static artifact. Outputs stay in ignored audit/, never in project evidence. */
const { chromium } = require('@playwright/test');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4210';
const output = resolve(process.env.ATLAS_PRESENTATION_DIR || 'audit/atlas-presentation');
const projects = JSON.parse(readFileSync('atlas/book/projects.json', 'utf8'));
const report = { base, capturedAt: new Date().toISOString(), release: null, captures: [], checks: [], errors: [] };
const check = (name, passed) => { report.checks.push({ name, passed }); if (!passed) throw Error(name); };
async function waitForVisibleImages(page, name, timeout = 12000) {
  const inspect = (waitUntilLoaded = false) => {
    const images = [...document.images].map(image => {
      const rect = image.getBoundingClientRect(), style = getComputedStyle(image);
      const visible = rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 &&
        rect.left < innerWidth && rect.right > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      return { src: image.currentSrc || image.getAttribute('src') || '(no image source)', visible,
        failedArt: !!image.closest('.bk-folio-art[hidden]'), complete: image.complete,
        loaded: image.naturalWidth > 0 && image.naturalHeight > 0 };
    });
    if (!waitUntilLoaded) return images;
    const failures = images.filter(image => image.failedArt || (image.complete && !image.loaded));
    if (failures.length) throw Error(`Broken or hidden failed images: ${JSON.stringify(failures)}`);
    return images.filter(image => image.visible).every(image => image.complete && image.loaded);
  };
  try {
    // Run after section scrolling so newly visible lazy images are included.
    await page.waitForFunction(inspect, true, { timeout });
    await page.evaluate(async () => {
      const visible = [...document.images].filter(image => {
        const rect = image.getBoundingClientRect(), style = getComputedStyle(image);
        return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 &&
          rect.left < innerWidth && rect.right > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      for (const image of visible) {
        try { await image.decode(); }
        catch { throw Error(`Image decode failed: ${image.currentSrc || image.src}`); }
        if (!image.naturalWidth || !image.naturalHeight) throw Error(`Image has no natural dimensions: ${image.currentSrc || image.src}`);
      }
    });
  } catch (error) {
    const images = await page.evaluate(inspect).catch(() => []);
    const incomplete = images.filter(image => image.failedArt || (image.complete && !image.loaded) || (image.visible && !image.complete));
    throw Error(`${name} at ${page.url()}: image readiness failed: ${JSON.stringify(incomplete)}; ${error.message}`);
  }
}
async function capturePresentation() {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    report.release = await (await fetch(base + '/release.json')).json();
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => report.errors.push(error.message));
    const ready = async (target, name) => {
      await target.locator('h1').waitFor();
      await target.evaluate(() => document.fonts.ready);
      await waitForVisibleImages(target, name);
    };
    const capture = async (path, name, viewport, selector) => {
      await page.setViewportSize(viewport);
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
      await ready(page, name);
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
    film.on('pageerror', error => report.errors.push(error.message));
    await film.goto(base + '/es/', { waitUntil: 'networkidle' });
    await ready(film, 'recording home');
    await film.waitForTimeout(600);
    for (let i = 0; i < 4; i++) { await film.mouse.wheel(0, 300); await ready(film, `recording home scroll ${i + 1}`); await film.waitForTimeout(450); }
    await film.goto(base + '/es/proyectos/hamburguesa-nomada/', { waitUntil: 'networkidle' });
    await film.mouse.wheel(0, 650); await ready(film, 'recording case'); await film.waitForTimeout(650);
    await film.goto(base + '/es/constelacion/', { waitUntil: 'networkidle' });
    await film.locator('.bk-map-workspace').scrollIntoViewIfNeeded();
    await ready(film, 'recording constellation');
    await film.locator('.bk-map-toolbar button').click();
    await film.waitForSelector('canvas[data-ready=true][data-folio=gltf]');
    await film.waitForTimeout(1000);
    const video = film.video();
    await context.close();
    await video.saveAs(join(output, 'book-actual-interface.webm'));
    report.recording = 'book-actual-interface.webm';
    check('No uncaught application errors in recording', report.errors.length === 0);
  } catch (error) {
    if (!report.errors.includes(error.message)) report.errors.push(error.message);
    throw error;
  } finally {
    await browser.close();
    writeFileSync(join(output, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`Captured ${report.captures.length} views and the actual interface recording in ${output}`);
}
module.exports = { waitForVisibleImages };
if (require.main === module) capturePresentation().catch(error => { console.error(error); process.exitCode = 1; });

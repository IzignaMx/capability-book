/* Run against the real built artifact: REVIEW_BASE_URL=http://127.0.0.1:PORT node tests/atlas-map-art.browser.cjs */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4211';
const checks = [];
const check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name, detail || '');
  if (!passed) throw Error(name);
};
(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(12000);
    page.setDefaultNavigationTimeout(20000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.atlasDraws = 0;
      for (const key of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const original = WebGL2RenderingContext.prototype[key];
        WebGL2RenderingContext.prototype[key] = function (...args) { window.atlasDraws++; return original.apply(this, args); };
      }
    });
    let requests = 0;
    const release = [];
    await page.route('**/art/folio/folio.glb', async (route) => {
      requests++;
      await new Promise((resolve) => release.push(resolve));
      try { await route.continue(); } catch { /* Aborted requests are expected after close or preference change. */ }
    });
    await page.goto(base + '/en/constellation/');
    await page.locator('.bk-map-workspace').scrollIntoViewIfNeeded();
    check('Passive atlas makes no model request and has eight real stations', requests === 0 &&
      await page.locator('canvas').count() === 0 && await page.locator('[data-map-project]').count() === 8);
    await page.locator('.bk-map-toolbar button').click();
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.nodeCount === '8');
    await page.waitForTimeout(100);
    check('Delayed model keeps complete static atlas visible', requests === 1 &&
      await page.locator('.bk-map-static').isVisible() && await page.locator('.bk-map-loading').isVisible());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (let i = 0; i < 30 && requests < 2; i++) await page.waitForTimeout(50);
    check('Preference change supersedes the delayed model request', requests === 2);
    release.splice(0).forEach((resolve) => resolve());
    await page.waitForSelector('canvas[data-ready=true][data-folio=gltf]');
    const count = await page.evaluate(() => window.atlasDraws);
    await page.waitForTimeout(200);
    check('Reduced preference produces a real imported folio without idle draws', count > 0 &&
      count === await page.evaluate(() => window.atlasDraws) && await page.locator('.bk-map-controls button').first().isDisabled());
    await page.locator('.bk-map-toolbar button').click();
    const stopped = await page.evaluate(() => window.atlasDraws);
    await page.waitForTimeout(100);
    check('Close releases scene and leaves the static atlas', await page.locator('canvas').count() === 0 &&
      await page.locator('.bk-map-static').isVisible() && stopped === await page.evaluate(() => window.atlasDraws));
    await page.unroute('**/art/folio/folio.glb');
    await page.route('**/art/folio/folio.glb', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.locator('.bk-map-toolbar button').click();
    await page.waitForSelector('.bk-map-help[role=alert]');
    check('Failed model leaves all selection buttons and SVG usable', await page.locator('canvas').count() === 0 &&
      await page.locator('.bk-map-static').isVisible() && await page.locator('.bk-map-projects button').count() === 8);
    await page.locator('.bk-map-projects button').nth(2).click();
    check('Selection survives a failed model', await page.locator('.bk-map-selected h2').textContent() === 'Tecuiyo');
    await page.unroute('**/art/folio/folio.glb');
    await page.locator('.bk-map-toolbar button').click();
    await page.waitForSelector('canvas[data-ready=true][data-folio=gltf]');
    check('Retry loads the genuine GLB and retains selected case', await page.locator('canvas').getAttribute('data-signature-count') === '8' &&
      await page.locator('.bk-map-projects button').nth(2).getAttribute('aria-pressed') === 'true');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(100);
    check('Forced colors releases WebGL and keeps the complete atlas', await page.locator('canvas').count() === 0 &&
      await page.locator('.bk-map-static').isVisible() && await page.locator('.bk-map-toolbar button').isDisabled());
    check('No browser application errors', errors.length === 0, errors);
    await page.close();
    const native = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 720 } });
    await native.goto(base + '/en/constellation/');
    check('No-JS 320px atlas retains all stations and a native case destination', await native.locator('[data-map-project]').count() === 8 &&
      await native.locator('.bk-map-selected a[href]').count() === 1 && await native.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await native.close();
  } catch (error) {
    if (!checks.some((item) => !item.passed)) checks.push({ name: 'Browser lifecycle completed', passed: false, detail: String(error) });
    process.exitCode = 1;
    console.error(error);
  } finally {
    await browser.close();
    fs.writeFileSync('docs/book-art-map-checks.json', JSON.stringify({ base, checks }, null, 2));
  }
})();

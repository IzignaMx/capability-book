/* Consumer checks for the built opening. No rebuilds and no artifact mutation. */
const { chromium } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4211';
const output = process.env.HERO_COMPOSITION_SCREENSHOTS || 'audit/atlas-hero-composition';
const checks = [];
const check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name, detail || '');
};
const top = page => page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
const complete = page => page.waitForFunction(() => document.fonts.status === 'loaded' && document.querySelector('.bk-discovery')?.dataset.atlasMotion);
const geometry = page => page.evaluate(() => {
  const rect = selector => {
    const box = document.querySelector(selector).getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
  };
  return {
    viewport: innerWidth,
    overflow: document.documentElement.scrollWidth - innerWidth,
    identity: rect('.bk-hero-caption'), selector: rect('.bk-hero-selector'), plate: rect('.bk-hero-plate'), capture: rect('.bk-atlas-capture'),
    controlsFit: [...document.querySelectorAll('.bk-hero-selector button')].every(button => {
      const r = button.getBoundingClientRect();
      return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth;
    }),
  };
});
async function assertSelection(page, index, label) {
  const selector = page.locator('.bk-hero-selector button').nth(index);
  await selector.focus();
  await page.keyboard.press('Space');
  const state = await page.evaluate(() => {
    const selected = document.querySelector('.bk-hero-selector button[aria-pressed="true"]');
    const station = document.querySelector('.bk-hero-plate [data-active="true"]');
    const trajectory = document.querySelector('.bk-hero-trajectory');
    const caption = document.querySelector('.bk-hero-caption strong');
    const capture = document.querySelector('.bk-atlas-capture');
    return {
      selectedCount: document.querySelectorAll('.bk-hero-selector button[aria-pressed="true"]').length,
      stationCount: document.querySelectorAll('.bk-hero-plate [data-active="true"]').length,
      selected: selected?.textContent.trim(), label: selected?.getAttribute('aria-label'), focused: document.activeElement === selected,
      slug: station?.dataset.heroStation, signature: trajectory?.dataset.project, title: caption?.textContent,
      href: capture?.getAttribute('href'), image: capture?.querySelector('img').getAttribute('src'),
      liveRegions: document.querySelectorAll('.bk-atlas-evidence [aria-live="polite"]').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  check(label + ' native selection ' + (index + 1), state.selectedCount === 1 && state.stationCount === 1 && state.focused && state.selected === String(index + 1).padStart(2, '0') && state.slug === state.signature && state.href.includes('/' + state.slug + '/') && state.label.endsWith(state.title) && state.image.includes(state.slug) && state.liveRegions === 1 && state.overflow <= 1, state);
}
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(), args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const locale of ['es', 'en']) {
      for (const width of [1440, 768, 390, 320]) {
        const label = `${locale} ${width}`;
        await page.setViewportSize({ width, height: width > 600 ? 960 : 844 });
        await page.goto(`${base}/${locale}/`, { waitUntil: 'networkidle' });
        await complete(page);
        const bounds = await geometry(page);
        check(label + ' native content and controls fit', bounds.overflow <= 1 && bounds.controlsFit && bounds.identity.left >= 0 && bounds.identity.right <= width && bounds.capture.left >= 0 && bounds.capture.right <= width, bounds);
        if (width <= 390) check(label + ' artwork and active project share the opening', bounds.identity.top < (width === 390 ? 650 : 780) && bounds.identity.bottom < (width === 390 ? 720 : 844) && bounds.plate.bottom <= bounds.identity.top && bounds.plate.height <= 200, bounds);
        check(label + ' original eight station plate is complete', await page.locator('.bk-hero-plate [data-hero-station]').count() === 8 && await page.locator('.bk-hero-trajectory path').count() === 3 && await page.locator('.bk-reading-folio img[loading=eager]').count() === 1);
        await page.screenshot({ path: join(output, `${locale}-${width}-opening.png`) });
        if (width === 390) {
          for (let index = 0; index < 8; index++) await assertSelection(page, index, label);
          await page.waitForFunction(() => document.querySelector('.bk-hero-plate').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished'));
          check(label + ' selection drawing finishes', await page.locator('.bk-hero-plate').evaluate(element => element.getAnimations({ subtree: true }).every(animation => animation.playState !== 'running')));
          await top(page);
          check(label + ' selected composition retains viewport bounds', (await geometry(page)).overflow <= 1);
          await page.screenshot({ path: join(output, `${locale}-${width}-selected.png`) });
        }
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/es/', { waitUntil: 'networkidle' });
    await complete(page);
    await assertSelection(page, 1, 'reduced motion');
    check('reduced motion has no drawing animation', await page.locator('.bk-hero-trajectory path').evaluateAll(paths => paths.every(path => getComputedStyle(path).animationName === 'none')));
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(base + '/es/', { waitUntil: 'networkidle' });
    await complete(page);
    await assertSelection(page, 7, 'forced colors');
    check('forced colors keeps visible project evidence and vector identity', await page.locator('.bk-atlas-capture').isVisible() && await page.locator('.bk-hero-trajectory').isVisible());
    await page.screenshot({ path: join(output, 'forced-colors.png') });
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    await page.route('**/art/folio/*', route => route.abort());
    await page.goto(base + '/es/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => [...document.querySelectorAll('.bk-hero-plate picture')].every(picture => picture.hidden));
    await assertSelection(page, 4, 'failed sculpture');
    check('failed sculpture leaves complete evidence and useful vector plate', await page.locator('.bk-atlas-capture img').evaluate(image => image.complete && image.naturalWidth > 0) && await page.locator('.bk-hero-trajectory').isVisible() && (await geometry(page)).overflow <= 1);
    const native = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await native.goto(base + '/es/', { waitUntil: 'networkidle' });
    check('no JS prerenders original case and real evidence', await native.locator('.bk-hero-caption strong').textContent() === 'OmniSync' && (await native.locator('.bk-atlas-capture').getAttribute('href')).endsWith('/omnisync/') && await native.locator('.bk-atlas-capture img').evaluate(image => image.complete && image.naturalWidth > 0));
    check('no JS exposes a complete, unanimated registered composition', await native.locator('.bk-hero-plate [data-hero-station]').count() === 8 && await native.locator('.bk-hero-trajectory path').evaluateAll(paths => paths.every(path => getComputedStyle(path).animationName === 'none' && getComputedStyle(path).visibility === 'visible')) && (await geometry(native)).identity.top < 650);
    await native.screenshot({ path: join(output, 'native-390.png') });
    check('no hydration or browser errors', errors.length === 0, errors);
  } finally {
    writeFileSync(join(output, 'checks.json'), JSON.stringify(checks, null, 2) + '\n');
    await browser.close();
  }
  if (checks.some(result => !result.passed)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });

/* Run against the completed static artifact with REVIEW_BASE_URL. This checks real
   request scheduling and native no-JS rendering, including a pixel failure oracle. */
const { chromium } = require('@playwright/test');
const sharp = require('sharp');
const { writeFileSync } = require('node:fs');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4211';
const checks = [];
const artRequest = url => /\/art\/folio\/[^/]+\.(avif|webp)$/.test(url);
const check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name, detail || '');
  if (!passed) throw Error(name);
};
const readArt = page => page.locator('.bk-folio-art').evaluateAll(elements => elements.map(element => {
  const image = element.querySelector('img');
  const selected = [...element.querySelectorAll('source')].find(source => !source.media || matchMedia(source.media).matches);
  return { phase: element.dataset.folioPhase, background: getComputedStyle(element).backgroundImage,
    visibility: getComputedStyle(image).visibility, src: image.currentSrc || new URL(selected?.srcset || image.src, location.href).href, width: image.naturalWidth,
    complete: image.complete, loading: image.loading, priority: image.fetchPriority,
    top: element.getBoundingClientRect().top };
}));
const ready = async page => { await page.evaluate(() => document.fonts.ready); };
const crop = async (page, box) => { await page.bringToFront(); return sharp(await page.screenshot()).extract({ left: Math.floor(box.x), top: Math.floor(box.y),
  width: Math.max(1, Math.floor(box.width)), height: Math.max(1, Math.floor(box.height)) }).removeAlpha().raw().toBuffer(); };
(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(), args: ['--no-sandbox'] });
  try {
    for (const width of [1440, 390]) {
      const viewport = { width, height: 960 };
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const requests = [];
      page.on('request', request => { if (artRequest(request.url())) requests.push(request.url()); });
      const priorities = new Map();
      const network = await context.newCDPSession(page);
      await network.send('Network.enable');
      network.on('Network.requestWillBeSent', event => priorities.set(event.request.url, event.request.initialPriority));
      await page.goto(base + '/en/', { waitUntil: 'networkidle' });
      await ready(page);
      const normal = await readArt(page);
      const eager = normal.filter(art => art.priority === 'high');
      check(width + ' default JS retains one high-priority native art request', eager.length === 1 && eager[0].loading === 'eager' &&
        eager[0].width > 0 && priorities.get(eager[0].src) === 'High', { eager, requests });
      check(width + ' no-JS fallback adds no CSS requests in normal JS', normal.every(art => art.background === 'none' && art.visibility === 'visible'));
      const near = new Set(normal.filter(art => art.complete && art.width > 0).map(art => art.src));
      const far = normal.filter(art => art.top > viewport.height && !near.has(art.src));
      check(width + ' unique distant art remains deferred', far.length > 0 && far.every(art => !requests.includes(art.src)), { far, requests });
      await context.close();

      const native = await browser.newContext({ viewport, javaScriptEnabled: false });
      const staticPage = await native.newPage();
      const nativeRequests = [];
      const sizes = new Map();
      staticPage.on('request', request => { if (artRequest(request.url())) nativeRequests.push(request.url()); });
      staticPage.on('response', async response => { if (artRequest(response.url()) && response.ok()) sizes.set(response.url(), (await response.body()).length); });
      await staticPage.goto(base + '/en/', { waitUntil: 'networkidle' });
      await ready(staticPage);
      const art = await readArt(staticPage);
      check(width + ' no-JS successful art uses the same responsive native URL as its background', art[0].complete && art[0].width > 0 && art.every(item =>
        item.visibility === 'hidden' && item.background.includes(item.src)), art);
      check(width + ' no-JS native and CSS requests coalesce to four unique poses', new Set(nativeRequests).size === 4 &&
        nativeRequests.length === 4, { requests: nativeRequests, bytes: [...sizes.values()].reduce((sum, bytes) => sum + bytes, 0) });
      check(width + ' no-JS art uses contain and keeps native reading/actions', await staticPage.locator('.bk-folio-art').evaluateAll(elements =>
        elements.every(element => getComputedStyle(element).backgroundSize === 'contain')) &&
        await staticPage.getByRole('heading', { level: 1 }).isVisible() && await staticPage.locator('.bk-hero-actions a').first().isVisible());
      await native.close();

      // Compare a blocked-art picture to the same static document with just that
      // decorative layer hidden. Native broken icons/borders would change pixels.
      const failure = await browser.newContext({ viewport, javaScriptEnabled: false });
      const broken = await failure.newPage();
      const blank = await failure.newPage();
      for (const target of [broken, blank]) await target.route('**/art/folio/**', route => route.fulfill({ status: 404, body: '' }));
      await blank.route('**/_astro/*.css', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()) + '\n.bk-folio-art{visibility:hidden!important}' });
      });
      await Promise.all([broken.goto(base + '/en/projects/omnisync/', { waitUntil: 'networkidle' }),
        blank.goto(base + '/en/projects/omnisync/', { waitUntil: 'networkidle' })]);
      await Promise.all([ready(broken), ready(blank)]);
      const failed = await readArt(broken);
      const box = await broken.locator('.bk-folio-art').first().boundingBox();
      const actual = await crop(broken, box);
      const expected = await crop(blank, box);
      check(width + ' blocked no-JS art paints no native failure icon or border', failed.every(item => item.complete &&
        item.width === 0 && item.visibility === 'hidden') && actual.equals(expected), { failed, artBox: box, differingPixels: actual.equals(expected) ? 0 : 'nonzero' });
      check(width + ' blocked art retains native heading and evidence action', await broken.getByRole('heading', { level: 1 }).isVisible() &&
        await broken.locator('.bk-case-heading a[href="#evidencia"]').isVisible());
      await broken.bringToFront();
      await broken.screenshot({ path: '/tmp/atlas-native-fallback-' + width + '-blocked.png' });
      await failure.close();

      const layout = [];
      for (const javaScriptEnabled of [true, false]) {
        const approach = await browser.newPage({ viewport, javaScriptEnabled, reducedMotion: 'reduce' });
        await approach.goto(base + '/en/approach/', { waitUntil: 'networkidle' });
        await approach.locator('.bk-art-impact').scrollIntoViewIfNeeded();
        await ready(approach);
        await approach.waitForFunction(() => document.querySelector('.bk-impact-folio img').naturalWidth > 0);
        layout.push(await approach.locator('.bk-art-impact').evaluate(element => {
          const origin = element.getBoundingClientRect();
          return [...element.children].filter(child => child.tagName !== 'NOSCRIPT').map(child => {
            const rect = child.getBoundingClientRect();
            return { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height };
          });
        }));
        await approach.close();
      }
      check(width + ' no-JS marker adds no grid cell or row in Approach', layout[0].length === layout[1].length &&
        layout[0].every((rect, index) => Object.keys(rect).every(key => Math.abs(rect[key] - layout[1][index][key]) < 1)), layout);

    }
  } catch (error) {
    if (!checks.some(check => !check.passed)) checks.push({ name: 'Native artwork checks completed', passed: false, detail: String(error) });
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    writeFileSync('docs/book-art-fallback-checks.json', JSON.stringify({ base, checks }, null, 2));
  }
})();

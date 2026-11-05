/* Inspect the built constellation's immediate project context; no WebGL is activated. */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4384';
const output = process.env.MAP_CONTEXT_OUTPUT || 'audit/atlas-map-context';
const checks = [];
const check = (name, passed, detail) => {
  checks.push({name, passed, detail});
  if (!passed) throw Error(name + ': ' + JSON.stringify(detail));
};
(async () => {
  fs.mkdirSync(output, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(), args: ['--no-sandbox']});
  const errors = [];
  try {
    for (const [locale, route] of [['es', 'constelacion'], ['en', 'constellation']]) {
      for (const width of [1440, 768, 390, 320]) {
        const page = await browser.newPage({viewport:{width,height:960}});
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + '/' + locale + '/' + route + '/', {waitUntil:'networkidle'});
        await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
        const preview = page.locator('.bk-map-context');
        await preview.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.bk-map-context img')?.naturalWidth > 0);
        check(`${locale} ${width}: context has an authentic decoded screenshot and native case link`, await preview.locator('img').evaluate(e => e.naturalWidth > 0 && e.complete) && await preview.locator('a').getAttribute('href') === '/' + locale + '/' + (locale === 'es' ? 'proyectos' : 'projects') + '/omnisync/');
        check(`${locale} ${width}: visible context and 44px native target fit`, await preview.evaluate(e => {
          const rect=e.getBoundingClientRect(), link=e.querySelector('a').getBoundingClientRect();
          return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth && link.width >= 44 && link.height >= 44;
        }) && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        check(`${locale} ${width}: eight manual projects and no automatic WebGL`, await page.locator('.bk-map-projects button').count() === 8 && await page.locator('canvas').count() === 0);
        await page.locator('.bk-map-projects button').nth(2).click();
        await page.waitForFunction(() => document.querySelector('.bk-map-context')?.dataset.project === 'tecuiyo');
        check(`${locale} ${width}: selection updates preview, signature and expanded case together`, await preview.locator('.bk-map-context-title').textContent() === 'Tecuiyo' && await preview.locator('svg[data-project]').getAttribute('data-project') === 'tecuiyo' && await page.locator('.bk-map-selected h2').textContent() === 'Tecuiyo' && (await preview.locator('a').getAttribute('href')).endsWith('/tecuiyo/'));
        check(`${locale} ${width}: project selection is announced once`, await page.locator('[aria-live="polite"]').count() === 1 && await preview.locator('[aria-live="polite"]').getAttribute('aria-atomic') === 'true');
        await preview.evaluate(e => e.scrollIntoView({block:'center'}));
        await page.screenshot({path:output+`/map-context-${locale}-${width}.png`});
        await page.close();
      }
    }
    for (const [width, height] of [[390,844],[320,568]]) {
      const page = await browser.newPage({viewport:{width,height}});
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base+'/es/constelacion/',{waitUntil:'networkidle'});
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      await page.locator('.bk-map-context').evaluate(e => window.scrollBy(0,e.getBoundingClientRect().top-84));
      check(`${width}x${height}: preview and all eight native selectors form a compact reading block`, await page.evaluate(() => {
        const preview=document.querySelector('.bk-map-context').getBoundingClientRect();
        const list=document.querySelector('.bk-map-projects').getBoundingClientRect();
        return list.bottom-preview.top<=500 && [...document.querySelectorAll('.bk-map-projects button')].every(e=>e.getBoundingClientRect().height>=44);
      }));
      await page.locator('.bk-map-projects button').nth(7).click();
      await page.waitForFunction(() => {
        const image=document.querySelector('.bk-map-context img');
        return image?.complete && image.naturalWidth>0 && image.currentSrc.includes('/nexo/');
      });
      await page.locator('.bk-map-context img').evaluate(async image => {
        await image.decode();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      check(`${width}x${height}: eighth selection leaves its preview and native case link in view`, await page.locator('.bk-map-context').evaluate(e => {
        const title=e.querySelector('.bk-map-context-title').getBoundingClientRect();
        const link=e.querySelector('a').getBoundingClientRect();
        return e.dataset.project==='nexo' && title.top>=68 && title.bottom<=innerHeight && link.top>=68 && link.bottom<=innerHeight;
      }));
      await page.screenshot({path:output+`/map-context-eighth-${width}.png`});
      await page.close();
    }
    const native = await browser.newPage({javaScriptEnabled:false,viewport:{width:320,height:720}});
    await native.goto(base+'/es/constelacion/',{waitUntil:'networkidle'});
    check('Native 320px retains the real preview, complete stations and case destination', await native.locator('.bk-map-context img').count() === 1 && await native.locator('.bk-map-context a[href="/es/proyectos/omnisync/"]').count() === 1 && await native.locator('[data-map-project]').count() === 8 && await native.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await native.close();
    const reduced = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',forcedColors:'active'});
    await reduced.goto(base+'/en/constellation/',{waitUntil:'networkidle'});
    await reduced.locator('.bk-map-projects button').nth(7).click();
    check('Forced colors and reduced motion keep manual case context complete', await reduced.locator('.bk-map-context').getAttribute('data-project') === 'nexo' && await reduced.locator('.bk-map-context a[href="/en/projects/nexo/"]').count() === 1 && await reduced.locator('canvas').count() === 0);
    await reduced.close();
    check('No application errors', errors.length === 0, errors);
  } catch(error) {
    if (!checks.some(item => !item.passed)) checks.push({name:'Map context review completed',passed:false,detail:String(error)});
    console.error(error);
    process.exitCode=1;
  } finally {
    await browser.close();
    fs.writeFileSync(output+'/checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');
    console.log(`${checks.filter(c=>c.passed).length}/${checks.length} map context checks passed`);
  }
})();

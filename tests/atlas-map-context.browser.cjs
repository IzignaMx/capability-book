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
    for (const [width, height] of [320,390].flatMap(width => [568,720,768,844].map(height => [width,height]))) {
      const page = await browser.newPage({viewport:{width,height}});
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.mapContextLastScroll=performance.now();
        addEventListener('scroll',() => { window.mapContextLastScroll=performance.now(); },{passive:true});
      });
      const settled = async () => {
        await page.waitForTimeout(240);
        await page.waitForFunction(() => performance.now()-window.mapContextLastScroll>180);
      };
      await page.goto(base+'/es/constelacion/',{waitUntil:'networkidle'});
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.bk-map-workspace').scrollIntoViewIfNeeded();
      await page.locator('.bk-map-projects button').last().click();
      await page.waitForTimeout(300);
      await page.locator('.bk-map-context img').evaluate(image => image.decode());
      const contextHeight = await page.locator('.bk-map-context').evaluate(e => e.getBoundingClientRect().height);
      check(`${width}x${height}: normal workspace flow retains eighth project context below the header`, await page.locator('.bk-map-context').evaluate(e => {
        const rect=e.getBoundingClientRect(),header=document.querySelector('.bk-header').getBoundingClientRect();
        return e.dataset.project==='nexo' && rect.top>=header.bottom && rect.bottom<=innerHeight;
      }));
      await page.locator('.bk-map-projects button').first().focus();
      for (const [direction,indices] of [['forward',[0,1,2,3,4,5,6,7]],['reverse',[7,6,5,4,3,2,1,0]]]) {
        for (const index of indices) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
          await page.locator('.bk-map-context img').evaluate(image => image.decode());
          check(`${width}x${height}: ${direction} keyboard project ${index+1} retains unobscured focus and context`, await page.evaluate(({index,contextHeight}) => {
            const button=document.querySelectorAll('.bk-map-projects button')[index];
            const rect=button.getBoundingClientRect(),preview=document.querySelector('.bk-map-context').getBoundingClientRect();
            const header=document.querySelector('.bk-header').getBoundingClientRect();
            return document.activeElement===button && button.getAttribute('aria-pressed')==='true' &&
              rect.top>=Math.max(header.bottom,preview.bottom+4) && rect.bottom<=innerHeight &&
              document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)?.closest('button')===button &&
              preview.top>=header.bottom && preview.bottom<=innerHeight && Math.abs(preview.height-contextHeight)<1;
          },{index,contextHeight}));
          if (index !== indices.at(-1)) await page.keyboard.press(direction==='forward'?'Tab':'Shift+Tab');
        }
      }
      if (height===568 || (width===390 && height===844)) {
        // Reproduce the independent native-focus probe from a fresh page state,
        // including the Tab that can leave the inspector before a jump back.
        await page.goto(base+'/es/constelacion/',{waitUntil:'networkidle'});
        await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
        await page.evaluate(() => document.fonts.ready);
        await page.locator('.bk-map-workspace').scrollIntoViewIfNeeded();
        await page.locator('.bk-map-projects button').last().click();
        await settled();
        const reserved = await page.locator('.bk-map-context').evaluate(e => e.getBoundingClientRect().height);
        await page.keyboard.press('Tab');
        await settled();
        for (const index of [0,1,2,3,4,5,6,7,6,5,4,3,2,1,0]) {
          const target=page.locator('.bk-map-projects button').nth(index);
          await target.focus();
          await settled();
          const readFocus = () => page.evaluate(({index,reserved}) => {
            const button=document.querySelectorAll('.bk-map-projects button')[index];
            const rect=button.getBoundingClientRect(),preview=document.querySelector('.bk-map-context').getBoundingClientRect();
            const header=document.querySelector('.bk-header').getBoundingClientRect();
            return {focused:document.activeElement===button,top:rect.top,bottom:rect.bottom,
              belowContext:rect.top>=Math.max(header.bottom,preview.bottom+4),
              withinViewport:rect.bottom<=innerHeight,
              point:document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)?.closest('button')===button,
              stableContext:Math.abs(preview.height-reserved)<1,
              contextVisible:preview.top>=header.bottom && preview.bottom<=innerHeight};
          },{index,reserved});
          const before=await readFocus();
          check(`${width}x${height}: direct focus project ${index+1} is wholly visible before selection`,
            before.focused && before.belowContext && before.withinViewport && before.point && before.stableContext && before.contextVisible,before);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(100);
          await page.locator('.bk-map-context img').evaluate(image => image.decode());
          const after=await readFocus();
          check(`${width}x${height}: direct focus project ${index+1} remains wholly visible after Enter`,
            await target.getAttribute('aria-pressed')==='true' && after.focused && after.belowContext && after.withinViewport && after.point && after.stableContext && after.contextVisible,after);
        }
      }
      await page.screenshot({path:output+`/map-context-keyboard-${width}-${height}.png`});
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

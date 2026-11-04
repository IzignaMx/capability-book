/* Actual static-artifact consumer checks. REVIEW_BASE_URL must point at the same
   completed artifact used by the rest of Atlas browser/a11y verification. */
const {chromium} = require('@playwright/test');
const {mkdirSync, writeFileSync} = require('node:fs');
const {join} = require('node:path');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4211';
const shots = process.env.ATLAS_ART_SCREENSHOTS || '/tmp/book-art-discovery';
const checks = [];
const check = (name, passed, detail) => { checks.push({name, passed, detail}); console.log(passed ? 'PASS' : 'FAIL', name, detail || ''); };
const tick = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const read = surface => surface.evaluate(element => ({
  motion: element.dataset.atlasMotion,
  progress: Number(element.style.getPropertyValue('--atlas-progress')),
  origin: Number(getComputedStyle(element.querySelector('.bk-reading-origin')).opacity),
  destination: Number(getComputedStyle(element.querySelector('.bk-reading-destination')).opacity),
  transform: getComputedStyle(element.querySelector('.bk-reading-destination')).transform,
}));
async function position(page, surface, progress) {
  const target = await surface.evaluate((element, value) => {
    const rect = element.getBoundingClientRect();
    const top = innerHeight - value * (innerHeight + rect.height);
    const desired = element.dataset.atlasProgress === 'entry' ? value * rect.height : scrollY + rect.top - top;
    const target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, desired));
    scrollTo({left:0, top:target, behavior:'instant'});
    return target;
  }, progress);
  await page.waitForFunction(target => Math.abs(scrollY - target) < 1, target);
  await tick(page);
  await page.waitForFunction(element => [...element.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0), await surface.elementHandle());
}
async function resetTop(page) {
  await page.evaluate(() => scrollTo({left:0, top:0, behavior:'instant'}));
  await page.waitForFunction(() => scrollY === 0);
  await tick(page);
}
async function visitCatalogueCaptures(page) {
  for (const image of await page.locator('.bk-archive-grid .bk-card-picture img').all()) {
    await image.evaluate(element => scrollTo({left:0, top:Math.max(0, scrollY + element.getBoundingClientRect().top - 100), behavior:'instant'}));
    await tick(page);
    await page.waitForFunction(image => image.complete && image.naturalWidth > 0, await image.elementHandle());
  }
  await resetTop(page);
}
(async () => {
  mkdirSync(shots, {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(), args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'no-preference'});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:width < 680 ? 844 : 960});
      await page.goto(base+'/es/', {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      const surfaces = page.locator('.bk-discovery [data-atlas-surface]');
      check(width+' local art surfaces and single eager hero art', await surfaces.count() === 4 && await page.locator('.bk-reading-folio img[loading=eager][fetchpriority=high]').count() === 1);
      check(width+' native headline/actions/capture remain in bounds', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('h1,.bk-hero-actions,.bk-atlas-capture')].every(element => {const r=element.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1;})));
      const hero = surfaces.first();
      await position(page, hero, 0);
      await page.waitForFunction(() => [...document.querySelectorAll('.bk-atlas-sculpture img')].every(image => image.complete && image.naturalWidth > 0));
      const before = await read(hero);
      check(width+' hero rests at completed matter on entry', before.progress===0 && before.origin===1 && before.destination===0, before);
      check(width+' poster images stay within their local reading frames',await surfaces.evaluateAll(elements=>elements.every(element=>[...element.querySelectorAll('img')].every(image=>parseFloat(getComputedStyle(image).height)<=element.clientHeight+1))));
      await page.screenshot({path:join(shots,`home-${width}-native-entry.png`)});
      await position(page, hero, .5);
      const after = await read(hero);
      check(width+' visible art advances with native reading', after.motion === 'active' && after.progress > before.progress + .05 && after.destination > before.destination + .1 && after.origin < before.origin && after.transform !== before.transform, {before,after});
      await page.screenshot({path:join(shots,`home-${width}-native-forward.png`)});
      await position(page, hero, 0);
      const reverse = await read(hero);
      check(width+' reverse reading restores the same visible pose', Math.abs(reverse.destination-before.destination)<.02 && Math.abs(reverse.origin-before.origin)<.02, {before,reverse});
      // The next surface remains locally animated while the former hero freezes.
      await position(page, surfaces.nth(1), .72);
      await page.waitForFunction(() => document.querySelector('.bk-atlas-sculpture').dataset.atlasMotion === 'paused');
      const frozen = await hero.getAttribute('style');
      const nextBefore = await read(surfaces.nth(1));
      await position(page, surfaces.nth(1), .78);
      const nextAfter = await read(surfaces.nth(1));
      check(width+' offscreen hero freezes while the current section evolves', await hero.getAttribute('style') === frozen && nextAfter.destination > nextBefore.destination, {nextBefore,nextAfter});
      await page.screenshot({path:join(shots,`selected-${width}-native.png`)});
      for (let index=2;index<4;index++) {
        const surface=surfaces.nth(index);
        await position(page,surface,.48); const entry=await read(surface);
        await position(page,surface,.72); const settled=await read(surface);
        check(width+' section '+index+' evolves while visible', settled.motion==='active' && settled.destination>entry.destination+.1, {entry,settled});
        await page.screenshot({path:join(shots,`section-${index}-${width}-native.png`)});
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      await resetTop(page);
      check(width+' reduced motion immediately shows complete static poses', await surfaces.evaluateAll(elements => elements.every(element => element.dataset.atlasMotion==='static' && getComputedStyle(element.querySelector('.bk-reading-origin')).opacity===(element.dataset.staticPose==='destination'?'0':'1') && getComputedStyle(element.querySelector('.bk-reading-destination')).opacity===(element.dataset.staticPose==='destination'?'1':'0'))));
      await page.screenshot({path:join(shots,`home-${width}-reduced.png`)});
      await page.emulateMedia({reducedMotion:'no-preference'});
      await resetTop(page);
      const previousTitle = await page.locator('.bk-hero-caption strong').textContent();
      await page.locator('.bk-hero-selector button').nth(1).focus();
      await page.keyboard.press('Enter');
      check(width+' focused manual selector aligns capture/title/signature', previousTitle !== await page.locator('.bk-hero-caption strong').textContent() && (await page.locator('.bk-evidence-deck').getAttribute('href')).includes('hamburguesa-nomada') && await page.locator('.bk-atlas-evidence-register .bk-trajectory-mark').getAttribute('data-project') === 'hamburguesa-nomada');
      await page.goto(base+'/es/proyectos/',{waitUntil:'networkidle'});
      check(width+' archive retains all eight cases',await page.locator('.bk-archive-grid article').count()===8);
      await visitCatalogueCaptures(page);
      check(width+' every real catalogue capture decodes when reached',await page.locator('.bk-archive-grid .bk-card-picture img').evaluateAll(images=>images.length===8&&images.every(image=>image.complete&&image.naturalWidth>0)));
      await page.screenshot({path:join(shots,`archive-${width}-gallery.png`),fullPage:true});
      await page.locator('input[type=search]').fill('nutricion');
      check(width+' archive search retained',await page.locator('.bk-archive-grid article').count()===1);
      await page.locator('input[type=search]').fill('');
      await page.getByRole('button',{name:'Ver lista',exact:true}).click();
      check(width+' list retains compare actions and fits viewport',await page.locator('.bk-archive-grid').getAttribute('data-layout')==='list' && await page.locator('.bk-archive-grid .bk-card-actions button').count()===8 && await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:join(shots,`archive-${width}-list.png`),fullPage:true});
    }
    // Both hero poses fail: the tablet evidence takes the full remaining column.
    await page.setViewportSize({width:768,height:960});
    await page.route('**/art/folio/*',route=>route.abort());
    await page.goto(base+'/es/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>[...document.querySelectorAll('.bk-atlas-sculpture picture')].every(picture=>picture.hidden));
    check('failed tablet art leaves a single full evidence column',await page.locator('.bk-atlas-showcase').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length===1) && await page.locator('.bk-evidence-deck img').evaluate(image=>image.complete&&image.naturalWidth>0));
    await page.screenshot({path:join(shots,'home-768-failed-art.png')});
    const nojs = await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await nojs.goto(base+'/es/',{waitUntil:'networkidle'});
    check('no-JS home has complete static origin and direct actions',await nojs.locator('.bk-hero-explore').count()===1 && await nojs.locator('.bk-reading-folio').first().evaluate(element=>getComputedStyle(element.querySelector('.bk-reading-origin')).opacity==='1'&&getComputedStyle(element.querySelector('.bk-reading-destination')).opacity==='0'));
    check('no-JS discipline completes the constellation phase',await nojs.locator('.bk-atlas-discipline-art').evaluate(element=>element.dataset.readingStatic==='constellation' && getComputedStyle(element.querySelector('.bk-reading-origin')).opacity==='0' && getComputedStyle(element.querySelector('.bk-reading-destination')).opacity==='1'));
    await nojs.goto(base+'/es/proyectos/',{waitUntil:'networkidle'});
    check('no-JS catalog retains all eight cases',await nojs.locator('.bk-archive-grid article').count()===8);
    await nojs.close();
    check('no uncaught consumer errors',errors.length===0,errors);
    await page.close();
  } catch (error) { check('consumer artifact review completed',false,String(error.stack || error)); }
  finally { await browser.close(); writeFileSync('docs/book-art-discovery-checks.json',JSON.stringify({environment:'Actual static Atlas artifact. Chromium emulated viewports. No external messages or WebGL started.',screenshots:shots,checks},null,2)); }
  if(checks.some(item=>!item.passed))process.exitCode=1;
})();

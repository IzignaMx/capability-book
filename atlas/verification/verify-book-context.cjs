const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4180';
const checks = [];
function check(name, passed, detail) { checks.push({ name, passed, detail }); console.log(passed ? 'PASS' : 'FAIL', name, detail || ''); }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath(), args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const root = await page.request.get(base+'/', {maxRedirects:0});
    await page.goto(base+'/', {waitUntil:'networkidle'});
    await page.waitForURL(base+'/es/');
    check('Static root gateway reaches Spanish and retains an HTML fallback', root.status()===200 && (await root.text()).includes('/en/') && page.url()===base+'/es/');
    for (const locale of ['es', 'en']) {
      const section = locale === 'es' ? 'comparar' : 'compare';
      const other = locale === 'es' ? 'en' : 'es';
      await page.goto(`${base}/${locale}/${section}/?projects=omnisync,vald&email=private@example.com`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelectorAll('.bk-compare-columns article').length === 2);
      let href = await page.locator('.bk-language').getAttribute('href');
      check(`${locale} locale switch preserves references only`, href.startsWith(`/${other}/`) && new URL(href, base).searchParams.get('projects') === 'omnisync,vald' && !href.includes('email'));
      await page.locator('.bk-compare-picker label').filter({ hasText: 'Tecuiyo' }).locator('input').check();
      await page.waitForFunction(() => document.querySelector('.bk-language').getAttribute('href').includes('tecuiyo'));
      check(`${locale} current comparison updates language link`, (await page.locator('.bk-language').getAttribute('href')).includes('tecuiyo'));
      await page.locator('.bk-language').click();
      await page.waitForFunction(() => document.querySelectorAll('.bk-compare-columns article').length === 3);
      check(`${locale} changing locale retains all three visible cases`, await page.locator('.bk-compare-columns article').count() === 3);
      const contact = locale === 'es' ? 'diagnostico' : 'diagnostic';
      await page.goto(`${base}/${locale}/${contact}/?project=omnisync&email=should-not-travel`, { waitUntil: 'networkidle' });
      await page.locator('#book-name').fill('Private Example');
      await page.locator('#book-email').fill('private@example.com');
      await page.locator('#book-details').fill('Confidential context not for the URL');
      href = await page.locator('.bk-language').getAttribute('href');
      check(`${locale} contact references survive legacy project parameter`, new URL(href, base).searchParams.get('projects') === 'omnisync');
      check(`${locale} entered contact fields never reach URL or language link`, ![page.url(), href].some(value => /private|email|Confidential/i.test(value)));
    }
    await page.goto(`${base}/es/proyectos/?q=omnisync&category=commerce&layout=list`, { waitUntil: 'networkidle' });
    check('Archive restores layout and search', await page.locator('.bk-archive-grid').getAttribute('data-layout') === 'list' && await page.locator('.bk-archive-grid article').count() === 1);
    await page.locator('.bk-language').click();
    await page.waitForSelector('.bk-archive-grid[data-layout=list]');
    check('Archive language change preserves search, filter and layout', (await page.locator('input[type=search]').inputValue()) === 'omnisync' && await page.locator('.bk-filters button[aria-pressed=true]').textContent().then(text => text.includes('Commerce')));
    await page.goto(`${base}/es/comparar/?projects=omnisync,vald`, { waitUntil: 'networkidle' });
    const chosen = page.locator('.bk-compare-picker input:checked');
    while (await chosen.count()) await chosen.first().uncheck();
    await page.waitForFunction(() => !document.querySelector('.bk-language').getAttribute('href').includes('?'));
    check('Clearing selection removes stale URL references', !page.url().includes('projects=') && !(await page.locator('.bk-language').getAttribute('href')).includes('?'));
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`${base}/es/`, { waitUntil: 'networkidle' });
    await page.locator('.bk-mobile summary').click();
    await page.locator('.bk-mobile nav a').last().focus(); await page.keyboard.press('Tab');
    check('Keyboard leaving mobile menu closes it', await page.locator('.bk-mobile').evaluate(element => !element.open));
    const nojs=await browser.newPage({javaScriptEnabled:false});
    for(const locale of ['es','en']){
      await nojs.goto(base+'/'+locale+'/'+(locale==='es'?'diagnostico':'diagnostic')+'/',{waitUntil:'networkidle'});
      check(locale+' no-JS form cannot submit named personal fields',await nojs.locator('.bk-brief-form button[type=submit]:enabled').count()===0&&await nojs.locator('.bk-brief-form [name]:enabled').count()===0);
      check(locale+' no-JS visitor retains direct contact alternatives',await nojs.locator('a[href="mailto:hola@izignamx.com"]').count()>0&&await nojs.locator('a[href="https://wa.me/525533760889"]').count()>0);
    }
    await nojs.close();
    check('No browser exceptions in context journeys', errors.length === 0, errors);
  } catch (error) { check('Context verification completed', false, String(error)); }
  finally { await browser.close(); fs.writeFileSync('docs/book-context-checks.json', JSON.stringify({ environment: 'Static Pages artifact, Chromium. No messages sent.', checks }, null, 2)); }
  if (checks.some(check => !check.passed)) process.exitCode = 1;
})();

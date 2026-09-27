const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const data=require('../book/projects.json');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4203';
const checks=[];const check=(name,passed,detail)=>{checks.push({name,passed,detail});console.log(passed?'PASS':'FAIL',name,detail?JSON.stringify(detail):'')};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const l of ['es','en']){
   const prefix=l==='es'?'proyectos':'projects';
   for(const project of data){
    await p.goto(`${base}/${l}/${prefix}/${project.slug}/`,{waitUntil:'networkidle'});
    const study=p.locator('.bk-decision-study');
    check(`${l} ${project.slug} study uses the recorded challenge`,(await study.locator('details[open] p').textContent())===project[l].challenge);
    for(const [i,key] of [[1,'strategy'],[2,'solution']]){
     await study.locator('summary').nth(i).click();
     await p.waitForFunction(i=>document.querySelector('.bk-decision-figure').dataset.phase===String(i),i);
     check(`${l} ${project.slug} ${key} updates the study`,(await study.locator('details[open] p').textContent())===project[l][key]&&await study.locator('details[open]').count()===1&&await study.locator('.bk-study-trace.is-active').count()===1);
    }
    const links=await p.locator('.bk-related-compare').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')));
    check(`${l} ${project.slug} related comparison preserves genuine references`,links.length===2&&links.every(h=>{const ids=new URL(h,locationBase()).searchParams.get('projects').split(',');return ids[0]===project.slug&&ids.length===2&&ids[1]!==project.slug&&data.some(x=>x.slug===ids[1])}));
   }
   await p.goto(`${base}/${l}/${prefix}/omnisync/`,{waitUntil:'networkidle'});
   await p.locator('.bk-reading-desktop a[href="#chapter-3"]').click();
   await p.waitForTimeout(300);
   const position=await p.locator('#chapter-3').evaluate(el=>el.getBoundingClientRect().top);
   check(`${l} heading lands below header without excessive offset`,position>=80&&position<=170,{position});
   check(`${l} reading index follows the clicked chapter`,await p.locator('.bk-reading-desktop a[href="#chapter-3"]').getAttribute('aria-current')==='location');
   await p.evaluate(()=>{const el=document.querySelector('#chapter-6');scrollTo(0,scrollY+el.getBoundingClientRect().top-130)});await p.waitForTimeout(200);
   check(`${l} manual scroll updates the reading index`,await p.locator('.bk-reading-desktop a[href="#chapter-6"]').getAttribute('aria-current')==='location');
   const original=await p.locator('.bk-capture-original').getAttribute('href');const response=await p.request.get(base+original);
   check(`${l} original capture is a real image link`,response.status()===200&&(response.headers()['content-type']||'').includes('image/'));
   await p.locator('.bk-case-toolbar>button').click();
   await p.locator('.bk-lightbox-options button').nth(1).click();
   const native=await p.locator('.bk-image-pan').evaluate(el=>{const img=el.querySelector('img');return {width:img.getBoundingClientRect().width,natural:img.naturalWidth,scroll:el.scrollWidth,client:el.clientWidth}});
   check(`${l} original-size viewer preserves image pixels and pans`,native.width===native.natural&&native.scroll>native.client,native);
   await p.locator('.bk-lightbox-options button').first().click();
   const fitted=await p.locator('.bk-image-pan').evaluate(el=>el.querySelector('img').getBoundingClientRect().width<=el.clientWidth+1);
   check(`${l} fit mode removes horizontal overflow`,fitted);
   await p.keyboard.press('Escape');
   check(`${l} modal Escape restores focus to invoking control`,await p.locator('.bk-case-toolbar>button').evaluate(el=>el===document.activeElement));
  }
  for(const width of [320,390,600,768,1024,1440,1920])for(const l of ['es','en']){
   await p.setViewportSize({width,height:850});await p.goto(`${base}/${l}/${l==='es'?'proyectos':'projects'}/omnisync/`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
   const out=await p.evaluate(()=>[...document.querySelectorAll('.bk-decision-study h2,.bk-decision-study summary,.bk-decision-study p,.bk-reading-navigation,.bk-related-grid h3')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1}).map(e=>e.className||e.tagName));
   check(`${l} ${width}px case composition fits`,out.length===0&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),out);
   const small=await p.locator('.bk-decision-study summary').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().height<44).length);
   check(`${l} ${width}px study controls have 44px targets`,small===0);
  }
  await p.setViewportSize({width:390,height:844});await p.goto(base+'/es/proyectos/omnisync/',{waitUntil:'networkidle'});
  await p.locator('.bk-reading-mobile summary').click();await p.locator('.bk-reading-mobile a[href="#chapter-4"]').click();await p.waitForTimeout(250);
  check('Mobile index closes and moves focus to the destination',await p.locator('.bk-reading-mobile').evaluate(el=>!el.open)&&await p.locator('#chapter-4 h2').evaluate(el=>el===document.activeElement));
  await p.locator('.bk-case-toolbar>button').click();await p.locator('.bk-lightbox-options button').nth(1).click();await p.locator('.bk-image-pan').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
  check('Native capture can be explored by keyboard in mobile viewport',await p.locator('.bk-image-pan').evaluate(el=>el.scrollLeft>0));await p.keyboard.press('Escape');
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await nojs.goto(base+'/es/proyectos/omnisync/');await nojs.locator('.bk-decision-steps summary').nth(1).click();
  check('No-JS decision disclosure still opens the documented strategy',await nojs.locator('.bk-decision-steps details').nth(1).evaluate(el=>el.open));
  check('No-JS original evidence remains directly accessible',await nojs.locator('.bk-capture-original').getAttribute('href')===data[0].media[0].variants.desktop.webp);
  await nojs.close();check('No runtime exceptions in the new case journeys',errors.length===0,errors);
  await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/es/proyectos/omnisync/',{waitUntil:'networkidle'});await p.locator('.bk-decision-study').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/book-polish-decision-desktop.png'});
  await p.setViewportSize({width:390,height:844});await p.locator('.bk-decision-study').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/book-polish-decision-mobile.png'});
 }catch(e){check('Case polish review completed',false,String(e));}
 finally{await browser.close();fs.writeFileSync('docs/book-case-polish-checks.json',JSON.stringify({environment:'Static Pages artifact, Chromium. No external messages sent.',checks},null,2));}
 if(checks.some(x=>!x.passed))process.exitCode=1;
})();
function locationBase(){return base;}

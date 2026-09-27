const {chromium}=require('@playwright/test');const fs=require('node:fs');const data=require('../book/projects.json');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4205',checks=[];
const check=(name,passed,detail)=>{checks.push({name,passed,detail});console.log(passed?'PASS':'FAIL',name,JSON.stringify(detail??''));};
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox']});
try{const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const l of ['es','en'])for(const project of data){
 const route=`/${l}/${l==='es'?'proyectos':'projects'}/${project.slug}/`;await p.goto(base+route,{waitUntil:'networkidle'});
 const peers=await p.locator('.bk-related-grid article').evaluateAll(ns=>ns.map(n=>n.dataset.slug));
 check(l+' '+project.slug+' two genuine peer cases',peers.length===2&&new Set(peers).size===2&&peers.every(s=>s!==project.slug&&data.some(d=>d.slug===s)),peers);
 const comparisons=await p.locator('.bk-related-compare').evaluateAll(ns=>ns.map(n=>new URL(n.href).searchParams.get('projects')));
 check(l+' '+project.slug+' compare links preserve pair',comparisons.every((s,i)=>s===project.slug+','+peers[i]));
 check(l+' '+project.slug+' original image accessible',await p.locator('.bk-capture-original').getAttribute('href')===project.media[0].variants.desktop.webp);
 const links=p.locator('.bk-reading-desktop a');check(l+' '+project.slug+' full chapter index',await links.count()===project[l].chapters.length+1);
 await links.nth(2).click();await p.waitForFunction(()=>document.activeElement===document.querySelector('#chapter-2 h2'));check(l+' '+project.slug+' chapter focus and active location',await links.nth(2).getAttribute('aria-current')==='location');
 const steps=p.locator('.bk-decision-steps details');for(let i=0;i<3;i++){await steps.nth(i).locator('summary').click();check(l+' '+project.slug+' decision '+i+' displays original text',await steps.nth(i).evaluate(e=>e.open)&&await p.locator('.bk-decision-figure').getAttribute('data-phase')===String(i)&&(await steps.nth(i).innerText()).includes(project[l][['challenge','strategy','solution'][i]]));}
}
for(const l of ['es','en'])for(const width of [390,1440]){
 await p.setViewportSize({width,height:900});await p.goto(base+`/${l}/${l==='es'?'proyectos':'projects'}/omnisync/`,{waitUntil:'networkidle'});
 const trigger=p.locator('.bk-case-toolbar>button');await trigger.click();const modal=p.locator('dialog'),img=modal.locator('.bk-lightbox-stage img');await img.waitFor({state:'visible'});const fitted=await img.boundingBox();await modal.locator('.bk-lightbox-options button').nth(1).click();
 const measure=await img.evaluate(e=>({width:e.getBoundingClientRect().width,natural:e.naturalWidth}));
 check(l+' '+width+' native size is genuine',measure.width===measure.natural&&measure.width>fitted.width,measure);
 check(l+' '+width+' native canvas scrolls inside dialog',await modal.locator('.bk-lightbox-stage').evaluate(e=>e.scrollWidth>e.clientWidth&&e.getBoundingClientRect().right<=innerWidth+1));
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog').open&&document.querySelector('dialog').dataset.native==='false'&&document.activeElement===document.querySelector('.bk-case-toolbar>button'));check(l+' '+width+' modal reset and focus return',await modal.getAttribute('data-native')==='false'&&await trigger.evaluate(e=>e===document.activeElement));
 if(width===390){const toc=p.locator('.bk-reading-mobile');await toc.locator('summary').click();await toc.locator('a').nth(1).click();await p.waitForFunction(()=>document.activeElement===document.querySelector('#chapter-1 h2'));check(l+' mobile contents close and focus heading',!(await toc.evaluate(e=>e.open)));}
}
for(const width of [320,390,768,1024,1440,1920])for(const l of ['es','en']){
 await p.setViewportSize({width,height:900});await p.goto(base+`/${l}/${l==='es'?'proyectos':'projects'}/hamburguesa-nomada/`,{waitUntil:'networkidle'});
 const out=await p.evaluate(()=>[...document.querySelectorAll('h1,h2,h3,.bk-decision-figure,.bk-reading-mobile,.bk-related-compare')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>e.className||e.tagName));
 check(l+' '+width+' reading and related layouts fit',!out.length&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),out);
}
await p.setViewportSize({width:1440,height:960});await p.goto(base+'/es/proyectos/omnisync/');await p.locator('.bk-related-compare').first().click();await p.waitForSelector('.bk-compare-columns article');check('Related comparison opens exactly two cases',await p.locator('.bk-compare-columns article').count()===2);
const nojs=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base+'/es/proyectos/omnisync/');check('No-JS original capture remains linked',(await nojs.locator('.bk-capture-original').getAttribute('href')).endsWith('home-desktop.webp'));await nojs.locator('.bk-reading-mobile summary').click();check('No-JS native contents opens',await nojs.locator('.bk-reading-mobile').evaluate(e=>e.open)&&await nojs.locator('.bk-reading-mobile a:visible').count()>5);await nojs.locator('.bk-decision-steps summary').nth(2).click();check('No-JS decision text remains inspectable',await nojs.locator('.bk-decision-steps details').nth(2).evaluate(e=>e.open));await nojs.close();
await p.setViewportSize({width:1440,height:960});await p.goto(base+'/es/proyectos/hamburguesa-nomada/');await p.locator('.bk-decision-study').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/atlas-case-study-desktop.png'});await p.setViewportSize({width:390,height:844});await p.goto(base+'/es/proyectos/hamburguesa-nomada/');await p.locator('.bk-reading-mobile summary').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/atlas-case-reading-mobile.png'});check('No case application exceptions',errors.length===0,errors);
}catch(e){check('Reading review completes',false,String(e));}finally{await b.close();fs.writeFileSync('docs/book-reading-checks.json',JSON.stringify({timestamp:new Date().toISOString(),scope:'Static Book Atlas artifact, Chromium, emulated sizes. Separate from the unshipped Astro prototype. No messages sent.',checks},null,2));}if(checks.some(c=>!c.passed))process.exitCode=1;
})();

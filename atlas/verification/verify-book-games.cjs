const{chromium}=require('@playwright/test');const fs=require('node:fs'),crypto=require('node:crypto');
const data=require('../book/projects.json'),brand=require('../../docs/atlas/brand-audit.json');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4210';const checks=[];const check=(name,passed,detail)=>{checks.push({name,passed,detail});console.log(passed?'PASS':'FAIL',name,JSON.stringify(detail||''));};
(async()=>{const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
try{const p=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));const requested=[];p.on('request',r=>requested.push(r.url()));
for(const l of ['es','en']){
 await p.goto(base+'/'+l+'/',{waitUntil:'networkidle'});check(l+' homepage exposes two playable cases',await p.locator('.bk-game-shelf article').count()===2&&await p.locator('.bk-game-shelf .bk-play-link').count()===2);
 for(const slug of ['distrito-cero','nexo']){const project=data.find(q=>q.slug===slug);await p.locator('.bk-hero-selector button').nth(data.indexOf(project)).click();check(l+' '+slug+' selectable in hero',(await p.locator('.bk-evidence-deck').getAttribute('href')).includes('/'+slug+'/'));}
 await p.goto(base+'/'+l+'/'+(l==='es'?'proyectos':'projects')+'/?category=games',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelectorAll('.bk-archive-grid article').length===2);check(l+' games filter preserves both identities',JSON.stringify(await p.locator('.bk-archive-grid article').evaluateAll(es=>es.map(e=>e.dataset.slug)))===JSON.stringify(['distrito-cero','nexo']));
 for(const slug of ['distrito-cero','nexo']){await p.goto(base+'/'+l+'/'+(l==='es'?'proyectos':'projects')+'/'+slug+'/',{waitUntil:'networkidle'});const project=data.find(q=>q.slug===slug);check(l+' '+slug+' direct game link is not embedded',await p.locator('.bk-play-link').getAttribute('href')===project.sources.find(s=>s.id==='live').url&&await p.locator('iframe').count()===0);check(l+' '+slug+' honest release stage',(await p.locator('.bk-case-facts').innerText()).includes(project.stage[l]));
 for(const[device,i]of [['desktop',0],['mobile',1]]){await p.locator('.bk-case-toolbar>div button').nth(i).click();await p.locator('.bk-case-image').scrollIntoViewIfNeeded();await p.waitForFunction(()=>{const i=document.querySelector('.bk-case-image img');return i.complete&&i.naturalWidth>0;});const v=project.media[0].variants[device];check(l+' '+slug+' '+device+' corresponding captured asset',await p.locator('.bk-case-image img').getAttribute('src')===v.webp);}
 check(l+' '+slug+' existing narrative and related cases',await p.locator('.bk-case-prose>section').count()===project[l].chapters.length&&await p.locator('#evidencia').count()===1&&await p.locator('.bk-related-grid article').count()===2);
 }
 await p.goto(base+'/'+l+'/'+(l==='es'?'constelacion':'constellation')+'/',{waitUntil:'networkidle'});await p.locator('.bk-map-toolbar button').click();await p.waitForSelector('canvas[data-ready=true]');check(l+' actual renderer builds eight nodes',await p.locator('canvas').getAttribute('data-node-count')==='8');
 for(const[slug,i]of [['distrito-cero',6],['nexo',7]]){await p.locator('.bk-map-projects button').nth(i).click();check(l+' '+slug+' maps to its own 3D selection',(await p.locator('.bk-map-selected a').getAttribute('href')).includes('/'+slug+'/'));}
 await p.locator('.bk-map-toolbar button').click();
}
for(const width of [320,390,768,1024,1440,1920])for(const l of ['es','en']){
 await p.setViewportSize({width,height:900});
 for(const path of ['/'+l+'/',...['distrito-cero','nexo'].map(slug=>'/'+l+'/'+(l==='es'?'proyectos':'projects')+'/'+slug+'/')]){
  await p.goto(base+path,{waitUntil:'networkidle'});
  const out=await p.evaluate(()=>[...document.querySelectorAll('h1,h2,h3,.bk-hero-selector button,.bk-play-link,.bk-brand')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1}).map(e=>e.className));
  check(width+' '+path+' fully visible controls and titles',out.length===0&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),out);
 }
}
await p.setViewportSize({width:1440,height:960});await p.goto(base+'/es/',{waitUntil:'networkidle'});
check('Header uses production white mark with no recoloring',await p.locator('.bk-brand img').first().getAttribute('src')==='/assets/brand-mark-white.svg'&&await p.locator('.bk-brand img').first().evaluate(e=>e.naturalWidth>0&&getComputedStyle(e).filter==='none'));
const icons=await p.locator('link[rel*=icon]').evaluateAll(es=>es.map(e=>new URL(e.href).pathname));check('SVG ICO PNG and Apple favicon declarations present',['/favicon.svg','/favicon.ico','/icon-16.png','/icon-32.png','/apple-touch-icon.png'].every(path=>icons.includes(path)));
for(const item of brand.files){const path=new URL(item.sourceURL).pathname;const response=await p.request.get(base+path);check('Production brand bytes '+path,response.ok()&&crypto.createHash('sha256').update(await response.body()).digest('hex')===item.sourceSHA256);}
check('Browsing the book does not download game runtimes',!requested.some(url=>url.startsWith('https://nexo.izignamx.com/')||url.startsWith('https://cripterhack.github.io/distrito-cero/')));
fs.mkdirSync('/tmp/book-games-review',{recursive:true});await p.locator('.bk-game-shelf').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/book-games-review/book-games-desktop.png'});await p.goto(base+'/es/proyectos/distrito-cero/');await p.screenshot({path:'/tmp/book-games-review/distrito-case-desktop.png'});await p.setViewportSize({width:390,height:844});await p.goto(base+'/es/');await p.screenshot({path:'/tmp/book-games-review/book-home-mobile.png'});await p.locator('.bk-game-shelf').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/book-games-review/book-games-mobile.png'});
check('No runtime exceptions in game and brand journeys',errors.length===0,errors);
}catch(error){check('Game/brand review completes',false,String(error));}finally{await browser.close();fs.writeFileSync('docs/book-game-checks.json',JSON.stringify({environment:'Actual static artifact, Chromium and emulated viewports. Original game sessions captured separately.',checks},null,2));}if(checks.some(c=>!c.passed))process.exitCode=1;
})();

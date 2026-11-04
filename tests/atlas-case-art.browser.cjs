const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4210';
const checks=[];
const check=(name,passed,detail)=>{checks.push({name,passed,detail});console.log(passed?'PASS':'FAIL',name,JSON.stringify(detail??''));};

async function waitForNativeScroll(page){
 // Wait beyond transient heading focus and the native fragment/scroll task.
 // The previous regression focused H2 for only a few ms before Firefox blurred
 // it, and Chromium could cancel a keyboard fragment scroll at an intermediate Y.
 await page.waitForTimeout(240);
 await page.waitForFunction(()=>performance.now()-window.caseAnchorProbe.lastScroll>200,null,{timeout:6000});
}
async function state(page){return page.evaluate(()=>({
 hash:location.hash,
 focused:document.activeElement===document.querySelector('#chapter-2 h2'),
 current:document.querySelector('.bk-reading-desktop a[aria-current]')?.getAttribute('href'),
 top:document.querySelector('#chapter-2').getBoundingClientRect().top,
 mobileOpen:document.querySelector('.bk-reading-mobile').open,
 pendingFallbacks:window.caseAnchorProbe.pendingFallbacks,
 events:window.caseAnchorProbe.events,
}));}
async function activate(page,nav,mode){
 if(await nav.getAttribute('class')==='bk-reading-mobile')await nav.locator('summary').click();
 const link=nav.locator('a[href="#chapter-2"]');
 // Allow the preceding link-focus scroll to finish before testing the
 // fragment. Chromium140 can ignore rapid Enter during that separate native
 // focus scroll even with all application scripts blocked. No instant scroll.
 if(mode==='keyboard'){await link.focus();await waitForNativeScroll(page);await page.keyboard.press('Enter');}else await link.click();
 await waitForNativeScroll(page);
}

async function installProbe(page,noScrollend=false){
 await page.addInitScript(noScrollend=>{
    const probe=window.caseAnchorProbe={lastScroll:performance.now(),events:[],pendingFallbacks:0};
    const add=window.addEventListener;
    if(noScrollend)window.addEventListener=function(type,listener,options){if(type!=='scrollend')return add.call(this,type,listener,options);};
    add.call(window,'scroll',()=>{probe.lastScroll=performance.now();},{passive:true});
    for(const type of ['focusin','focusout','hashchange','scrollend'])add.call(window,type,event=>probe.events.push({type,target:event.target.tagName||'WINDOW',at:Math.round(performance.now()),y:scrollY,top:document.querySelector('#chapter-2')?.getBoundingClientRect().top,phase:document.querySelector('.bk-decision-figure')?.dataset.phase}),true);
    const schedule=window.setTimeout,clear=window.clearTimeout,pending=new Set();
    window.setTimeout=function(callback,delay,...args){
     let id;const run=(...values)=>{pending.delete(id);probe.pendingFallbacks=pending.size;return callback(...values);};
     id=schedule.call(this,typeof callback==='function'?run:callback,delay,...args);
     if(delay===120){pending.add(id);probe.pendingFallbacks=pending.size;}return id;
    };
    window.clearTimeout=function(id){pending.delete(id);probe.pendingFallbacks=pending.size;return clear.call(this,id);};
 },noScrollend);
}

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox']});
 const errors=[];
 try{
  const scenarios=[];
  for(const locale of ['es','en'])for(const width of [1440,390])for(const mode of ['click','keyboard'])scenarios.push({locale,width,mode,noScrollend:false});
  scenarios.push({locale:'en',width:1440,mode:'keyboard',noScrollend:true});
  for(const scenario of scenarios){
   const {locale,width,mode,noScrollend}=scenario;
   const name=`${locale} ${width}px ${mode}${noScrollend?' without scrollend':''}`;
   const page=await browser.newPage({viewport:{width,height:960}});
   page.on('pageerror',e=>errors.push(e.message));
   await installProbe(page,noScrollend);
   try{
    await page.goto(`${base}/${locale}/${locale==='es'?'proyectos':'projects'}/omnisync/`,{waitUntil:'networkidle'});
    const nav=page.locator(width===390?'.bk-reading-mobile':'.bk-reading-desktop');
    await activate(page,nav,mode);
    const first=await state(page);
    check(name+' native fragment finishes at the existing anchor offset',first.hash==='#chapter-2'&&first.top>=80&&first.top<=170,first);
    check(name+' settled destination retains focus and current location',first.focused&&first.current==='#chapter-2'&&!first.mobileOpen,first);
    check(name+' focus fallback leaves no timer running',first.pendingFallbacks===0,first.pendingFallbacks);
    // A real wheel gesture must release the explicit selection and resume the
    // chapter rail's reading state. Do this only after checking native alignment.
    await page.mouse.move(width-24,500);await page.mouse.wheel(0,850);await waitForNativeScroll(page);
    const manual=await page.evaluate(()=>({current:document.querySelector('.bk-reading-desktop a[aria-current]')?.getAttribute('href'),hash:location.hash}));
    check(name+' later native manual scroll updates the chapter rail',!!manual.current&&manual.current!=='#chapter-2'&&manual.hash==='#chapter-2',manual);
    await activate(page,nav,mode);
    const repeated=await state(page);
    check(name+' same-fragment activation also settles focus and location',repeated.hash==='#chapter-2'&&repeated.focused&&repeated.current==='#chapter-2'&&repeated.top>=80&&repeated.top<=170,repeated);
   }catch(error){check(name+' completes',false,String(error));}
   finally{await page.close();}
  }
  // History can supersede an explicit chapter request before its quiet-focus
  // callback. Neither that obsolete focus nor its pinned marker may survive.
  for(const locale of ['es','en'])for(const width of [1440,390])for(const direction of ['back','forward']){
   const name=`${locale} ${width}px interrupted browser ${direction}`;
   const page=await browser.newPage({viewport:{width,height:960}});
   page.on('pageerror',e=>errors.push(e.message));await installProbe(page);
   try{
    await page.goto(`${base}/${locale}/${locale==='es'?'proyectos':'projects'}/omnisync/#chapter-0`,{waitUntil:'networkidle'});
    await waitForNativeScroll(page);
    const nav=page.locator(width===390?'.bk-reading-mobile':'.bk-reading-desktop');
    const clickChapter=async index=>{
     if(width===390)await nav.locator('summary').click();
     await nav.locator(`a[href="#chapter-${index}"]`).click();
    };
    let expected,abandoned;
    if(direction==='forward'){
     // Create a settled forward entry, return, then interrupt a same-hash
     // request. This preserves the forward stack and tests its cancellation.
     await clickChapter(3);await waitForNativeScroll(page);
     await page.goBack();await waitForNativeScroll(page);
     await clickChapter(0);await page.goForward();expected=3;abandoned=0;
    }else{
     await clickChapter(2);await page.goBack();expected=0;abandoned=2;
    }
    await waitForNativeScroll(page);
    const result=await page.evaluate(({expected,abandoned})=>{
     const sections=[...document.querySelectorAll('.bk-case-prose>section'),document.getElementById('evidencia')].filter(Boolean);
     const passed=sections.filter(section=>section.getBoundingClientRect().top<=160);
     return {
     hash:location.hash,current:document.querySelector('.bk-reading-desktop a[aria-current]')?.getAttribute('href'),
     top:document.querySelector(`#chapter-${expected}`).getBoundingClientRect().top,
     abandonedFocus:document.activeElement===document.querySelector(`#chapter-${abandoned} h2`),
     pending:window.caseAnchorProbe.pendingFallbacks,events:window.caseAnchorProbe.events,
     restoredReading:'#'+(passed.at(-1)||sections[0]).id,
    };},{expected,abandoned});
    // Opening/focusing mobile contents updates the old history entry's scroll
    // position. Back restores that position, which can differ from its hash's
    // anchor. Keep the desktop review's exact offset and check the actual
    // restored reading position on mobile instead of replacing native scroll.
    const restored=width===390?result.current===result.restoredReading:result.current===`#chapter-${expected}`&&result.top>=80&&result.top<=170;
    check(name+' tracks history and the native restored reading position',result.hash===`#chapter-${expected}`&&restored,result);
    check(name+' cancels obsolete focus and timer work',!result.abandonedFocus&&result.pending===0,result);
    await page.mouse.move(width-24,500);await page.mouse.wheel(0,850);await waitForNativeScroll(page);
    const manual=await page.locator('.bk-reading-desktop a[aria-current]').getAttribute('href');
    check(name+' resumes later native reading',manual!==result.current,manual);
   }catch(error){check(name+' completes',false,String(error));}
   finally{await page.close();}
  }
  check('Case art reading has no browser exceptions',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.writeFileSync('docs/book-art-case-checks.json',JSON.stringify({environment:'Built static artifact; Chromium native scroll, pointer and keyboard. No reduced-motion override.',checks},null,2));
 }
 if(checks.some(c=>!c.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});

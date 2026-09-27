/** Real-browser regression fixtures; never included in the published artifact. */
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {spawn}=require('node:child_process');
const {mkdirSync,writeFileSync}=require('node:fs');
const {chromium}=require('@playwright/test');
const {auditPage}=require('./lib/atlas-a11y.cjs');
const pa11yRequire=createRequire(require.resolve('pa11y-ci/package.json'));
const pa11y=pa11yRequire('pa11y');
const puppeteer=createRequire(pa11yRequire.resolve('pa11y'))('puppeteer');
const base='http://127.0.0.1:4214',checks=[];
(async()=>{
  const server=spawn('python3',['scripts/serve-atlas.py','--port','4214'],{stdio:'ignore'});
  let browser;
  try{
    let ready=false;
    for(let i=0;i<50;i++){
      try{if((await fetch(base+'/es/',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert(ready,'Static fixture server starts');
    browser=await puppeteer.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox']});
    const createContext=browser.createBrowserContext.bind(browser);
    let mode='busy';
    browser.createBrowserContext=async()=>{
      const context=await createContext(),newPage=context.newPage.bind(context);
      context.newPage=async()=>{
        const page=await newPage(),current=mode;
        await page.setRequestInterception(true);
        page.on('request',request=>{
          if(new URL(request.url()).pathname.startsWith('/__a11y_pending/'))return;
          if(current==='missing-css'&&request.resourceType()==='stylesheet'){void request.abort('failed');return;}
          void request.continue();
        });
        if(current==='busy')await page.evaluateOnNewDocument(()=>{
          addEventListener('DOMContentLoaded',()=>{
            for(let i=0;i<3;i++)void fetch('/__a11y_pending/'+i).catch(()=>{});
          },{once:true});
        });
        if(current==='invalid-alt')await page.evaluateOnNewDocument(()=>{
          addEventListener('DOMContentLoaded',()=>{
            const image=document.createElement('img');image.src='/icon-32.png';document.body.append(image);
          },{once:true});
        });
        return page;
      };
      return context;
    };
    const url=base+'/es/proyectos/omnisync/';
    const oldContext=await browser.createBrowserContext(),oldPage=await oldContext.newPage();
    let timedOut=false;
    try{await pa11y(url,{browser,page:oldPage,standard:'WCAG2AA',timeout:4000});}
    catch(error){timedOut=error.name==='TimeoutError';}
    await oldPage.waitForFunction(()=>!!document.querySelector('main h1')&&!document.querySelector('astro-island[ssr]'),{timeout:20000});
    const contentExists=await oldPage.evaluate(()=>!!document.querySelector('main h1')&&!document.querySelector('astro-island[ssr]'));
    assert(timedOut&&contentExists,'Old network-idle gate times out even after content hydrates');
    checks.push({name:'Original timeout reproduced with ready content and three pending background requests',passed:true});
    await oldContext.close();
    const good=await auditPage({browser,pa11y,url,timeout:20000});
    assert.equal(good.issues.filter(issue=>issue.type==='error').length,0);
    checks.push({name:'Document readiness runs the real audit without waiting on unrelated idle requests',passed:true});
    mode='invalid-alt';
    const invalid=await auditPage({browser,pa11y,url,timeout:20000});
    assert(invalid.issues.some(issue=>issue.type==='error'&&/alt|alternative/i.test(issue.message)));
    checks.push({name:'A genuine missing-alt error is still detected by the unchanged Pa11y rules',passed:true});
    mode='missing-css';
    let rejected=false;
    try{await auditPage({browser,pa11y,url,timeout:2500});}catch(error){rejected=error.phase==='readiness'&&error.failedRequests.some(request=>request.type==='stylesheet');}
    assert(rejected,'An unstyled document must not be audited as ready');
    checks.push({name:'Missing required CSS fails with resource diagnostics instead of passing',passed:true});
  }catch(error){checks.push({name:'Readiness regression completes',passed:false,error:String(error)});process.exitCode=1;}
  finally{
    await browser?.close();server.kill();
    mkdirSync('audit/atlas-accessibility',{recursive:true});
    writeFileSync('audit/atlas-accessibility/readiness-regression.json',JSON.stringify({scope:'Synthetic network/error fixtures over the unchanged local production artifact',checks},null,2)+'\n');
    console.log(JSON.stringify(checks,null,2));
  }
})();

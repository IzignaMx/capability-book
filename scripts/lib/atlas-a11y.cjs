const {mkdirSync,writeFileSync,renameSync}=require('node:fs');
const {dirname}=require('node:path');

function errorDetails(error){
  return {name:error?.name||'Error',message:String(error?.message||error),phase:error?.phase,
    pendingRequests:error?.pendingRequests||[],failedRequests:error?.failedRequests||[],pageErrors:error?.pageErrors||[]};
}
function saveReport(file,report){
  mkdirSync(dirname(file),{recursive:true});
  writeFileSync(file+'.tmp',JSON.stringify(report,null,2)+'\n');
  renameSync(file+'.tmp',file);
}
/** Only a navigation transport timeout gets one fresh-page retry. Findings never do. */
async function runAudit({base,paths,reportPath,start,onResult=()=>{}}){
  const report={scope:'Static artifact, automated Pa11y WCAG2AA, not certification',
    startedAt:new Date().toISOString(),buildRevision:process.env.GITHUB_SHA||'local',base,
    status:'running',complete:false,expectedPages:paths.length,results:[]};
  saveReport(reportPath,report); // Supersede any tracked success before even launching Chromium.
  let session;
  try {
    session=await start();
    for(const path of paths){
      const entry={path,status:'failed',errors:[],attempts:[]};
      for(let attempt=1;attempt<=2;attempt++){
        try{
          const result=await session.audit(path);
          if(!Array.isArray(result?.issues))throw new Error('Audit returned no issue inventory');
          entry.errors=result.issues.filter(issue=>issue.type==='error');
          entry.status=entry.errors.length?'failed':'passed';
          entry.attempts.push({attempt,status:entry.status});
          break;
        }catch(error){
          const detail=errorDetails(error);
          entry.attempts.push({attempt,status:'error',error:detail});
          if(attempt===1&&error?.name==='TimeoutError'&&error?.phase==='navigation')continue;
          entry.error=detail;break;
        }
      }
      report.results.push(entry);
      saveReport(reportPath,report);
      onResult(entry);
    }
  }catch(error){report.runError=errorDetails(error);}
  finally{
    try{await session?.close();}catch(error){report.cleanupError=errorDetails(error);}
    report.complete=report.results.length===paths.length;
    report.status=report.complete&&!report.runError&&!report.cleanupError&&report.results.every(r=>r.status==='passed')?'passed':'failed';
    report.finishedAt=new Date().toISOString();
    saveReport(reportPath,report);
  }
  return report;
}

/** Inspect the fully rendered document, not unrelated network-idle timing. */
async function auditPage({browser,pa11y,url,timeout=45000}){
  const started=Date.now(),remaining=()=>Math.max(1,timeout-(Date.now()-started));
  const pending=new Set(),failed=[],pageErrors=[];
  let context,phase='setup';
  const safeUrl=value=>{try{const u=new URL(value);return u.origin+u.pathname;}catch{return String(value).slice(0,200);}};
  try{
    context=await browser.createBrowserContext();
    const page=await context.newPage();
    page.on('request',request=>pending.add(request));
    page.on('requestfinished',request=>pending.delete(request));
    page.on('requestfailed',request=>{
      pending.delete(request);
      failed.push({url:safeUrl(request.url()),type:request.resourceType(),error:request.failure()?.errorText});
    });
    page.on('pageerror',error=>pageErrors.push(String(error.message||error)));
    const viewport={width:1280,height:1024};
    await page.setViewport(viewport);
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    phase='navigation';
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:remaining()});
    if(!response||response.status()!==200)throw new Error('Unexpected HTTP '+response?.status()+' for '+safeUrl(url));
    phase='readiness';
    await page.waitForFunction(()=>{
      if(!document.querySelector('main h1')||document.querySelector('astro-island[ssr]'))return false;
      const styles=[...document.querySelectorAll('link[rel=stylesheet]')];
      if(!styles.length||styles.some(style=>!style.sheet))return false;
      if(document.fonts.status!=='loaded'||!document.fonts.check('16px Aileron'))return false;
      return [...document.images].filter(image=>image.loading!=='lazy').every(image=>image.complete&&image.naturalWidth>0);
    },{timeout:remaining()});
    if(pageErrors.length)throw new Error('Application errors before accessibility audit');
    if(failed.some(request=>['document','script','stylesheet','font'].includes(request.type)))throw new Error('Required rendering resource failed');
    phase='audit';
    // Supported Pa11y API. Each attempt gets a new page and isolated browser context.
    const result=await pa11y(url,{browser,page,ignoreUrl:true,viewport,standard:'WCAG2AA',timeout:remaining(),wait:0});
    if(pageErrors.length)throw new Error('Application errors during accessibility audit');
    return result;
  }catch(error){
    error.phase=phase;
    error.pendingRequests=[...pending].map(request=>safeUrl(request.url()));
    error.failedRequests=failed;
    error.pageErrors=pageErrors;
    throw error;
  }finally{await context?.close();}
}
module.exports={runAudit,auditPage};

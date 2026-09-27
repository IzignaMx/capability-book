const {createRequire}=require('node:module');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {chromium}=require('@playwright/test');
const {runAudit,auditPage}=require('./lib/atlas-a11y.cjs');
const pa11yRequire=createRequire(require.resolve('pa11y-ci/package.json'));
const pa11y=pa11yRequire('pa11y');
// Resolve the same Puppeteer version used by the pinned Pa11y, without a new dependency.
const puppeteer=createRequire(pa11yRequire.resolve('pa11y'))('puppeteer');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4212';
const paths=['/es/','/en/','/es/proyectos/','/en/projects/','/es/proyectos/omnisync/','/en/projects/hamburguesa-nomada/','/es/comparar/?projects=omnisync,tecuiyo','/es/diagnostico/','/en/diagnostic/','/es/constelacion/','/es/proyectos/distrito-cero/','/en/projects/distrito-cero/','/es/proyectos/nexo/','/en/projects/nexo/','/es/privacidad/','/en/accessibility/'];
async function start(){
  let server,browser,serverError;
  const close=async()=>{
    try{await browser?.close();}
    finally{if(server?.pid&&server.exitCode===null){const stopped=once(server,'exit');server.kill();await stopped;}}
  };
  try{
    if(!process.env.REVIEW_BASE_URL){
      server=spawn('python3',['scripts/serve-atlas.py','--port','4212'],{stdio:['ignore','ignore','inherit']});
      server.on('error',error=>{serverError=error;});
    }
    let ready=false;
    for(let i=0;i<30;i++){
      if(serverError)throw serverError;
      if(server&&server.exitCode!==null)throw new Error('Static server exited: '+server.exitCode);
      try{if((await fetch(base+'/es/',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    if(!ready)throw new Error('Static server did not become ready');
    browser=await puppeteer.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox'],timeout:45000});
    return {audit:path=>auditPage({browser,pa11y,url:base+path}),close};
  }catch(error){await close();throw error;}
}
runAudit({base,paths,reportPath:'docs/atlas/a11y.json',start,onResult:result=>{
  console.log(result.path,result.status,JSON.stringify({errors:result.errors,attempts:result.attempts}));
}}).then(report=>{
  console.log('Accessibility audit:',report.status,report.results.length+'/'+report.expectedPages+' pages');
  if(report.runError)console.error(report.runError);
  if(report.cleanupError)console.error(report.cleanupError);
  if(report.status!=='passed')process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1;});

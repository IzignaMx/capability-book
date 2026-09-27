const{createRequire}=require('node:module');const{spawn}=require('node:child_process');const{mkdirSync,writeFileSync}=require('node:fs');const{chromium}=require('@playwright/test');
const pa11y=createRequire(require.resolve('pa11y-ci/package.json'))('pa11y');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4212';
const paths=['/es/','/en/','/es/proyectos/','/en/projects/','/es/proyectos/omnisync/','/en/projects/hamburguesa-nomada/','/es/comparar/?projects=omnisync,tecuiyo','/es/diagnostico/','/en/diagnostic/','/es/constelacion/','/es/privacidad/','/en/accessibility/'];
(async()=>{let server;if(!process.env.REVIEW_BASE_URL)server=spawn('python3',['scripts/serve-atlas.py','--port','4212'],{stdio:'ignore'});const results=[];
try{for(let i=0;i<100;i++){try{if((await fetch(base+'/es/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===99)throw Error('Static server did not start');}
for(const path of paths){const r=await pa11y(base+path,{standard:'WCAG2AA',timeout:45000,wait:300,chromeLaunchConfig:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath(),args:['--no-sandbox']}});const errors=r.issues.filter(i=>i.type==='error');results.push({path,errors});console.log(path,errors.length,errors.map(e=>e.message));}
mkdirSync('docs/atlas',{recursive:true});writeFileSync('docs/atlas/a11y.json',JSON.stringify({scope:'Static artifact, automated Pa11y WCAG2AA, not certification',results},null,2));if(results.some(r=>r.errors.length))process.exitCode=1;
}finally{server?.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});

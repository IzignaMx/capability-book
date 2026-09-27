const {spawn,spawnSync}=require('node:child_process');
const {mkdirSync,readFileSync,writeFileSync}=require('node:fs');
const {chromium}=require('@playwright/test');
const base=process.env.REVIEW_BASE_URL||'http://127.0.0.1:4211';
const scripts=['verify-book.cjs','verify-book-context.cjs','verify-book-reading.cjs','verify-book-case-polish.cjs','verify-book-3d.cjs','verify-book-games.cjs'];
(async()=>{let server;if(!process.env.REVIEW_BASE_URL)server=spawn('python3',['scripts/serve-atlas.py','--port','4211'],{stdio:'ignore'});
try{for(let i=0;i<100;i++){try{if((await fetch(base+'/es/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===99)throw Error('Static server did not start');}
for(const script of scripts){console.log('ATLAS STATIC CHECK',script);const r=spawnSync(process.execPath,['atlas/verification/'+script],{stdio:'inherit',env:{...process.env,REVIEW_BASE_URL:base,PLAYWRIGHT_CHROMIUM_EXECUTABLE:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||chromium.executablePath()},timeout:300000});if(r.status!==0)throw Error(script+' failed: '+r.status);}
const names=['book-browser-checks.json','book-context-checks.json','book-reading-checks.json','book-case-polish-checks.json','book-3d-checks.json','book-game-checks.json'];const reports=names.map(file=>{const d=JSON.parse(readFileSync('docs/'+file,'utf8'));return{file,checks:d.checks.length,failures:d.checks.filter(c=>!c.passed).length};});mkdirSync('docs/atlas',{recursive:true});writeFileSync('docs/atlas/browser-summary.json',JSON.stringify({hosting:'Static files only',reports,total:reports.reduce((n,r)=>n+r.checks,0)},null,2));
}finally{server?.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});

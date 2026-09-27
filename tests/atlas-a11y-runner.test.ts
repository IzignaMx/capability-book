// @vitest-environment node
import {afterEach,expect,test} from 'vitest';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
let api:any={};try{api=require('../scripts/lib/atlas-a11y.cjs');}catch{}
const dirs:string[]=[];
const reportFile=()=>{const dir=mkdtempSync(join(tmpdir(),'atlas-a11y-'));dirs.push(dir);return join(dir,'report.json');};
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
const timeout=()=>Object.assign(new Error('Navigation timeout of 45000 ms exceeded'),{name:'TimeoutError',phase:'navigation',pendingRequests:['https://example.test/pending']});
function run(options:any){expect(typeof api.runAudit).toBe('function');return api.runAudit({base:'http://127.0.0.1:4212',paths:['/es/','/en/'],...options});}
test('replaces stale success before startup and writes only current results',async()=>{
 const file=reportFile();writeFileSync(file,JSON.stringify({status:'passed',results:[{path:'old'}]}));
 let closed=false;
 const result=await run({reportPath:file,start:async()=>{
  const initial=JSON.parse(readFileSync(file,'utf8'));expect(initial.status).toBe('running');expect(initial.results).toEqual([]);expect(initial.complete).toBe(false);
  return{audit:async()=>({issues:[]}),close:async()=>{closed=true;}};
 }});
 expect(result.status).toBe('passed');expect(result.complete).toBe(true);expect(result.results.map((r:any)=>r.path)).toEqual(['/es/','/en/']);expect(closed).toBe(true);
});
test('real accessibility findings fail the gate and are never retried',async()=>{
 const calls:string[]=[];const issue={type:'error',code:'WCAG2AA.fixture',message:'Missing label'};
 const result=await run({reportPath:reportFile(),start:async()=>({audit:async(path:string)=>{calls.push(path);return{issues:[issue]};},close:async()=>{}})});
 expect(calls).toEqual(['/es/','/en/']);expect(result.status).toBe('failed');expect(result.results[0].errors).toEqual([issue]);expect(result.complete).toBe(true);
});
test('retries a navigation timeout once and records the recovered failure',async()=>{
 let calls=0;const result=await run({paths:['/es/'],reportPath:reportFile(),start:async()=>({audit:async()=>{if(++calls===1)throw timeout();return{issues:[]};},close:async()=>{}})});
 expect(calls).toBe(2);expect(result.status).toBe('passed');expect(result.results[0].attempts).toHaveLength(2);expect(result.results[0].attempts[0].error.pendingRequests).toEqual(['https://example.test/pending']);
});
test('persistent navigation failure stays failed, closes resources and audits other pages',async()=>{
 let calls=0,closed=false;const file=reportFile();
 const result=await run({reportPath:file,start:async()=>({audit:async(path:string)=>{calls++;if(path==='/es/')throw timeout();return{issues:[]};},close:async()=>{closed=true;}})});
 expect(calls).toBe(3);expect(closed).toBe(true);expect(result.status).toBe('failed');expect(result.results).toHaveLength(2);expect(result.results[0].status).toBe('failed');expect(JSON.parse(readFileSync(file,'utf8')).status).toBe('failed');
});
test('readiness and HTTP failures are not disguised as empty accessibility results',async()=>{
 let calls=0;const result=await run({reportPath:reportFile(),start:async()=>({audit:async()=>{calls++;throw Object.assign(new Error('HTTP 404'),{phase:'navigation'});},close:async()=>{}})});
 expect(calls).toBe(2);expect(result.status).toBe('failed');expect(result.results.every((r:any)=>r.error.message==='HTTP 404')).toBe(true);
});
test('startup failures overwrite stale reports and remain explicitly incomplete',async()=>{
 const file=reportFile();writeFileSync(file,'{"status":"passed","results":[{"path":"old"}]}');
 const result=await run({reportPath:file,start:async()=>{throw new Error('Browser unavailable');}});
 expect(result.status).toBe('failed');expect(result.complete).toBe(false);expect(result.results).toEqual([]);expect(result.runError.message).toBe('Browser unavailable');expect(JSON.parse(readFileSync(file,'utf8')).runError.message).toBe('Browser unavailable');
});
test('cleanup failure cannot produce a successful report',async()=>{
 const result=await run({reportPath:reportFile(),start:async()=>({audit:async()=>({issues:[]}),close:async()=>{throw new Error('Browser close failed');}})});
 expect(result.status).toBe('failed');expect(result.cleanupError.message).toBe('Browser close failed');
});

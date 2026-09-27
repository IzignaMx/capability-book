import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const source=JSON.parse(await readFile('docs/atlas/import.json','utf8'));
const catalog=JSON.parse(await readFile('atlas/book/projects.json','utf8'));
const release={edition:'IzignaMx Book Atlas',sourceRevision:source.sourceCommit,buildRevision:process.env.GITHUB_SHA||'local-review',indexable:process.env.ATLAS_INDEXABLE==='true',contentPages:16+2*catalog.length,projectCount:catalog.length,hosting:'GitHub Pages static artifact',requiresServer:false};
await writeFile('dist/release.json',JSON.stringify(release,null,2)+'\n');
const hashes={};
async function visit(path=''){
 for(const entry of await readdir(join('dist',path),{withFileTypes:true})){
  const rel=join(path,entry.name);
  if(entry.isDirectory())await visit(rel);
  else if(rel!=='.atlas-manifest.json')hashes[rel]=createHash('sha256').update(await readFile(join('dist',rel))).digest('hex');
 }
}
await visit();
await writeFile('dist/.atlas-manifest.json',JSON.stringify(hashes,null,2)+'\n');
console.log('Atlas manifest',Object.keys(hashes).length,'files');

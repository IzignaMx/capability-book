import {projects,getProject,projectCategories,type Chapter,type Locale} from './model';
export function readingItems(chapters:readonly Chapter[],locale:Locale){
 return [...chapters.map((c,i)=>({id:`chapter-${i}`,label:c.title})),{id:'evidencia',label:locale==='es'?'Fuentes y límites':'Sources and boundaries'}];
}
export function activeReadingId(items:readonly {id:string;top:number}[],offset=120){
 const valid=items.filter(p=>Number.isFinite(p.top));
 const passed=valid.filter(p=>p.top<=offset);
 return passed.at(-1)?.id||valid[0]?.id||'';
}
/** Stable editorial affinities, not a ranking of commercial outcomes. */
export function relatedCases(slug:string){
 const current=getProject(slug);if(!current)return [];
 const caps=new Set(current.en.capabilities),categories=new Set(projectCategories(current));
 return projects.filter(p=>p.slug!==slug).map((p,index)=>({p,index,score:p.en.capabilities.filter(c=>caps.has(c)).length*2+projectCategories(p).filter(c=>categories.has(c)).length})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,2).map(x=>x.p);
}

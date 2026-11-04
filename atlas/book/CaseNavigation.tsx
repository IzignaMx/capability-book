import {useEffect,useMemo,useRef,useState} from 'react';
import {type Chapter,type Locale} from './model';
import {activeReadingId,readingItems} from './reading';
import {Icon,tx} from './Chrome';
import {TrajectoryMark} from './art/TrajectoryMark';

/** The three study lenses follow the existing challenge, decision and system chapters. */
export function readingPhase(id:string):number{
 const chapter=Number(id.replace('chapter-',''));
 return id==='evidencia'?2:!Number.isFinite(chapter)||chapter<2?0:chapter===2?1:2;
}

type CaseNavigationProps={chapters:Chapter[];locale:Locale;projectSlug?:string;activePhase?:number;onPhaseChange?:(phase:number)=>void};
export function CaseNavigation({chapters,locale:l,projectSlug,activePhase,onPhaseChange}:CaseNavigationProps){
 const items=useMemo(()=>readingItems(chapters,l),[chapters,l]);
 const [active,setActive]=useState(items[0]?.id||'');
 const mobile=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const sync=()=>{
   const positions=items.map(item=>({id:item.id,top:document.getElementById(item.id)?.getBoundingClientRect().top??NaN}));
   const next=activeReadingId(positions,145);
   setActive(next);
   // A study disclosure can move chapters below the viewport. Keep its explicit
   // selection until reading actually reaches a chapter.
   if(positions.some(item=>Number.isFinite(item.top)&&item.top<=145))onPhaseChange?.(readingPhase(next));
  };
  let observer:IntersectionObserver|undefined;
  // Native anchors and explicit selection remain complete if observing is unavailable.
  try{
   if(typeof IntersectionObserver!=='undefined'){
    observer=new IntersectionObserver(sync,{rootMargin:'-110px 0px -50% 0px',threshold:[0,.25,1]});
    for(const item of items){const el=document.getElementById(item.id);if(el)observer.observe(el);}
   }
  }catch{observer?.disconnect();}
  window.addEventListener('hashchange',sync);sync();
  return()=>{observer?.disconnect();window.removeEventListener('hashchange',sync);};
 },[items,onPhaseChange]);
 const go=(id:string)=>{
  setActive(id);onPhaseChange?.(readingPhase(id));
  if(mobile.current)mobile.current.open=false;
  requestAnimationFrame(()=>{
   const heading=document.getElementById(id)?.querySelector('h2');
   if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});}
  });
 };
 const links=()=>items.map((item,index)=><a key={item.id} href={'#'+item.id} aria-current={active===item.id?'location':undefined} onClick={()=>go(item.id)}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span>{item.label}</a>);
 return <aside className="bk-reading-navigation">
  <div className="bk-reading-desktop">
   {projectSlug&&<TrajectoryMark slug={projectSlug} activePath={activePhase??readingPhase(active)} compact className="bk-reading-signature"/>}
   <p className="bk-kicker">{tx(l,'DENTRO DEL PROYECTO','INSIDE THE PROJECT')}</p>
   <nav aria-label={tx(l,'Secciones del caso','Case sections')}>{links()}</nav>
  </div>
  <details className="bk-reading-mobile" ref={mobile}>
   <summary>{tx(l,'En este caso','In this case')}<span>{String(Math.max(0,items.findIndex(i=>i.id===active))+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</span><Icon name="down"/></summary>
   {projectSlug&&<TrajectoryMark slug={projectSlug} activePath={activePhase??readingPhase(active)} compact className="bk-reading-signature"/>}
   <nav aria-label={tx(l,'Secciones del caso en móvil','Case sections on mobile')}>{links()}</nav>
  </details>
 </aside>;
}

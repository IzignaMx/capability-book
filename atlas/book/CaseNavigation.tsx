import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
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
 const requested=useRef<string|null>(null);
 const focusRequested=useRef<string|null>(null);
 const focusFrame=useRef(0);
 const focusTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const cancelRequest=useCallback(()=>{
  requested.current=null;focusRequested.current=null;
  if(focusTimer.current!==null){clearTimeout(focusTimer.current);focusTimer.current=null;}
  cancelAnimationFrame(focusFrame.current);focusFrame.current=0;
 },[]);
 const focusHeading=useCallback((id:string)=>{
  cancelAnimationFrame(focusFrame.current);
  focusFrame.current=requestAnimationFrame(()=>{
   if(location.hash!=='#'+id){cancelRequest();return;}
   const heading=document.getElementById(id)?.querySelector('h2');
   requested.current=null;setActive(id);
   if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});}
  });
 },[cancelRequest]);
 const finishFocus=useCallback(()=>{
  const id=focusRequested.current;
  if(!id)return;
  if(location.hash!=='#'+id){cancelRequest();return;}
  focusRequested.current=null;
  onPhaseChange?.(readingPhase(id));
  if(focusTimer.current!==null){clearTimeout(focusTimer.current);focusTimer.current=null;}
  focusHeading(id);
 },[focusHeading,onPhaseChange,cancelRequest]);
 const deferFocus=useCallback(()=>{
  if(!focusRequested.current)return;
  if(focusTimer.current!==null)clearTimeout(focusTimer.current);
  // Fallback for engines without scrollend. This only waits for an explicit
  // fragment request; scroll events update a timer, never React state.
  focusTimer.current=setTimeout(finishFocus,120);
 },[finishFocus]);
 useEffect(()=>{
  let fragmentScrolling=!!location.hash;
  let readingTimer:ReturnType<typeof setTimeout>|null=null;
  const cancelReading=()=>{
   fragmentScrolling=false;
   if(readingTimer!==null){clearTimeout(readingTimer);readingTimer=null;}
  };
  const sync=()=>{
   const positions=items.map(item=>({id:item.id,top:document.getElementById(item.id)?.getBoundingClientRect().top??NaN}));
   // Closing a mobile disclosure can leave native fragment alignment a few
   // pixels below the desktop position in Firefox/WebKit. Keep a requested
   // chapter current during native scrolling, then resume geometric reading.
   // Changing the study disclosure above it mid-scroll can cancel native
   // smooth fragment navigation, so its phase waits for the scroll to settle.
   const offset=160;
   const destination=positions.find(item=>item.id===requested.current);
   if(destination){
    setActive(destination.id);return;
   }
   // Native context links and history also scroll past intermediate chapters.
   // Keep their study disclosure stable until the browser finishes scrolling.
   if(fragmentScrolling)return;
   requested.current=null;
   const next=activeReadingId(positions,offset);
   setActive(next);
   // A study disclosure can move chapters below the viewport. Keep its explicit
   // selection until reading actually reaches a chapter.
   if(positions.some(item=>Number.isFinite(item.top)&&item.top<=offset))onPhaseChange?.(readingPhase(next));
  };
  const deferReading=()=>{
   if(readingTimer!==null)clearTimeout(readingTimer);
   readingTimer=setTimeout(()=>{readingTimer=null;fragmentScrolling=false;sync();},120);
  };
  const nativeFragment=()=>{fragmentScrolling=true;deferReading();};
  const fragmentClicked=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target instanceof Element?event.target.closest('a[href]'):null;
   if(!(link instanceof HTMLAnchorElement)||link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
   const url=new URL(link.href);
   if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search&&url.hash){
    // A same-hash context link emits no hashchange. Supersede old focus work
    // before the rail's own click handler can establish a fresh request.
    cancelRequest();nativeFragment();
   }
  };
  let observer:IntersectionObserver|undefined;
  // Native anchors and explicit selection remain complete if observing is unavailable.
  try{
   if(typeof IntersectionObserver!=='undefined'){
    observer=new IntersectionObserver(sync,{rootMargin:'-110px 0px -50% 0px',threshold:[0,.25,1]});
    for(const item of items){const el=document.getElementById(item.id);if(el)observer.observe(el);}
   }
  }catch{observer?.disconnect();}
  const fragmentChanged=()=>{
   const id=location.hash.slice(1);
   if(focusRequested.current===id)deferFocus();
   else if(requested.current||focusRequested.current)cancelRequest();
   nativeFragment();
   sync();
  };
  const manualReading=(event:Event)=>{
   if(!requested.current&&!focusRequested.current&&!fragmentScrolling)return;
   if(event instanceof KeyboardEvent&&!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))return;
   cancelRequest();cancelReading();sync();
  };
  // A queued focus/disclosure scrollend may precede the fragment's own scroll.
  // Share the quiet-period check so that subsequent native scroll cancels it.
  // A final geometric sample also covers boundaries missed by the observer.
  // Both paths use a bounded quiet timer, including engines without scrollend.
  const scrollSettled=()=>{deferFocus();deferReading();};
  window.addEventListener('click',fragmentClicked,true);
  window.addEventListener('hashchange',fragmentChanged);
  window.addEventListener('scroll',scrollSettled,{passive:true});
  window.addEventListener('scrollend',scrollSettled);
  window.addEventListener('wheel',manualReading,{passive:true});
  window.addEventListener('touchstart',manualReading,{passive:true});
  window.addEventListener('keydown',manualReading);
  sync();
  if(fragmentScrolling)deferReading();
  return()=>{
   observer?.disconnect();window.removeEventListener('hashchange',fragmentChanged);
   window.removeEventListener('click',fragmentClicked,true);
   window.removeEventListener('scroll',scrollSettled);window.removeEventListener('scrollend',scrollSettled);
   window.removeEventListener('wheel',manualReading);window.removeEventListener('touchstart',manualReading);window.removeEventListener('keydown',manualReading);
   cancelRequest();cancelReading();
  };
 },[items,onPhaseChange,deferFocus,finishFocus,cancelRequest]);
 const go=(id:string)=>{
  cancelRequest();
  requested.current=id;focusRequested.current=id;
  setActive(id);
  if(mobile.current)mobile.current.open=false;
  // Firefox resets focus during native fragment navigation; Chromium can
  // cancel smooth fragment scrolling if focus moves before that scroll ends.
  // Repeat activation of the current fragment does not emit hashchange.
  if(location.hash==='#'+id)deferFocus();
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

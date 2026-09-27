import {useEffect,useMemo,useRef,useState} from 'react';
import {type Chapter,type Locale} from './model';
import {activeReadingId,readingItems} from './reading';
import {Icon,tx} from './Chrome';
export function CaseNavigation({chapters,locale:l}:{chapters:Chapter[];locale:Locale}){
 const items=useMemo(()=>readingItems(chapters,l),[chapters,l]);
 const [active,setActive]=useState(items[0]?.id||'');
 const mobile=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const sync=()=>setActive(activeReadingId(items.map(item=>({id:item.id,top:document.getElementById(item.id)?.getBoundingClientRect().top??NaN})),145));
  const observer=new IntersectionObserver(sync,{rootMargin:'-110px 0px -50% 0px',threshold:[0,.25,1]});
  for(const item of items){const el=document.getElementById(item.id);if(el)observer.observe(el);}
  window.addEventListener('hashchange',sync);sync();
  return()=>{observer.disconnect();window.removeEventListener('hashchange',sync);};
 },[items]);
 const go=(id:string)=>{setActive(id);if(mobile.current)mobile.current.open=false;requestAnimationFrame(()=>{const heading=document.getElementById(id)?.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});}});};
 const links=()=>items.map((item,index)=><a key={item.id} href={'#'+item.id} aria-current={active===item.id?'location':undefined} onClick={()=>go(item.id)}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span>{item.label}</a>);
 return <aside className="bk-reading-navigation">
  <div className="bk-reading-desktop"><p className="bk-kicker">{tx(l,'DENTRO DEL PROYECTO','INSIDE THE PROJECT')}</p><nav aria-label={tx(l,'Secciones del caso','Case sections')}>{links()}</nav></div>
  <details className="bk-reading-mobile" ref={mobile}><summary>{tx(l,'En este caso','In this case')}<span>{String(Math.max(0,items.findIndex(i=>i.id===active))+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</span><Icon name="down"/></summary><nav aria-label={tx(l,'Secciones del caso en móvil','Case sections on mobile')}>{links()}</nav></details>
 </aside>;
}

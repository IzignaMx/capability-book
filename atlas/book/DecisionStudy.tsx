import {useState} from 'react';
import {type Locale,type Project,briefPath} from './model';
import {Icon,tx} from './Chrome';
import './decision-study.css';

/** Editorial geometry explains the reading sequence, not a measured system topology. */
const trajectories:Record<string,string[]>={
 'distrito-cero':['M42 224 L120 224 L120 140 L280 140','M42 66 L170 66 L170 140 L280 140','M280 140 L364 140 L364 66 L464 66'],
 nexo:['M42 82 C146 268 224 260 280 140','M42 224 C170 30 206 22 280 140','M280 140 C328 242 460 190 458 80'],
 omnisync:['M44 146 C112 24 236 26 280 136','M60 235 C118 178 222 226 280 136','M280 136 C330 64 405 66 452 150'],
 'hamburguesa-nomada':['M40 204 C122 266 216 42 280 144','M68 60 C142 4 206 249 280 144','M280 144 C347 34 414 72 464 128'],
 tecuiyo:['M40 80 L162 80 L162 142 L280 142','M40 232 L112 232 L112 142 L280 142','M280 142 L354 142 L354 78 L464 78'],
 vald:['M42 220 C96 208 105 76 159 103 S216 217 280 146','M45 61 C125 158 164 21 280 146','M280 146 C334 252 413 64 465 111'],
 nutrichilango:['M50 55 C50 151 192 213 280 142','M50 233 C51 117 218 39 280 142','M280 142 C362 63 428 72 462 154'],
 'developer-tools':['M40 70 L130 70 L197 142 L280 142','M40 231 L130 231 L197 142 L280 142','M280 142 L347 72 L461 72']
};
export function DecisionStudy({project:p,locale:l}:{project:Project;locale:Locale}){
 const [active,setActive]=useState(0);
 const c=p[l];
 const steps=[
  {label:tx(l,'El reto','The challenge'),text:c.challenge,chapter:0},
  {label:tx(l,'La decisión','The decision'),text:c.strategy,chapter:2},
  {label:tx(l,'El sistema','The system'),text:c.solution,chapter:3}
 ];
 const paths=trajectories[p.slug]||trajectories.omnisync || [];
 return <section className="bk-decision-study" id="decision-study" aria-labelledby="decision-study-title">
  <div className="bk-decision-heading"><h2 id="decision-study-title">{tx(l,'Del reto\nal sistema.','From challenge\nto system.')}</h2><p>{tx(l,'Tres perspectivas para entender qué se construyó y por qué.','Three perspectives on what was built and why.')}</p></div>
  <div className="bk-decision-layout">
   <figure className="bk-decision-figure" data-phase={active}>
    <svg viewBox="0 0 500 300" fill="none" aria-hidden="true" focusable="false">
     <g className="bk-study-grid"><path d="M40 30v240M150 30v240M260 30v240M370 30v240M480 30v240M20 40h460M20 95h460M20 150h460M20 205h460M20 260h460"/></g>
     <ellipse className="bk-study-orbit" cx="280" cy="143" rx="166" ry="106" transform="rotate(-18 280 143)"/>
     {paths.map((d,i)=><path key={i} d={d} className={'bk-study-trace'+(active===i?' is-active':'')}/>)}
     <circle className="bk-study-core-ring" cx="280" cy="143" r="25"/><circle className="bk-study-core" cx="280" cy="143" r="7"/>
     <g className="bk-study-register"><path d="M20 40V20h20M460 20h20v20M20 260v20h20M460 280h20v-20M267 143h26M280 130v26"/></g>
     <text x="25" y="294">{p.slug.toUpperCase()}</text><text x="448" y="294">{String(active+1).padStart(2,'0')}/03</text>
    </svg>
    <figcaption>{tx(l,'Esquema editorial del caso. No representa telemetría ni una simulación física.','Editorial study of the case. Not telemetry or a physics simulation.')}</figcaption>
   </figure>
   <div className="bk-decision-steps">
    {steps.map((step,i)=><details key={i} open={active===i}>
     <summary onClick={e=>{e.preventDefault();setActive(i);}}><span className="bk-study-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{step.label}<Icon name="plus"/></summary>
     <div className="bk-decision-copy"><p>{step.text}</p><a href={'#chapter-'+step.chapter}>{tx(l,'Leer en contexto','Read in context')}<Icon name="right"/></a></div>
    </details>)}
    <a className="bk-decision-contact" href={briefPath(l,[p.slug])}>{tx(l,'Hablemos de un reto similar','Let’s discuss a similar challenge')}<Icon/></a>
   </div>
  </div>
 </section>;
}

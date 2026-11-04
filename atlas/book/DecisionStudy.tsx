import {useState} from 'react';
import {type Locale,type Project,briefPath} from './model';
import {Icon,tx} from './Chrome';
import './decision-study.css';

import {projectSignature} from './art/trajectories';

type DecisionStudyProps={project:Project;locale:Locale;activePhase?:number;onPhaseChange?:(phase:number)=>void};
export function DecisionStudy({project:p,locale:l,activePhase,onPhaseChange}:DecisionStudyProps){
 const [selected,setSelected]=useState(0);
 const active=activePhase??selected;
 const select=(phase:number)=>{setSelected(phase);onPhaseChange?.(phase);};
 const c=p[l];
 const steps=[
  {label:tx(l,'El reto','The challenge'),text:c.challenge,chapter:0},
  {label:tx(l,'La decisión','The decision'),text:c.strategy,chapter:2},
  {label:tx(l,'El sistema','The system'),text:c.solution,chapter:3}
 ];
 const paths=projectSignature(p.slug);
 return <section className="bk-decision-study" id="decision-study" aria-labelledby="decision-study-title">
  <div className="bk-decision-heading"><h2 id="decision-study-title">{tx(l,'Del reto\nal sistema.','From challenge\nto system.')}</h2><p>{tx(l,'Tres perspectivas para entender qué se construyó y por qué.','Three perspectives on what was built and why.')}</p></div>
  <div className="bk-decision-layout">
   <figure className="bk-decision-figure" data-phase={active}>
    <svg viewBox="0 0 500 300" fill="none" aria-hidden="true" focusable="false">
     <g className="bk-study-grid"><path d="M40 30v240M280 30v240M480 30v240M20 40h460M20 143h460M20 260h460"/></g>

     {paths.map((d,i)=><path key={i} d={d} className={'bk-study-trace'+(active===i?' is-active':'')}/>)}
     <circle className="bk-study-core-ring" cx="280" cy="143" r="16"/><circle className="bk-study-core" cx="280" cy="143" r="7"/>
     <g className="bk-study-register"><path d="M20 40V20h20M460 20h20v20M20 260v20h20M460 280h20v-20M267 143h26M280 130v26"/></g>
     <text x="25" y="294">{p.slug.toUpperCase()}</text><text x="448" y="294">{String(active+1).padStart(2,'0')}/03</text>
    </svg>
    <figcaption><span className="bk-study-phase-label">{String(active+1).padStart(2,'0')} / {steps[active]?.label}</span>{tx(l,'Esquema editorial del caso. No representa telemetría ni una simulación física.','Editorial study of the case. Not telemetry or a physics simulation.')}</figcaption>
   </figure>
   <div className="bk-decision-steps">
    {steps.map((step,i)=><details key={i} open={active===i}>
     <summary onClick={e=>{e.preventDefault();select(i);}}><span className="bk-study-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{step.label}<Icon name="plus"/></summary>
     <div className="bk-decision-copy"><p>{step.text}</p><a href={'#chapter-'+step.chapter}>{tx(l,'Leer en contexto','Read in context')}<Icon name="right"/></a></div>
    </details>)}
    <a className="bk-decision-contact" href={briefPath(l,[p.slug])}>{tx(l,'Hablemos de un reto similar','Let’s discuss a similar challenge')}<Icon/></a>
   </div>
  </div>
 </section>;
}

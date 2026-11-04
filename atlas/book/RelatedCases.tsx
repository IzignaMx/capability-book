import {relatedCases} from './reading';
import {projects,pathFor,type Project,type Locale} from './model';
import {Card,Icon,tx} from './Chrome';
import {TrajectoryMark} from './art/TrajectoryMark';
export function RelatedCases({project,locale:l}:{project:Project;locale:Locale}){
 const related=relatedCases(project.slug);
 return <section className="bk-related-cases" aria-labelledby="related-cases-title">
  <div className="bk-related-heading"><div className="bk-section-heading"><p className="bk-kicker">{tx(l,'CONEXIONES ENTRE PROYECTOS','CONNECTIONS BETWEEN PROJECTS')}</p><h2 id="related-cases-title">{tx(l,'Otra perspectiva.\nCapacidades en común.','Another perspective.\nShared capabilities.')}</h2><p>{tx(l,'Casos relacionados por sus capacidades y áreas de trabajo. No es una clasificación de resultados.','Cases connected by capabilities and areas of work. Not a ranking of results.')}</p></div><TrajectoryMark slug={project.slug} activePath={2} compact className="bk-related-signature"/></div>
  <div className="bk-related-grid">{related.map(p=><div key={p.slug}><Card project={p} locale={l} index={projects.indexOf(p)}/><a className="bk-related-compare" href={pathFor(l,'compare')+'?projects='+project.slug+','+p.slug}><Icon name="compare"/>{tx(l,'Comparar estos dos casos','Compare these two cases')}<Icon name="right"/></a></div>)}</div>
 </section>;
}

import {projects,projectCategories,pathFor,type Project,type Locale} from './model';
import {Card,Icon,tx} from './Chrome';
import './games.css';
export function GameLink({project:p,locale:l}:{project:Project;locale:Locale}){
 if(!projectCategories(p).includes('games'))return null;
 const live=p.sources.find(s=>s.id==='live')?.url;
 if(!live||!p.links.some(link=>link.public&&link.url===live))return null;
 return <a className="bk-play-link" href={live} target="_blank" rel="noopener noreferrer" aria-label={tx(l,`Jugar ${p.es.title} en otra pestaña`,`Play ${p.en.title} in a new tab`)}><Icon name="play"/><span>{tx(l,'Jugar ','Play ')+p[l].title}</span><Icon name="external"/></a>;
}
export function GameShelf({locale:l}:{locale:Locale}){
 const games=projects.filter(p=>projectCategories(p).includes('games'));
 if(!games.length)return null;
 return <section className="bk-game-shelf" aria-labelledby="book-games-title">
  <div className="bk-section-heading"><p className="bk-kicker">{tx(l,'MUNDOS QUE SE JUEGAN','WORLDS YOU CAN PLAY')}</p><h2 id="book-games-title">{tx(l,'De explorar una ciudad\na regenerar una órbita.','From exploring a city\nto restoring an orbit.')}</h2><p className="bk-game-intro">{tx(l,'Dos experiencias originales de navegador. Capturas de partidas reales, decisiones de diseño y acceso a sus versiones jugables.','Two original browser experiences. Actual gameplay captures, design decisions and access to their playable releases.')}</p><a href={pathFor(l,'projects')+'?category=games'}>{tx(l,'Explorar los juegos','Explore the games')}<Icon name="right"/></a></div>
  <div className="bk-games-grid">{games.map(p=><div key={p.slug}><Card project={p} locale={l} index={projects.indexOf(p)}/><GameLink project={p} locale={l}/></div>)}</div>
 </section>;
}

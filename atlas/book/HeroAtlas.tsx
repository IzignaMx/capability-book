import { ReadingFolio } from './ReadingFolio';
import { projects, type Project } from './model';
import { projectSignature } from './art/trajectories';
import './hero-atlas.css';

// Registration points belong to the editorial plate, not to a measured graph.
const stations = [[64, 99], [235, 35], [462, 76], [556, 228], [466, 386], [265, 431], [70, 365], [29, 231]] as const;

/** One original folio, with the selected case drawn through its eight-leaf register.
 * The native selector owns the state; this complete decorative plane takes no input. */
export function HeroAtlas({ project }: { project: Project }) {
  const signature = projectSignature(project.slug);
  const [joiningX, joiningY] = signature[0].trim().split(/[\s,]+/).slice(-2).map(Number);
  return <div className="bk-hero-plate" aria-hidden="true">
    <svg className="bk-hero-register" viewBox="0 0 600 460" fill="none" focusable="false">
      <g className="bk-hero-guides">
        <path d="M14 48V20h28M558 20h28v28M14 412v28h28M558 440h28v-28" />
        <path d="M64 99Q220-24 462 76T466 386Q285 472 70 365T64 99" />
        <path d="M29 231H570M298 26v410" className="bk-hero-axis" />
      </g>
      {projects.map((item, index) => {
        const [x, y] = stations[index]!;
        const active = item.slug === project.slug;
        return <g key={item.slug} className="bk-hero-station" data-hero-station={item.slug} data-active={active}>
          <path className="bk-hero-tether" d={`M${x} ${y}Q${(x + 300) / 2} ${(y + 230) / 2 - 30} 300 230`} />
          <path className="bk-hero-tick" d={`M${x - 6} ${y}h12M${x} ${y - 6}v12`} />
          <circle cx={x} cy={y} r={active ? 5 : 2.5} />
          <text x={x} y={y - 15} textAnchor="middle">{String(index + 1).padStart(2, '0')}</text>
        </g>;
      })}
    </svg>
    <ReadingFolio phase="matter" nextPhase="trajectory" className="bk-atlas-sculpture bk-hero-folio" eager entry />
    <svg className="bk-hero-drawing" viewBox="0 0 600 460" fill="none" focusable="false">
      <g key={project.slug} className="bk-hero-trajectory" data-project={project.slug} transform="translate(10 80) scale(1.15 1)">
        {signature.map((path, index) => <path key={index} d={path} pathLength="1" />)}
        <circle className="bk-hero-joining-point" cx={joiningX} cy={joiningY} r="4" />
      </g>
    </svg>
  </div>;
}

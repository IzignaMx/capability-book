import { projectSignature } from './trajectories';
import './atlas-art.css';

type TrajectoryMarkProps = { slug: string; activePath?: number; compact?: boolean; className?: string };

export function TrajectoryMark({ slug, activePath, compact = false, className = '' }: TrajectoryMarkProps) {
  return <svg className={`bk-trajectory-mark${compact ? ' is-compact' : ''} ${className}`.trim()}
    viewBox="0 0 500 300" fill="none" aria-hidden="true" focusable="false" data-project={slug}>
    {!compact && <g className="bk-trajectory-register"><path d="M20 40V20h20M460 20h20v20M20 260v20h20M460 280h20v-20" /></g>}
    {projectSignature(slug).map((d, index) => <path key={index} d={d}
      className={`bk-trajectory-path${activePath === index ? ' is-active' : ''}`} />)}
    <circle className="bk-trajectory-origin" cx="280" cy="143" r={compact ? 5 : 7} />
  </svg>;
}

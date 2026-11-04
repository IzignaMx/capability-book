import { FolioArt } from './art/FolioArt';
import type { AtlasPhaseName } from './art/trajectories';

/** Two reviewed poses share one decorative plane. CSS uses local reading progress;
 *  the first pose is complete when scripting, observers or motion are unavailable. */
export function ReadingFolio({ phase, nextPhase, className = '', eager = false }: {
  phase: AtlasPhaseName;
  nextPhase: AtlasPhaseName;
  className?: string;
  eager?: boolean;
}) {
  return <div className={`bk-reading-folio ${className}`.trim()} data-atlas-surface="" data-reading-from={phase}
    data-reading-to={nextPhase} aria-hidden="true">
    <FolioArt phase={phase} className="bk-reading-pose bk-reading-origin" eager={eager} />
    <FolioArt phase={nextPhase} className="bk-reading-pose bk-reading-destination" />
  </div>;
}

import { useState } from 'react';
import type { AtlasPhaseName } from './trajectories';
import './atlas-art.css';

type FolioArtProps = { phase: AtlasPhaseName; className?: string; eager?: boolean };

/** An independent decorative layer: failed artwork never changes the native document. */
export function FolioArt({ phase, className = '', eager = false }: FolioArtProps) {
  const [failedPhase, setFailedPhase] = useState<AtlasPhaseName | null>(null);
  const base = `/art/folio/${phase}`;
  return <picture className={`bk-folio-art ${className}`.trim()} aria-hidden="true"
    data-folio-phase={phase} hidden={failedPhase === phase}>
    <source media="(max-width: 600px)" type="image/avif" srcSet={`${base}-mobile.avif`} width="800" height="1000" />
    <source media="(max-width: 600px)" type="image/webp" srcSet={`${base}-mobile.webp`} width="800" height="1000" />
    <source type="image/avif" srcSet={`${base}-desktop.avif`} width="1600" height="1100" />
    <img src={`${base}-desktop.webp`} width="1600" height="1100" alt=""
      loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async"
      onError={() => setFailedPhase(phase)} />
  </picture>;
}

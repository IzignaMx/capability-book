import type { ProjectMediaVariant, ProjectVisualEvidence } from "./PortfolioProject";

/** Minimal shape the resolver needs — PortfolioProject satisfies it. */
export interface ProjectVisualSource {
  slug: string;
  locale: "es" | "en";
  title: string;
  fallbackPoster: string;
  visualEvidence: ProjectVisualEvidence[];
}

/**
 * Shared visual presentation resolver (ADR: unified-project-covers).
 *
 * Pure TypeScript — no Astro imports, no DOM, no I/O. Used by both the Astro
 * renderer (ProjectCover.astro) and the React renderer (ProjectCatalog.tsx)
 * so Explore and Evaluate always resolve the same canonical asset per context.
 */

export type ProjectCoverContext =
  | "catalog-cover"
  | "explore-encounter"
  | "case-study-cover"
  | "full-evidence";

export type SourceKind = "evidence" | "fallback" | "placeholder";

export type EvidenceStateKind =
  | "direct-production-capture"
  | "local-development-capture"
  | "deterministic-reconstruction"
  | "illustrative";

export type ObjectFit = "cover" | "contain";

export type LoadingPriority = "eager" | "lazy";

export interface ResolvedVisualSource {
  /** Primary src (img src). */
  src: string;
  /** AVIF candidate (source type image/avif) when available. */
  avif?: string;
  /** WebP candidate (source type image/webp) when available. */
  webp?: string;
  width: number;
  height: number;
}

export interface ResolvedProjectVisual {
  context: ProjectCoverContext;
  sourceKind: SourceKind;
  /** Canonical desktop source — always landscape (8:5) for cover contexts. */
  desktop: ResolvedVisualSource;
  /**
   * Mobile source. `null` for cover contexts (landscape desktop capture is
   * used at every breakpoint). Only full-evidence may carry the vertical
   * mobile variant, shown without destructive crop.
   */
  mobile: ResolvedVisualSource | null;
  alt: string;
  caption: string;
  stateKind: EvidenceStateKind;
  aspectRatio: string;
  objectFit: ObjectFit;
  objectPosition: string;
  loading: LoadingPriority;
  fetchPriority?: "high" | "auto";
}

export interface ResolveVisualOptions {
  loading?: LoadingPriority;
  fetchPriority?: "high" | "auto";
}

/**
 * Optional per-project cover metadata (rule 5). Only used when needed —
 * the map is empty by default. Covers stay canonical 8:5 otherwise.
 */
export interface ProjectCoverOverrides {
  objectPosition?: string;
  fit?: ObjectFit;
  /** Valid CSS background for the cover frame (e.g. "linear-gradient(...)"). */
  background?: string;
}

export const COVER_ASPECT_RATIO = "8 / 5";
export const COVER_WIDTH = 1440;
export const COVER_HEIGHT = 900;

const FALLBACK_POSTER_WIDTH = 1280;
const FALLBACK_POSTER_HEIGHT = 720;

/** Derivative generated from poster.avif (16:9 → 8:5) by scripts/generate-cover-derivatives.ts */
export const FALLBACK_COVER_WIDTH = 1280;
export const FALLBACK_COVER_HEIGHT = 800;

/** Derivative generated from poster.avif (16:9 → 8:5) by scripts/generate-cover-derivatives.ts */
export const FALLBACK_COVER_AVIF = (slug: string): string =>
  `/media/projects/${slug}/poster-cover.avif`;
export const FALLBACK_COVER_WEBP = (slug: string): string =>
  `/media/projects/${slug}/poster-cover.webp`;

const fallbackAlt = (locale: "es" | "en", title: string, context: ProjectCoverContext): string =>
  context === "case-study-cover"
    ? locale === "es"
      ? `Visual ilustrativo de apertura del proyecto ${title}`
      : `Illustrative opening visual for the ${title} project`
    : context === "explore-encounter"
      ? locale === "es"
        ? `Vista visual de respaldo para ${title}`
        : `Fallback visual for ${title}`
      : locale === "es"
        ? `Portada ilustrativa de ${title}`
        : `Illustrative cover for ${title}`;

const fallbackCaption = (
  locale: "es" | "en",
  context: ProjectCoverContext,
): string => {
  if (context === "case-study-cover") {
    return locale === "es"
      ? "Portada ilustrativa · sin captura pública autorizada"
      : "Illustrative cover · no authorized public capture";
  }
  if (context === "explore-encounter") {
    return locale === "es"
      ? "Portada ilustrativa · visual de respaldo"
      : "Illustrative cover · fallback visual";
  }
  return "";
};

const evidenceCaption = (
  locale: "es" | "en",
  kind: EvidenceStateKind,
  evidenceCaptionText: string,
): string => {
  const state =
    kind === "direct-production-capture"
      ? locale === "es"
        ? "Captura directa de producción"
        : "Direct production capture"
      : kind === "local-development-capture"
        ? locale === "es"
          ? "Captura local autorizada"
          : "Authorized local capture"
        : locale === "es"
          ? "Reconstrucción determinista"
          : "Deterministic reconstruction";
  return `${evidenceCaptionText} · ${state}`;
};

/**
 * Resolves the canonical visual for a project in a given presentation
 * context. Hierarchy (rule 6): approved visualEvidence[0] → approved
 * fallback poster → explicit dev placeholder (never invented evidence).
 */
export function resolveProjectVisual(
  project: ProjectVisualSource,
  context: ProjectCoverContext,
  options: ResolveVisualOptions = {},
  overrides: ProjectCoverOverrides = {},
): ResolvedProjectVisual {
  const { locale, slug, title } = project;
  const evidence = project.visualEvidence.at(0);

  const loading = options.loading ?? (context === "case-study-cover" ? "eager" : "lazy");
  const fetchPriority =
    options.fetchPriority ?? (context === "case-study-cover" ? "high" : "auto");

  if (evidence) {
    const desktop = evidence.variants.desktop;
    const isCoverContext = context !== "full-evidence";

    if (isCoverContext) {
      // Rule 4: never use the vertical mobile variant inside a landscape cover.
      return {
        context,
        sourceKind: "evidence",
        desktop: toSource(desktop),
        mobile: null,
        alt: evidence.alt,
        caption: evidenceCaption(locale, evidence.provenance.kind, evidence.caption),
        stateKind: evidence.provenance.kind,
        aspectRatio: COVER_ASPECT_RATIO,
        objectFit: overrides.fit ?? "cover",
        objectPosition: overrides.objectPosition ?? "top center",
        loading,
        fetchPriority,
      };
    }

    return {
      context,
      sourceKind: "evidence",
      desktop: toSource(desktop),
      mobile: toSource(evidence.variants.mobile),
      alt: evidence.alt,
      caption: evidenceCaption(locale, evidence.provenance.kind, evidence.caption),
      stateKind: evidence.provenance.kind,
      aspectRatio: `${evidence.variants.mobile.width} / ${evidence.variants.mobile.height}`,
      objectFit: overrides.fit ?? "cover",
      objectPosition: overrides.objectPosition ?? "top center",
      loading,
      fetchPriority,
    };
  }

  const isCoverContext = context !== "full-evidence";
  if (isCoverContext) {
    // Approved fallback poster, 8:5 derivative generated by the covers script.
    return {
      context,
      sourceKind: "fallback",
      desktop: {
        src: FALLBACK_COVER_AVIF(slug),
        avif: FALLBACK_COVER_AVIF(slug),
        webp: FALLBACK_COVER_WEBP(slug),
        width: FALLBACK_COVER_WIDTH,
        height: FALLBACK_COVER_HEIGHT,
      },
      mobile: null,
      alt: fallbackAlt(locale, title, context),
      caption: fallbackCaption(locale, context),
      stateKind: "illustrative",
      aspectRatio: COVER_ASPECT_RATIO,
      objectFit: overrides.fit ?? "cover",
      objectPosition: overrides.objectPosition ?? "center",
      loading,
      fetchPriority,
    };
  }

  // full-evidence without approved evidence: fall back to the approved poster.
  return {
    context,
    sourceKind: "fallback",
    desktop: {
      src: project.fallbackPoster,
      width: FALLBACK_POSTER_WIDTH,
      height: FALLBACK_POSTER_HEIGHT,
    },
    mobile: null,
    alt: fallbackAlt(locale, title, context),
    caption: fallbackCaption(locale, context),
    stateKind: "illustrative",
    aspectRatio: "16 / 9",
    objectFit: overrides.fit ?? "cover",
    objectPosition: overrides.objectPosition ?? "center",
    loading,
    fetchPriority,
  };
}

function toSource(variant: ProjectMediaVariant): ResolvedVisualSource {
  return {
    src: variant.webp,
    avif: variant.avif,
    webp: variant.webp,
    width: variant.width,
    height: variant.height,
  };
}

/** Deterministic canonical asset check for tests (rule 9). */
export function canonicalCoverKey(project: ProjectVisualSource, context: ProjectCoverContext): string {
  const v = resolveProjectVisual(project, context);
  return `${v.sourceKind}:${v.desktop.src}:${v.aspectRatio.replace(/\s/g, "")}`;
}

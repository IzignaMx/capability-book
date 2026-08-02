export type Locale = "es" | "en";
export type ProjectClassification = "real" | "open-source" | "internal" | "concept";
export type OutcomeKind =
  | "verified-result"
  | "system-metric"
  | "expected-outcome"
  | "demonstrated-capability";

export interface ProofPoint {
  kind: OutcomeKind;
  label: string;
  value?: string;
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface ProjectMediaVariant {
  avif: string;
  webp: string;
  width: number;
  height: number;
  avifSha256: string;
  webpSha256: string;
}

export interface ProjectVisualEvidence {
  id: string;
  role: "screenshot";
  path: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  license: "owned" | "client-authorized" | "open-license";
  variants: {
    mobile: ProjectMediaVariant;
    desktop: ProjectMediaVariant;
  };
  provenance: {
    kind: "deterministic-reconstruction" | "direct-production-capture";
    repository: string;
    commit: string;
    sourceUrl: string;
    capturedAt: string;
    rightsBasis: string;
    approvedBy: "IzignaMx";
    reviewedAt: string;
  };
}

export interface PortfolioProject {
  slug: string;
  locale: Locale;
  classification: ProjectClassification;
  title: string;
  elevatorPitch: string;
  challenge: string;
  constraints: string[];
  strategy: string;
  solution: string;
  capabilities: string[];
  industries: string[];
  technologies: string[];
  outcomes: ProofPoint[];
  liveUrl?: string;
  sourceUrl?: string;
  fallbackPoster: string;
  visualEvidence: ProjectVisualEvidence[];
  confidentiality: "public" | "partial" | "private";
  accessibilityNotes: string[];
  relatedServices: string[];
  ctaPreset: string;
}

export interface ProjectQuery {
  locale: Locale;
  capabilities?: string[];
  industries?: string[];
  technologies?: string[];
  classification?: ProjectClassification[];
  text?: string;
}

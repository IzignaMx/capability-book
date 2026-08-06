import type { ProjectCoverOverrides } from "./projectVisualResolver";

/**
 * Optional per-project cover metadata (rule 5). Empty by default — only add
 * an entry when a project genuinely needs a different object-position, fit,
 * or frame background. Kept out of the content schema on purpose.
 */
export const COVER_VISUAL_OVERRIDES: Partial<Record<string, ProjectCoverOverrides>> = {};

export function coverOverridesFor(slug: string): ProjectCoverOverrides {
  return COVER_VISUAL_OVERRIDES[slug] ?? {};
}
import type { Locale } from "../../domain/projects/PortfolioProject";

export interface LeadContext {
  sourceRoute: string;
  sourceProject?: string;
  sourceCapability?: string;
  sourceConcept?: string;
  selectedServices: string[];
  locale: Locale;
  campaign?: Record<string, string>;
}

const SAFE_SLUG = /^[a-z0-9-]{1,80}$/;
const SAFE_CAMPAIGN_KEY = /^utm_[a-z0-9_]{1,60}$/i;
const SAFE_CAMPAIGN_VALUE = /^[a-zA-Z0-9._-]{1,100}$/;

function safeSlug(value: string | null): string | undefined {
  if (!value || !SAFE_SLUG.test(value)) return undefined;
  return value;
}

function campaignFrom(url: URL): Record<string, string> | undefined {
  const campaign = Object.fromEntries(
    [...url.searchParams].filter(
      ([key, value]) => SAFE_CAMPAIGN_KEY.test(key) && SAFE_CAMPAIGN_VALUE.test(value)
    )
  );

  if (Object.keys(campaign).length === 0) return undefined;
  return campaign;
}

export function parseLeadContext(url: URL, locale: Locale): LeadContext {
  const sourceProject = safeSlug(url.searchParams.get("project"));
  const sourceCapability = safeSlug(url.searchParams.get("capability"));
  const sourceConcept = safeSlug(url.searchParams.get("concept"));
  const selectedService = safeSlug(url.searchParams.get("service"));
  const campaign = campaignFrom(url);

  return {
    sourceRoute: url.pathname,
    ...(sourceProject ? { sourceProject } : {}),
    ...(sourceCapability ? { sourceCapability } : {}),
    ...(sourceConcept ? { sourceConcept } : {}),
    selectedServices: selectedService ? [selectedService] : [],
    locale,
    ...(campaign ? { campaign } : {})
  };
}

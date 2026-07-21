import { useEffect, useState } from "react";
import type { Locale } from "../../domain/projects/PortfolioProject";
import { parseLeadContext } from "../../features/diagnostic/LeadContext";
import type { LeadContext } from "../../features/diagnostic/LeadContext";
import { DiagnosticWizard } from "./DiagnosticWizard";

interface ContextualDiagnosticWizardProps {
  locale: Locale;
  submissionEndpoint?: string;
  fallbackHref: string;
  privacyHref: string;
}

const diagnosticPath: Record<Locale, string> = {
  es: "/es/diagnostico/",
  en: "/en/diagnostic/"
};

export function diagnosticRouteContext(url: URL, locale: Locale): LeadContext {
  return {
    ...parseLeadContext(url, locale),
    sourceRoute: diagnosticPath[locale]
  };
}

function initialContext(locale: Locale): LeadContext {
  return diagnosticRouteContext(
    new URL(diagnosticPath[locale], "https://book.izignamx.com"),
    locale
  );
}

export function ContextualDiagnosticWizard({
  locale,
  submissionEndpoint,
  fallbackHref,
  privacyHref
}: ContextualDiagnosticWizardProps) {
  const [context, setContext] = useState<LeadContext>(() => initialContext(locale));

  useEffect(() => {
    setContext(diagnosticRouteContext(new URL(window.location.href), locale));
  }, [locale]);

  return (
    <DiagnosticWizard
      locale={locale}
      context={context}
      fallbackHref={fallbackHref}
      privacyHref={privacyHref}
      {...(submissionEndpoint ? { submissionEndpoint } : {})}
    />
  );
}

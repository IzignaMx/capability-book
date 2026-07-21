import { useEffect, useId, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import type { Locale } from "../../domain/projects/PortfolioProject";
import type { LeadContext } from "../../features/diagnostic/LeadContext";
import "./DiagnosticWizard.scss";

interface DiagnosticDraft {
  name: string;
  contactMethod: string;
  organization: string;
  request: string;
  currentUrl: string;
  timing: string;
  budgetRange: string;
  integrations: string;
  references: string;
  consent: boolean;
}

interface DiagnosticSubmission {
  name: string;
  contactMethod: string;
  organization: string;
  request: string;
  currentUrl?: string;
  timing?: string;
  budgetRange?: string;
  integrations?: string;
  references?: string;
  context: LeadContext;
  consent: true;
  website: "";
}

interface DiagnosticWizardProps {
  locale: Locale;
  context: LeadContext;
  submissionEndpoint?: string;
  fallbackHref: string;
  privacyHref: string;
}

type SubmissionState = "idle" | "submitting" | "failed" | "succeeded";
type DraftField = Exclude<keyof DiagnosticDraft, "consent">;

const emptyDraft: DiagnosticDraft = {
  name: "",
  contactMethod: "",
  organization: "",
  request: "",
  currentUrl: "",
  timing: "",
  budgetRange: "",
  integrations: "",
  references: "",
  consent: false
};

const copy = {
  es: {
    heading: "Cuéntanos qué necesitas construir",
    intro: "Comparte el contexto esencial. Conservaremos un borrador solo en esta pestaña hasta entregarlo.",
    name: "Nombre",
    contact: "Correo o medio de contacto",
    organization: "Organización o proyecto",
    request: "¿Qué quieres construir o mejorar?",
    optional: "Añadir contexto opcional",
    currentUrl: "URL actual",
    timing: "Momento ideal",
    timingOptions: ["Este mes", "Este trimestre", "Más adelante"],
    budget: "Rango de inversión",
    budgetOptions: ["Por definir", "Menos de $100,000 MXN", "$100,000–$300,000 MXN", "Más de $300,000 MXN"],
    integrations: "Integraciones necesarias",
    references: "Proyectos de referencia",
    consentPrefix: "Acepto el ",
    consentLink: "aviso de privacidad",
    submit: "Enviar diagnóstico",
    retry: "Reintentar envío",
    sending: "Enviando…",
    unavailableButton: "Envío no disponible",
    unavailable: "El envío directo aún no está configurado. Tu información no ha salido de este navegador.",
    failed: "No pudimos entregar tu solicitud. Conservamos el borrador en esta pestaña para que puedas reintentar.",
    succeeded: "Solicitud entregada. Te contactaremos con los siguientes pasos.",
    fallback: "Contactar por correo"
  },
  en: {
    heading: "Tell us what you need to build",
    intro: "Share the essential context. We will keep a draft in this tab only until it is delivered.",
    name: "Name",
    contact: "Email or preferred contact method",
    organization: "Organization or project",
    request: "What do you want to build or improve?",
    optional: "Add optional context",
    currentUrl: "Current URL",
    timing: "Ideal timing",
    timingOptions: ["This month", "This quarter", "Later"],
    budget: "Investment range",
    budgetOptions: ["To be defined", "Under MXN 100,000", "MXN 100,000–300,000", "Over MXN 300,000"],
    integrations: "Required integrations",
    references: "Reference projects",
    consentPrefix: "I accept the ",
    consentLink: "privacy notice",
    submit: "Send diagnostic request",
    retry: "Retry delivery",
    sending: "Sending…",
    unavailableButton: "Delivery unavailable",
    unavailable: "Direct delivery is not configured yet. Your information has not left this browser.",
    failed: "We could not deliver your request. The draft remains in this tab so you can retry.",
    succeeded: "Request delivered. We will contact you with the next steps.",
    fallback: "Contact us by email"
  }
} as const;

function storageKey(locale: Locale): string {
  return `izignamx:diagnostic-draft:${locale}`;
}

function isDiagnosticDraft(value: unknown): value is DiagnosticDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const stringFields: DraftField[] = [
    "name",
    "contactMethod",
    "organization",
    "request",
    "currentUrl",
    "timing",
    "budgetRange",
    "integrations",
    "references"
  ];

  return (
    stringFields.every((field) => typeof candidate[field] === "string") &&
    typeof candidate.consent === "boolean"
  );
}

function restoreDraft(locale: Locale): DiagnosticDraft {
  try {
    const stored = window.sessionStorage.getItem(storageKey(locale));
    if (!stored) return emptyDraft;
    const parsed: unknown = JSON.parse(stored);
    return isDiagnosticDraft(parsed) ? parsed : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

function isHttpsEndpoint(value: string | undefined): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function submissionFrom(draft: DiagnosticDraft, context: LeadContext): DiagnosticSubmission {
  const currentUrl = optionalValue(draft.currentUrl);
  const timing = optionalValue(draft.timing);
  const budgetRange = optionalValue(draft.budgetRange);
  const integrations = optionalValue(draft.integrations);
  const references = optionalValue(draft.references);

  return {
    name: draft.name.trim(),
    contactMethod: draft.contactMethod.trim(),
    organization: draft.organization.trim(),
    request: draft.request.trim(),
    ...(currentUrl ? { currentUrl } : {}),
    ...(timing ? { timing } : {}),
    ...(budgetRange ? { budgetRange } : {}),
    ...(integrations ? { integrations } : {}),
    ...(references ? { references } : {}),
    context,
    consent: true,
    website: ""
  };
}

export function DiagnosticWizard({
  locale,
  context,
  submissionEndpoint,
  fallbackHref,
  privacyHref
}: DiagnosticWizardProps) {
  const labels = copy[locale];
  const [draft, setDraft] = useState<DiagnosticDraft>(emptyDraft);
  const [isRestored, setIsRestored] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const shouldPersistRef = useRef(true);
  const fieldPrefix = useId();
  const canSubmit = isHttpsEndpoint(submissionEndpoint);

  useEffect(() => {
    setDraft(restoreDraft(locale));
    setIsRestored(true);
    nameRef.current?.focus();
  }, [locale]);

  useEffect(() => {
    if (!isRestored || !shouldPersistRef.current) return;
    try {
      window.sessionStorage.setItem(storageKey(locale), JSON.stringify(draft));
    } catch {
      // Storage may be unavailable; the form remains fully usable in memory.
    }
  }, [draft, isRestored, locale]);

  function updateField(field: DraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isSubmittingRef.current || !draft.consent) return;

    isSubmittingRef.current = true;
    setSubmissionState("submitting");

    try {
      const response = await fetch(submissionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionFrom(draft, context))
      });
      if (!response.ok) throw new Error("Diagnostic delivery failed");

      shouldPersistRef.current = false;
      window.sessionStorage.removeItem(storageKey(locale));
      setDraft(emptyDraft);
      setSubmissionState("succeeded");
    } catch {
      setSubmissionState("failed");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  const statusMessage = submissionState === "succeeded" ? labels.succeeded : "";
  const errorMessage = !canSubmit
    ? labels.unavailable
    : submissionState === "failed"
      ? labels.failed
      : "";
  const buttonLabel = !canSubmit
    ? labels.unavailableButton
    : submissionState === "submitting"
      ? labels.sending
      : submissionState === "failed"
        ? labels.retry
        : labels.submit;

  return (
    <section className="diagnostic-wizard" aria-labelledby={`${fieldPrefix}-heading`}>
      <div className="diagnostic-wizard__intro">
        <p className="diagnostic-wizard__eyebrow">IzignaMx · Evaluate</p>
        <h1 id={`${fieldPrefix}-heading`}>{labels.heading}</h1>
        <p>{labels.intro}</p>
      </div>

      <form onSubmit={submit} className="diagnostic-wizard__form">
        <label htmlFor={`${fieldPrefix}-name`}>
          {labels.name}
          <input
            ref={nameRef}
            id={`${fieldPrefix}-name`}
            name="name"
            value={draft.name}
            onChange={(event) => updateField("name", event.currentTarget.value)}
            autoComplete="name"
            required
          />
        </label>

        <label htmlFor={`${fieldPrefix}-contact`}>
          {labels.contact}
          <input
            id={`${fieldPrefix}-contact`}
            name="contactMethod"
            value={draft.contactMethod}
            onChange={(event) => updateField("contactMethod", event.currentTarget.value)}
            autoComplete="email"
            required
          />
        </label>

        <label htmlFor={`${fieldPrefix}-organization`}>
          {labels.organization}
          <input
            id={`${fieldPrefix}-organization`}
            name="organization"
            value={draft.organization}
            onChange={(event) => updateField("organization", event.currentTarget.value)}
            autoComplete="organization"
            required
          />
        </label>

        <label htmlFor={`${fieldPrefix}-request`}>
          {labels.request}
          <textarea
            id={`${fieldPrefix}-request`}
            name="request"
            value={draft.request}
            onChange={(event) => updateField("request", event.currentTarget.value)}
            rows={5}
            required
          />
        </label>

        <details className="diagnostic-wizard__optional">
          <summary>{labels.optional}</summary>
          <div className="diagnostic-wizard__optional-grid">
            <label htmlFor={`${fieldPrefix}-url`}>
              {labels.currentUrl}
              <input
                id={`${fieldPrefix}-url`}
                name="currentUrl"
                type="url"
                value={draft.currentUrl}
                onChange={(event) => updateField("currentUrl", event.currentTarget.value)}
                autoComplete="url"
              />
            </label>

            <label htmlFor={`${fieldPrefix}-timing`}>
              {labels.timing}
              <select
                id={`${fieldPrefix}-timing`}
                name="timing"
                value={draft.timing}
                onChange={(event) => updateField("timing", event.currentTarget.value)}
              >
                <option value="">—</option>
                {labels.timingOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label htmlFor={`${fieldPrefix}-budget`}>
              {labels.budget}
              <select
                id={`${fieldPrefix}-budget`}
                name="budgetRange"
                value={draft.budgetRange}
                onChange={(event) => updateField("budgetRange", event.currentTarget.value)}
              >
                <option value="">—</option>
                {labels.budgetOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label htmlFor={`${fieldPrefix}-integrations`}>
              {labels.integrations}
              <textarea
                id={`${fieldPrefix}-integrations`}
                name="integrations"
                value={draft.integrations}
                onChange={(event) => updateField("integrations", event.currentTarget.value)}
                rows={3}
              />
            </label>

            <label htmlFor={`${fieldPrefix}-references`}>
              {labels.references}
              <textarea
                id={`${fieldPrefix}-references`}
                name="references"
                value={draft.references}
                onChange={(event) => updateField("references", event.currentTarget.value)}
                rows={3}
              />
            </label>
          </div>
        </details>

        <input className="diagnostic-wizard__honeypot" name="website" tabIndex={-1} autoComplete="off" />

        <label className="diagnostic-wizard__consent" htmlFor={`${fieldPrefix}-consent`}>
          <input
            id={`${fieldPrefix}-consent`}
            name="consent"
            type="checkbox"
            checked={draft.consent}
            onChange={(event) => {
              const consent = event.currentTarget.checked;
              setDraft((current) => ({ ...current, consent }));
            }}
            required
          />
          <span>
            {labels.consentPrefix}
            <a href={privacyHref}>{labels.consentLink}</a>.
          </span>
        </label>

        <div className="diagnostic-wizard__actions">
          <button type="submit" disabled={!canSubmit || submissionState === "submitting"}>
            {buttonLabel}
          </button>
          <a href={fallbackHref}>{labels.fallback}</a>
        </div>

        <p className="diagnostic-wizard__status" role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
        <p className="diagnostic-wizard__error" role="alert" aria-atomic="true">
          {errorMessage}
        </p>
      </form>
    </section>
  );
}

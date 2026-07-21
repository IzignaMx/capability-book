import type { LeadContext } from "./LeadContext";

export interface DiagnosticSubmission {
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

type DiagnosticRequest = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class DiagnosticTransportConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnosticTransportConfigurationError";
  }
}

export class DiagnosticDeliveryError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Diagnostic delivery failed with HTTP ${status}`);
    this.name = "DiagnosticDeliveryError";
    this.status = status;
  }
}

export function parseDiagnosticEndpoint(value: string | undefined): URL | undefined {
  if (!value) return undefined;

  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    throw new DiagnosticTransportConfigurationError(
      "Diagnostic submission endpoint must be an absolute HTTPS URL"
    );
  }

  if (endpoint.protocol !== "https:") {
    throw new DiagnosticTransportConfigurationError(
      "Diagnostic submission endpoint must use HTTPS"
    );
  }

  return endpoint;
}

export async function deliverDiagnosticSubmission(
  endpoint: URL,
  submission: DiagnosticSubmission,
  request: DiagnosticRequest = fetch
): Promise<void> {
  const response = await request(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(submission)
  });

  if (!response.ok) throw new DiagnosticDeliveryError(response.status);
}

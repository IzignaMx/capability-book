import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticWizard } from "../src/components/conversion/DiagnosticWizard";
import type { LeadContext } from "../src/features/diagnostic/LeadContext";

const context: LeadContext = {
  sourceRoute: "/es/diagnostico/",
  sourceProject: "omnisync",
  selectedServices: ["commerce"],
  locale: "es"
};

const storageKey = "izignamx:diagnostic-draft:es";

function renderWizard(submissionEndpoint = "https://forms.example.com/diagnostic") {
  return render(
    <DiagnosticWizard
      locale="es"
      context={context}
      submissionEndpoint={submissionEndpoint}
      fallbackHref="mailto:hola@izignamx.com"
      privacyHref="/es/privacidad/"
    />
  );
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Ada Lovelace");
  await user.type(
    screen.getByRole("textbox", { name: "Correo o medio de contacto" }),
    "ada@example.com"
  );
  await user.type(
    screen.getByRole("textbox", { name: "Organización o proyecto" }),
    "Analytical Engines"
  );
  await user.type(
    screen.getByRole("textbox", { name: "¿Qué quieres construir o mejorar?" }),
    "Una experiencia verificable"
  );
  await user.click(screen.getByRole("checkbox", { name: /Acepto el aviso de privacidad/i }));
}

describe("DiagnosticWizard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("focuses the first field after the wizard mounts", async () => {
    renderWizard();

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveFocus();
    });
  });

  it("uses native required validation before requesting delivery", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    renderWizard();

    await user.click(screen.getByRole("button", { name: "Enviar diagnóstico" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeInvalid();
  });

  it("restores a structurally valid unsent draft from session storage", async () => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        name: "Grace Hopper",
        contactMethod: "grace@example.com",
        organization: "Compiler Lab",
        request: "Clarificar una plataforma compleja",
        currentUrl: "https://example.com",
        timing: "Este trimestre",
        budgetRange: "Por definir",
        integrations: "CRM",
        references: "OmniSync",
        consent: true
      })
    );

    renderWizard();

    expect(await screen.findByDisplayValue("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Clarificar una plataforma compleja")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Acepto el aviso de privacidad/i })).toBeChecked();
  });

  it("preserves the draft after failure and retries only after a second submit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    renderWizard();
    await completeRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Enviar diagnóstico" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos entregar tu solicitud");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(sessionStorage.getItem(storageKey)).toContain("Ada Lovelace");

    await user.click(screen.getByRole("button", { name: "Reintentar envío" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Solicitud entregada");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  it("does not claim delivery when no static-compatible endpoint is configured", async () => {
    renderWizard("");

    expect(screen.getByRole("button", { name: "Envío no disponible" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("El envío directo aún no está configurado");
    expect(screen.getByRole("link", { name: "Contactar por correo" })).toHaveAttribute(
      "href",
      "mailto:hola@izignamx.com"
    );
  });
});

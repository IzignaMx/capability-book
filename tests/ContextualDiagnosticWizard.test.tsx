import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContextualDiagnosticWizard,
  diagnosticRouteContext
} from "../src/components/conversion/ContextualDiagnosticWizard";

describe("diagnosticRouteContext", () => {
  it("keeps approved runtime context and pins the localized source route", () => {
    const context = diagnosticRouteContext(
      new URL(
        "https://book.izignamx.com/unexpected/?project=omnisync&service=commerce&utm_source=portfolio&email=private%40example.com"
      ),
      "es"
    );

    expect(context).toEqual({
      sourceRoute: "/es/diagnostico/",
      sourceProject: "omnisync",
      selectedServices: ["commerce"],
      locale: "es",
      campaign: { utm_source: "portfolio" }
    });
    expect(JSON.stringify(context)).not.toContain("private@example.com");
  });
});

describe("ContextualDiagnosticWizard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/es/diagnostico/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("delivers the safe query context captured in the browser", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      "/es/diagnostico/?project=omnisync&service=commerce&utm_source=portfolio&name=private"
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }));

    render(
      <ContextualDiagnosticWizard
        locale="es"
        submissionEndpoint="https://forms.example.com/diagnostic"
        fallbackHref="mailto:hola@izignamx.com"
        privacyHref="/es/privacidad/"
      />
    );

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
    await user.click(screen.getByRole("button", { name: "Enviar diagnóstico" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1];
    const payload = JSON.parse(String(request?.body)) as { context: unknown };

    expect(payload.context).toEqual({
      sourceRoute: "/es/diagnostico/",
      sourceProject: "omnisync",
      selectedServices: ["commerce"],
      locale: "es",
      campaign: { utm_source: "portfolio" }
    });
    expect(JSON.stringify(payload.context)).not.toContain("private");
  });
});

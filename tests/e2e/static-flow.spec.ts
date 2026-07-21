import { expect, test } from "@playwright/test";

const endpoint = "https://forms.test/diagnostic";

test("completes the bilingual Evaluate and diagnostic flow without a keyboard trap", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let submission: unknown;
  await page.route(endpoint, async (route) => {
    submission = route.request().postDataJSON();
    await route.fulfill({ status: 204 });
  });

  await page.goto("/es/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect.poll(() => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  await page.getByRole("link", { name: "Evaluar", exact: true }).click();
  const catalogIsland = page.locator("astro-island").filter({
    has: page.getByRole("combobox", { name: "Capacidad" })
  });
  await expect.poll(() => catalogIsland.evaluate((element) => !element.hasAttribute("ssr"))).toBe(true);
  await page.getByRole("combobox", { name: "Capacidad" }).selectOption({ label: "Commerce Systems" });
  await expect(page.getByRole("status")).toContainText("2 proyectos");
  await page.getByRole("link", { name: /Abrir caso: OmniSync/ }).click();
  await page.getByRole("link", { name: "Solicitar diagnóstico para OmniSync" }).click();

  await expect(page).toHaveURL(/\/es\/diagnostico\/\?project=omnisync&service=/);
  await expect(page.locator("[data-diagnostic-context]")).toContainText("Proyecto relacionado: omnisync");

  await page.getByLabel("Nombre").fill("Ada Lovelace");
  await page.getByLabel("Correo o medio de contacto").fill("ada@example.com");
  await page.getByLabel("Organización o proyecto").fill("Analytical Engines");
  await page.getByLabel("¿Qué quieres construir o mejorar?").fill("Una experiencia de comercio accesible.");
  await page.getByRole("checkbox", { name: /Acepto el aviso de privacidad/ }).check();
  await page.getByRole("button", { name: "Enviar diagnóstico" }).click();

  await expect(page.getByRole("status")).toContainText("Solicitud entregada");
  expect(submission).toMatchObject({
    context: {
      locale: "es",
      sourceProject: "omnisync",
      sourceRoute: "/es/diagnostico/"
    }
  });

  await page.getByRole("link", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Tell us what you need to build" })).toBeVisible();

  await page.getByRole("link", { name: "IzignaMx home" }).focus();
  const tabSequence = [
    page.getByRole("link", { name: "Explore", exact: true }),
    page.getByRole("link", { name: "Evaluate", exact: true }),
    page.getByRole("link", { name: "Projects", exact: true }),
    page.getByRole("link", { name: "Request a diagnostic" }),
    page.getByRole("link", { name: "Español" }),
    page.getByLabel("Name"),
    page.getByLabel("Email or preferred contact method"),
    page.getByLabel("Organization or project"),
    page.getByLabel("What do you want to build or improve?"),
    page.locator("summary", { hasText: "Add optional context" }),
    page.getByRole("checkbox", { name: /I accept the privacy notice/ }),
    page.getByRole("link", { name: "privacy notice" }),
    page.getByRole("button", { name: "Send diagnostic request" }),
    page.getByRole("link", { name: "Contact us by email" })
  ];

  for (const expectedFocus of tabSequence) {
    await page.keyboard.press("Tab");
    await expect(expectedFocus).toBeFocused();
  }
});

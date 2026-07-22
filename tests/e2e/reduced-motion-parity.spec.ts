import { expect, test } from "@playwright/test";

interface ReducedMotionWindow extends Window {
  __IZIGNA_WEBGL_REQUESTS__?: number;
}

const localeCases = [
  { locale: "es", unavailable: "Movimiento avanzado no disponible" },
  { locale: "en", unavailable: "Advanced motion unavailable" }
] as const;

for (const { locale, unavailable } of localeCases) {
  test(`${locale} reduced motion keeps complete static parity without WebGL`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      (window as ReducedMotionWindow).__IZIGNA_WEBGL_REQUESTS__ = 0;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        ...args: unknown[]
      ) {
        if (String(args[0]).startsWith("webgl")) {
          const target = window as ReducedMotionWindow;
          target.__IZIGNA_WEBGL_REQUESTS__ = (target.__IZIGNA_WEBGL_REQUESTS__ ?? 0) + 1;
        }
        return Reflect.apply(originalGetContext, this, args);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    const requestedScripts: string[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script") requestedScripts.push(response.url());
    });

    await page.goto(`/${locale}/`, { waitUntil: "networkidle" });

    await expect(page.locator(".explore-visual")).toHaveAttribute("data-motion-level", "0");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".explore-canvas-frame .explore-fallback")).toBeVisible();
    await expect(page.getByRole("button", { name: unavailable })).toBeDisabled();
    expect(
      await page.evaluate(() => (window as ReducedMotionWindow).__IZIGNA_WEBGL_REQUESTS__ ?? 0)
    ).toBe(0);

    for (const chapterId of [
      "explore-signal",
      "explore-assembly",
      "explore-capabilities",
      "explore-omnisync",
      "explore-nomada",
      "explore-quality",
      "explore-uplink"
    ]) {
      await expect(page.locator(`#${chapterId}`)).toBeAttached();
    }

    await expect(page.locator("[data-capability-id]")).toHaveCount(6);
    await expect(page.locator("[data-project-encounter]")).toHaveCount(2);
    await expect(page.locator("[data-quality-category]")).toHaveCount(6);
    await expect(page.locator("video[autoplay]")).toHaveCount(0);
    await expect(page.locator("#explore-uplink a")).toHaveCount(3);

    expect(
      requestedScripts.some((url) =>
        /ExploreCanvas|HeroSignalScene|CapabilityOrbitScene|OmniSyncScene|NomadaScene|events-/i
          .test(url)
      )
    ).toBe(false);
  });
}

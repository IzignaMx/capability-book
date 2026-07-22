import { expect, test } from "@playwright/test";

interface WebGLFailureWindow extends Window {
  __IZIGNA_CANVAS_CREATIONS__?: number;
  __IZIGNA_PROBE_CONTEXT_GRANTED__?: boolean;
}

test("retries one failed renderer before preserving the static narrative", async ({ page }) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 8 });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8
    });

    const originalCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function (
      this: Document,
      tagName: string,
      options?: ElementCreationOptions
    ) {
      const args = options === undefined ? [tagName] : [tagName, options];
      const element = Reflect.apply(originalCreateElement, this, args) as HTMLElement;
      if (tagName.toLowerCase() === "canvas") {
        const target = window as WebGLFailureWindow;
        target.__IZIGNA_CANVAS_CREATIONS__ = (target.__IZIGNA_CANVAS_CREATIONS__ ?? 0) + 1;
      }
      return element;
    } as typeof Document.prototype.createElement;

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: unknown[]
    ) {
      const type = String(args[0]);
      if (!type.startsWith("webgl")) {
        return Reflect.apply(originalGetContext, this, args);
      }

      const target = window as WebGLFailureWindow;
      if (target.__IZIGNA_PROBE_CONTEXT_GRANTED__) return null;
      const context = Reflect.apply(originalGetContext, this, args);
      if (context !== null) target.__IZIGNA_PROBE_CONTEXT_GRANTED__ = true;
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto("/es/");
  const visual = page.locator(".explore-visual");
  await expect(visual).toHaveAttribute("data-motion-level", /[23]/);

  await expect.poll(
    () => page.evaluate(() => (window as WebGLFailureWindow).__IZIGNA_CANVAS_CREATIONS__ ?? 0),
    { timeout: 10_000 }
  ).toBe(3);
  await expect(visual.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".explore-canvas-frame .explore-fallback")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Escuchamos antes de diseñar." }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: "Ver evidencia en Evaluate" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/TypeError|WebGLRenderer|stack trace/i);
});

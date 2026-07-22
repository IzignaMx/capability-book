import { expect, test } from "@playwright/test";

interface QualityTestHook {
  readonly pushWindow: (milliseconds: number) => void;
  readonly profile: () => "low" | "medium" | "high";
}

interface ExploreTestWindow extends Window {
  __IZIGNA_CONTEXT_COUNT__?: number;
  __IZIGNA_QUALITY_TEST__?: QualityTestHook;
}

const chapterIds = [
  "explore-signal",
  "explore-assembly",
  "explore-capabilities",
  "explore-omnisync",
  "explore-nomada",
  "explore-quality",
  "explore-uplink"
] as const;

test.use({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 8 });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8
    });

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const contexts = new WeakSet<object>();
    (window as ExploreTestWindow).__IZIGNA_CONTEXT_COUNT__ = 0;

    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: unknown[]
    ) {
      const context = Reflect.apply(originalGetContext, this, args) as object | null;
      const contextType = String(args[0]);
      if (context !== null && contextType.startsWith("webgl") && !contexts.has(context)) {
        contexts.add(context);
        const target = window as ExploreTestWindow;
        target.__IZIGNA_CONTEXT_COUNT__ = (target.__IZIGNA_CONTEXT_COUNT__ ?? 0) + 1;
      }
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
});

test("keeps the semantic Explore flow stable with one adaptive canvas", async ({ page }) => {
  await page.goto("/es/", { waitUntil: "networkidle" });

  const evaluateLink = page.getByRole("link", { name: "Ver evidencia en Evaluate" });
  const firstChapter = page.locator("#explore-signal");
  await expect(evaluateLink).toBeVisible();
  await expect(firstChapter).toBeVisible();
  expect(
    await evaluateLink.evaluate(
      (link, chapter) => Boolean(link.compareDocumentPosition(chapter as Node) & Node.DOCUMENT_POSITION_FOLLOWING),
      await firstChapter.elementHandle()
    )
  ).toBe(true);

  const visual = page.locator(".explore-visual");
  const accessibleVisualization = visual.getByRole("img", {
    name: "Visualización espacial de capacidades de IzignaMx"
  });
  const canvas = visual.locator("canvas");
  await expect(visual).toHaveAttribute("data-motion-level", /[23]/);
  await expect(visual).toHaveAttribute("data-quality-profile", "high");
  await expect(accessibleVisualization).toHaveCount(1);
  await expect(accessibleVisualization.locator("canvas")).toHaveCount(1);
  await expect(canvas).toHaveCount(1);
  await expect(canvas).not.toHaveAttribute("tabindex");
  await expect(canvas.locator("a, button, input, select, textarea, [tabindex]"))
    .toHaveCount(0);

  const initialUrl = page.url();
  for (let pass = 0; pass < 2; pass += 1) {
    const orderedChapters = pass === 0 ? chapterIds : [...chapterIds].reverse();
    for (const chapterId of orderedChapters) {
      await page.locator(`#${chapterId}`).evaluate((element) => {
        element.scrollIntoView({ behavior: "auto", block: "end" });
      });
      await expect(visual).toHaveAttribute(
        "data-active-chapter",
        chapterId.replace("explore-", "")
      );
      await expect(canvas).toHaveCount(1);
      expect(page.url()).toBe(initialUrl);
    }
  }

  const contextCountAfterFirstPasses = await page.evaluate(
    () => (window as ExploreTestWindow).__IZIGNA_CONTEXT_COUNT__ ?? 0
  );
  await page.locator("#explore-signal").evaluate((element) => {
    element.scrollIntoView({ behavior: "auto", block: "end" });
  });
  await page.locator("#explore-uplink").evaluate((element) => {
    element.scrollIntoView({ behavior: "auto", block: "end" });
  });
  await expect(canvas).toHaveCount(1);
  expect(
    await page.evaluate(() => (window as ExploreTestWindow).__IZIGNA_CONTEXT_COUNT__ ?? 0)
  ).toBe(contextCountAfterFirstPasses);

  await visual.evaluate((element) => {
    (element as HTMLElement).style.visibility = "hidden";
  });
  await expect(page.locator("#explore-omnisync")).toContainText("OmniSync");
  await expect(page.locator("#explore-nomada")).toContainText("Hamburguesa Nómada");
  await expect(page.locator("#explore-omnisync .project-encounter__proof > article"))
    .toHaveCount(3);
  await expect(page.locator("#explore-nomada .project-encounter__proof > article"))
    .toHaveCount(3);
  const diagnosticHref = await page
    .locator('#explore-omnisync a[href*="/es/diagnostico/"]')
    .getAttribute("href");
  expect(diagnosticHref).not.toBeNull();
  expect(new URL(diagnosticHref as string, page.url()).searchParams.get("project"))
    .toBe("omnisync");
  await visual.evaluate((element) => {
    (element as HTMLElement).style.visibility = "";
  });

  await expect.poll(
    () => page.evaluate(() => Boolean((window as ExploreTestWindow).__IZIGNA_QUALITY_TEST__))
  ).toBe(true);
  const dprBefore = await canvas.evaluate(
    (element) => (element as HTMLCanvasElement).width / element.getBoundingClientRect().width
  );
  await page.evaluate(() => {
    (window as ExploreTestWindow).__IZIGNA_QUALITY_TEST__?.pushWindow(21);
  });
  await expect(visual).not.toHaveAttribute("data-quality-profile", "high");
  await expect.poll(() =>
    canvas.evaluate(
      (element) => (element as HTMLCanvasElement).width / element.getBoundingClientRect().width
    )
  ).toBeLessThan(dprBefore);

  const motionButton = page.getByRole("button", { name: "Reducir movimiento avanzado" });
  await motionButton.click();
  await expect(canvas).toHaveCount(0);
  await expect(page.locator(".explore-canvas-frame .explore-fallback")).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurar movimiento avanzado" }))
    .toHaveAttribute("aria-pressed", "true");
});

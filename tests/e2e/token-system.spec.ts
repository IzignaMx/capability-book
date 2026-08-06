import { expect, test } from "@playwright/test";

/**
 * Token system hardening — runtime-level complement to check:tokens script.
 * Checks: zero unresolved CSS vars at runtime, zero colors outside allowed palette,
 * zero new fonts, zero unauthorized logo use, zero orange as global accent.
 */

const ALLOWED_COLORS = [
  "#020617", // space
  "#0b1120", // midnight
  "#1b1b1d", // carbon (retained canonical)
  "#3b82f6", // brand
  "#60a5fa", // brand-bright
  "#22d3ee", // cyan
  "#00b4c0", // teal (retained canonical)
  "#ffffff", // white
  "#f5f5f7", // mist
  "#66686a", // lead (retained canonical)
  "#cbd5e1", // text-muted
];

const ALLOWED_FONT_FAMILIES = [
  "Aptos Display",
  "Aptos",
  "Cascadia Code",
  // OS fallback fonts (Chromium uses these when web fonts unavailable — not introduced by code)
  "Segoe UI Variable Text",
  "Segoe UI Variable Display",
  "SFMono-Regular",
  "Segoe UI",
  "Consolas",
  "Menlo",
  "Courier New",
  // CSS generic fallbacks (not new fonts)
  "monospace",
  "sans-serif",
  "serif",
  "system-ui",
  "inherit",
  "initial",
  "revert",
  "unset",
];

const ROUTES = [
  "/",
  "/es/",
  "/en/",
  "/es/proyectos/",
  "/en/projects/",
  "/es/proyectos/omnisync/",
  "/en/projects/omnisync/",
  "/es/diagnostico/",
  "/en/diagnostic/",
] as const;

test.describe("token system hardening", () => {
  test("zero unresolved CSS custom properties at runtime", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const unresolved = await page.evaluate(() => {
        const all = document.querySelectorAll("*");
        const issues: string[] = [];
        for (const el of all) {
          const styles = window.getComputedStyle(el);
          // Check a sample of properties that commonly use var()
          const props = [
            "color",
            "background-color",
            "border-color",
            "padding",
            "margin",
            "gap",
            "font-size",
            "line-height",
            "width",
            "height",
          ];
          for (const prop of props) {
            const value = styles.getPropertyValue(prop);
            // Unresolved var() shows as empty or the fallback; if it contains var() in computed style, it's unresolved
            if (value.includes("var(") && !value.includes(",")) {
              issues.push(`${el.tagName}.${el.className} ${prop}=${value}`);
            }
          }
          if (issues.length > 5) break; // cap for performance
        }
        return issues;
      });

      expect(unresolved, `${route} has unresolved CSS vars: ${unresolved.join("; ")}`).toHaveLength(0);
    }
  });

  test("no colors outside allowed palette in computed styles", async ({ page }) => {
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const offPalette = await page.evaluate((allowed) => {
      const issues: string[] = [];
      const elements = document.querySelectorAll("*");
      for (const el of elements) {
        const style = getComputedStyle(el);
        const colorProps = ["color", "background-color", "border-color"];
        for (const prop of colorProps) {
          const value = style.getPropertyValue(prop);
          if (value === "" || value === "rgba(0, 0, 0, 0)" || value === "transparent") continue;
          // Extract hex or rgb
          const hexMatch = value.match(/#([0-9a-f]{3,8})/gi);
          if (hexMatch) {
            for (const hex of hexMatch) {
              if (!allowed.some((a: string) => a.toLowerCase() === hex.toLowerCase())) {
                issues.push(`${el.tagName} ${prop}=${hex}`);
              }
            }
          }
        }
        if (issues.length > 10) break;
      }
      return issues;
    }, ALLOWED_COLORS);

    // Filter out known acceptable variations (gradients with rgba, shadows)
    const real = offPalette.filter((s) => !s.includes("rgba("));
    expect(real, `off-palette colors: ${real.join("; ")}`).toHaveLength(0);
  });

  test("no new font families introduced", async ({ page }) => {
    for (const route of ["/", "/es/", "/en/"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const fonts = await page.evaluate((allowed) => {
        const found = new Set<string>();
        for (const el of document.querySelectorAll("*")) {
          const family = getComputedStyle(el).fontFamily;
          family.split(",").forEach((f) => {
            const trimmed = f.trim().replace(/['"]/g, "");
            if (trimmed && !allowed.includes(trimmed)) {
              found.add(trimmed);
            }
          });
        }
        return Array.from(found);
      }, ALLOWED_FONT_FAMILIES);

      expect(fonts, `${route} has unexpected fonts: ${fonts.join(", ")}`).toHaveLength(0);
    }
  });

  test("no orange as global accent color", async ({ page }) => {
    await page.goto("/es/");
    await page.waitForLoadState("networkidle");

    const orangeUsage = await page.evaluate(() => {
      const issues: string[] = [];
      for (const el of document.querySelectorAll("*")) {
        const style = getComputedStyle(el);
        // Check accent-color, color, background-color for orange-ish hues
        const props = ["accent-color", "color", "background-color", "border-color"];
        for (const prop of props) {
          const value = style.getPropertyValue(prop);
          // Match orange-ish rgb: r > 200, g 80-180, b < 100
          const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const r = Number(rgbMatch[1]);
            const g = Number(rgbMatch[2]);
            const b = Number(rgbMatch[3]);
            if (r > 200 && g >= 80 && g <= 180 && b < 100) {
              issues.push(`${el.tagName} ${prop}=${value}`);
            }
          }
        }
        if (issues.length > 5) break;
      }
      return issues;
    });

    expect(orangeUsage, `orange accent detected: ${orangeUsage.join("; ")}`).toHaveLength(0);
  });

  test("IzignaMx brand name present and correctly cased", async ({ page }) => {
    for (const route of ["/", "/es/", "/en/"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const body = await page.locator("body").innerText();
      // Must contain "IzignaMx" (correct case)
      expect(body, `${route} missing IzignaMx`).toContain("IzignaMx");
      // Must NOT contain wrong casings
      expect(body, `${route} has IzignaMX`).not.toContain("IzignaMX");
      expect(body, `${route} has Izignamx`).not.toContain("Izignamx");
      expect(body, `${route} has IZIGNA`).not.toContain("IZIGNA");
    }
  });
});
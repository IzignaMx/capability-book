// @vitest-environment node
import { test, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Brief } from "../atlas/book/Brief";
for (const locale of ["es", "en"] as const) {
  test(`${locale} unhydrated contact cannot accidentally perform a native form submission`, () => {
    const html = renderToStaticMarkup(createElement(Brief, { locale }));
    const controls = [
      ...html.matchAll(
        /<(?:input|select|textarea)\b[^>]*\bname="(?:name|email|goal|details)"[^>]*>/g,
      ),
    ].map((match) => match[0]);
    expect(controls.length).toBe(4);
    for (const control of controls) expect(control).toMatch(/\bdisabled(?:=|\s|>)/);
    const submit = [...html.matchAll(/<button\b[^>]*type="submit"[^>]*>/g)].map(
      (match) => match[0],
    );
    expect(submit.length).toBe(2);
    for (const button of submit) expect(button).toMatch(/\bdisabled(?:=|\s|>)/);
    expect(html).toContain("mailto:hola@izignamx.com");
    expect(html).toContain("https://wa.me/525533760889");
    expect(html).toContain("<noscript>");
  });
}

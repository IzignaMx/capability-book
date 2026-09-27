import { useEffect, useState } from "react";
import { contextQuery } from "./context";
import type { Page } from "./model";
/** Keep the public selection reloadable. Contact form values never enter the URL. */
export function useContextUrl(page: Page, selection: string[], extras?: Record<string, string>) {
  const [hydrated, setHydrated] = useState(false);
  const ids = selection.join(",");
  const fields = JSON.stringify(extras || {});
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    const input = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(JSON.parse(fields) as Record<string, string>))
      input.set(key, value);
    const query = contextQuery(page, input.toString(), ids ? ids.split(",") : []);
    const next = location.pathname + (query ? "?" + query : "") + location.hash;
    if (next !== location.pathname + location.search + location.hash)
      history.replaceState(history.state, "", next);
    window.dispatchEvent(new Event("book:context"));
  }, [hydrated, page, ids, fields]);
}

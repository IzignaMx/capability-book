import { categories, cleanSelection, type Page } from "./model";
/** Preserve only public project-navigation fields, never contact form values. */
export function contextQuery(page: Page, search: string, selection?: string[]): string {
  if (!["projects", "compare", "contact"].includes(page)) return "";
  const source = new URLSearchParams(search);
  const target = new URLSearchParams();
  const ids = cleanSelection(selection ?? source.get("projects") ?? source.get("project"));
  if (ids.length) target.set("projects", ids.join(","));
  if (page === "projects") {
    const q = (source.get("q") || "").trim().slice(0, 160);
    const category = source.get("category");
    if (q) target.set("q", q);
    if (category && category !== "all" && categories.some((c) => c.id === category))
      target.set("category", category);
    if (source.get("layout") === "list") target.set("layout", "list");
  }
  return target.toString();
}

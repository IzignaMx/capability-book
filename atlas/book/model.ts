import data from "./projects.json";
export type Locale = "es" | "en";
export type Chapter = { title: string; blocks: { type: string; text: string[] }[] };
export type ProjectCopy = {
  title: string;
  elevatorPitch: string;
  challenge: string;
  constraints: string[];
  strategy: string;
  solution: string;
  capabilities: string[];
  industries: string[];
  technologies: string[];
  outcomes: {
    kind: string;
    label: string;
    description: string;
    sourceUrl?: string;
    sourceLabel?: string;
    verifiedAt?: string;
  }[];
  chapters: Chapter[];
  relatedServices: string[];
};
export type EvidenceImage = {
  id: string;
  width: number;
  height: number;
  alt: Record<Locale, string>;
  caption: Record<Locale, string>;
  license: string;
  variants: Record<
    "desktop" | "mobile",
    { avif: string; webp: string; width: number; height: number }
  >;
  provenance: { kind: string; capturedAt: string; commit: string; reviewedAt: string };
};
export type Project = {
  slug: string;
  classification: string;
  publication: { reviewedAt: string; notes: string; confidentiality: string };
  links: { label: string; url: string; public: boolean }[];
  sources: { id: string; label: string; type: string; url: string }[];
  media: [EvidenceImage, ...EvidenceImage[]];
  es: ProjectCopy;
  en: ProjectCopy;
};
export const projects = data as unknown as [Project, Project, Project, Project, Project, Project];
export const categories = [
  { id: "all", es: "Todos", en: "All" },
  { id: "commerce", es: "Comercio", en: "Commerce" },
  { id: "experience", es: "Experiencias", en: "Experiences" },
  { id: "impact", es: "Impacto", en: "Impact" },
  { id: "data", es: "Datos", en: "Data" },
  { id: "tools", es: "Herramientas", en: "Tools" },
] as const;
export type Category = (typeof categories)[number]["id"];
const assignment: Record<string, Category[]> = {
  omnisync: ["commerce", "data", "tools"],
  "hamburguesa-nomada": ["experience", "impact"],
  tecuiyo: ["impact", "tools"],
  vald: ["experience", "impact"],
  nutrichilango: ["impact", "data"],
  "developer-tools": ["tools", "commerce"],
};
export const projectCategories = (p: Project) => assignment[p.slug] || [];
export const mainCategory = (p: Project, l: Locale) =>
  categories.find((c) => c.id === projectCategories(p)[0])?.[l] || "";
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterProjects(query: string, category: string, locale: Locale) {
  const q = fold(query.trim().slice(0, 160));
  return projects.filter(
    (p) =>
      (category === "all" || projectCategories(p).includes(category as Category)) &&
      fold(JSON.stringify(p[locale])).includes(q),
  );
}
export const getProject = (slug: unknown) =>
  typeof slug === "string" ? projects.find((p) => p.slug === slug) : undefined;
export function cleanSelection(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [
    ...new Set(items.filter((s): s is string => typeof s === "string" && !!getProject(s))),
  ].slice(0, 3);
}
export type Page =
  | "home"
  | "projects"
  | "case"
  | "approach"
  | "map"
  | "compare"
  | "contact"
  | "privacy"
  | "accessibility";
export type BookRoute = { locale: Locale; page: Page; slug?: string };
const sections: Record<Locale, Record<Exclude<Page, "home" | "case">, string>> = {
  es: {
    projects: "proyectos",
    approach: "enfoque",
    map: "constelacion",
    compare: "comparar",
    contact: "diagnostico",
    privacy: "privacidad",
    accessibility: "accesibilidad",
  },
  en: {
    projects: "projects",
    approach: "approach",
    map: "constellation",
    compare: "compare",
    contact: "diagnostic",
    privacy: "privacy",
    accessibility: "accessibility",
  },
};
export function pathFor(locale: Locale, page: Page = "home", slug?: string) {
  return (
    `/${locale}/` +
    (page === "home"
      ? ""
      : page === "case"
        ? `${sections[locale].projects}/${slug}/`
        : `${sections[locale][page]}/`)
  );
}
export function parseRoute(path: string): BookRoute | null {
  const p = (path.split("?")[0] || "").split("/").filter(Boolean);
  if (p[0] !== "es" && p[0] !== "en") return null;
  const locale = p[0];
  if (p.length === 1) return { locale, page: "home" };
  if (p.length === 3 && p[1] === sections[locale].projects && getProject(p[2]))
    return { locale, page: "case", slug: p[2]! };
  if (p.length === 2) {
    const found = Object.entries(sections[locale]).find(([, v]) => v === p[1]);
    if (found) return { locale, page: found[0] as Page };
  }
  return null;
}
export const allRoutes = (["es", "en"] as const).flatMap((l) => [
  pathFor(l),
  ...Object.keys(sections[l]).map((p) => pathFor(l, p as Page)),
  ...projects.map((p) => pathFor(l, "case", p.slug)),
]);
export function classification(p: Project, l: Locale) {
  return p.classification === "internal"
    ? l === "es"
      ? "Proyecto interno · demo"
      : "Internal project · demo"
    : p.classification === "open-source"
      ? l === "es"
        ? "Código abierto"
        : "Open source"
      : p.slug === "vald"
        ? l === "es"
          ? "Edición 2025"
          : "2025 edition"
        : l === "es"
          ? "Proyecto publicado"
          : "Published project";
}
export function briefPath(locale: Locale, ids: string[] = []) {
  return (
    pathFor(locale, "contact") +
    (cleanSelection(ids).length ? "?projects=" + cleanSelection(ids).join(",") : "")
  );
}
export type Brief = {
  name?: string;
  email?: string;
  goal?: string;
  details?: string;
  channel?: "whatsapp" | "email";
  projects?: string[];
};
const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
export function prepareBrief(input: Brief, locale: Locale) {
  const es = locale === "es",
    name = clean(input.name, 80),
    email = clean(input.email, 160),
    goal = clean(input.goal, 120),
    details = clean(input.details, 1400),
    channel = input.channel === "email" ? "email" : "whatsapp";
  const errors: Record<string, string> = {};
  if (!name) errors.name = es ? "Escribe tu nombre." : "Enter your name.";
  if (!goal) errors.goal = es ? "Selecciona una necesidad." : "Choose a need.";
  if ((email || channel === "email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = es ? "Escribe un correo válido." : "Enter a valid email.";
  if (Object.keys(errors).length) return { ok: false as const, errors };
  const names = cleanSelection(input.projects).map((s) => getProject(s)![locale].title);
  const text = [
    es
      ? `Hola, soy ${name}. Me gustaría conversar sobre ${goal}.`
      : `Hello, I’m ${name}. I’d like to discuss ${goal}.`,
    names.length ? (es ? "Casos de referencia: " : "Reference projects: ") + names.join(", ") : "",
    details,
    email ? (es ? "Correo: " : "Email: ") + email : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const href =
    channel === "email"
      ? `mailto:hola@izignamx.com?subject=${encodeURIComponent("Proyecto / IzignaMx Book")}&body=${encodeURIComponent(text)}`
      : `https://wa.me/525533760889?text=${encodeURIComponent(text)}`;
  return { ok: true as const, text, href, channel, errors: {} };
}

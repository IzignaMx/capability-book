# IzignaMx Capability Book Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a bilingual, static-first, accessible IzignaMx Capability Book that works without WebGL and includes Evaluate mode, six validated projects, contextual diagnostic routing, and GitHub Pages deployment at `book.izignamx.com`.

**Architecture:** Astro owns routing, content, HTML, SEO, and static rendering. React islands are limited to project filtering and the diagnostic wizard. Domain ports isolate content, analytics, search, and form submission. The fully static site accepts an optional public HTTPS form endpoint at build time; delivery, validation, rate limiting, spam controls, and secrets remain outside GitHub Pages.

**Tech Stack:** Astro static output, TypeScript strict, React, Zod, Vitest, Testing Library, Playwright, Axe, Pagefind, SCSS Modules, GitHub Pages, GitHub Actions.

## Global Constraints

- Canonical brand name: `IzignaMx`.
- Principal accent: `#3b82f6`.
- No orange global accent or orange default CTA/focus/selection state.
- Root content remains useful without JavaScript, WebGL, animation, or forced language redirection.
- WCAG 2.2 AA target with 44×44 CSS pixel touch targets.
- LCP target below 2.5 seconds, CLS below 0.1, INP below 200 milliseconds.
- Static output must deploy to GitHub Pages at the custom-domain root.
- Project content must derive from validated Phase 0 evidence.
- Every route must expose crawlable text, canonical metadata, language alternates, and fallback media.
- Analytics event parameters must never contain personal or form content.

---

## File map

```text
src/
├── components/
│   ├── accessibility/SkipLink.astro
│   ├── conversion/DiagnosticWizard.tsx
│   ├── core/ModeSwitch.astro
│   ├── navigation/SiteHeader.astro
│   └── projects/ProjectCatalog.tsx
├── content/
│   ├── projects/{es,en}/*.md
│   └── capabilities/{es,en}/*.json
├── domain/
│   ├── analytics/AnalyticsPort.ts
│   ├── projects/PortfolioProject.ts
│   └── projects/ProjectRepository.ts
├── features/
│   ├── analytics/BrowserAnalyticsAdapter.ts
│   ├── diagnostic/LeadContext.ts
│   └── evaluate-mode/projectFilters.ts
├── infrastructure/
│   ├── content/AstroProjectRepository.ts
│   └── search/StaticSearchAdapter.ts
├── layouts/BaseLayout.astro
├── pages/
│   ├── index.astro
│   ├── es/index.astro
│   ├── en/index.astro
│   ├── es/proyectos/index.astro
│   ├── en/projects/index.astro
│   ├── es/proyectos/[slug].astro
│   ├── en/projects/[slug].astro
│   ├── es/diagnostico/index.astro
│   ├── en/diagnostic/index.astro
│   ├── es/accesibilidad.astro
│   ├── en/accessibility.astro
│   ├── es/privacidad.astro
│   └── en/privacy.astro
├── styles/{tokens,global}.scss
├── content.config.ts
└── env.d.ts
public/
├── CNAME
├── media/projects/*
├── robots.txt
└── _headers.example
scripts/
├── import-evidence.ts
├── validate-built-html.ts
└── verify-budgets.ts
```

### Task 1: Scaffold Astro without deleting Phase 0 assets

**Files:**
- Create/modify: `astro.config.mjs`
- Modify: `package.json`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro`

**Interfaces:**
- Produces: static Astro build under `dist/`.

- [ ] **Step 1: Install application dependencies**

```bash
git switch main
git pull --ff-only
git switch -c feat/phase-1-foundation
pnpm add astro @astrojs/react react react-dom zod sass
pnpm add -D @astrojs/check @testing-library/react @testing-library/user-event @types/react @types/react-dom axe-core pa11y-ci pagefind playwright-core
```

- [ ] **Step 2: Replace scripts in `package.json` with the following additional entries**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build && pagefind --site dist && tsx scripts/validate-built-html.ts && tsx scripts/verify-budgets.ts",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check": "astro check && pnpm typecheck && pnpm check:brand",
    "import:evidence": "tsx scripts/import-evidence.ts",
    "validate:evidence": "tsx scripts/validate-evidence.ts && pnpm check:brand && pnpm test"
  }
}
```

Preserve all Phase 0 scripts and dependencies.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://book.izignamx.com",
  output: "static",
  integrations: [react()],
  build: { format: "directory", inlineStylesheets: "auto" },
  vite: { build: { cssCodeSplit: true } }
});
```

- [ ] **Step 4: Create a minimal root language route**

```astro
---
const languages = [
  { href: "/es/", label: "Continuar en español" },
  { href: "/en/", label: "Continue in English" }
];
---
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>IzignaMx Capability Book</title>
    <meta name="description" content="Selecciona el idioma para explorar las capacidades y proyectos de IzignaMx." />
  </head>
  <body>
    <main>
      <h1>IzignaMx</h1>
      <p>Selecciona un idioma. Select a language.</p>
      <nav aria-label="Language selection">
        {languages.map((language) => <a href={language.href}>{language.label}</a>)}
      </nav>
    </main>
  </body>
</html>
```

- [ ] **Step 5: Verify and commit**

```bash
pnpm check
pnpm build
git add package.json pnpm-lock.yaml astro.config.mjs src
git commit -m "feat: scaffold static Astro capability book"
```

### Task 2: Implement immutable design tokens and global accessibility styles

**Files:**
- Create: `src/styles/tokens.scss`
- Create: `src/styles/global.scss`
- Create: `tests/design-tokens.test.ts`

**Interfaces:**
- Produces: `--color-brand: #3b82f6`, dark and light surfaces, focus ring, spacing, typography, and motion duration tokens.

- [ ] **Step 1: Write the failing token test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.scss", "utf8").toLowerCase();

describe("IzignaMx tokens", () => {
  it("uses blue as brand and excludes orange identity values", () => {
    expect(tokens).toContain("--color-brand: #3b82f6");
    expect(tokens).not.toMatch(/--color-(brand|accent|primary|focus).*#(?:ff6a1a|f97316)/);
  });
});
```

- [ ] **Step 2: Create `src/styles/tokens.scss`**

```scss
:root {
  color-scheme: dark;
  --color-space: #020617;
  --color-carbon: #1b1b1d;
  --color-midnight: #0b1120;
  --color-brand: #3b82f6;
  --color-cyan: #22d3ee;
  --color-teal: #00b4c0;
  --color-white: #ffffff;
  --color-mist: #f5f5f7;
  --color-lead: #66686a;
  --color-text: #ffffff;
  --color-text-muted: #cbd5e1;
  --focus-ring: 0 0 0 3px #020617, 0 0 0 6px #60a5fa;
  --radius-sm: 0.25rem;
  --radius-md: 0.75rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --content-width: 76rem;
  --motion-fast: 140ms;
  --motion-standard: 240ms;
}
```

- [ ] **Step 3: Create `src/styles/global.scss`**

```scss
@use "./tokens.scss";

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--color-space); color: var(--color-text); font-family: Inter, system-ui, sans-serif; }
body { margin: 0; min-width: 20rem; background: radial-gradient(circle at 50% -20%, #172554 0, var(--color-space) 45%); }
a { color: inherit; }
button, input, select, textarea { font: inherit; }
button, a, input, select, textarea { min-height: 44px; }
:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.container { width: min(calc(100% - 2rem), var(--content-width)); margin-inline: auto; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Run and commit**

```bash
pnpm test -- tests/design-tokens.test.ts
pnpm check:brand
git add src/styles tests/design-tokens.test.ts
git commit -m "feat: add accessible IzignaMx design tokens"
```

### Task 3: Define project domain contracts and Astro content validation

**Files:**
- Create: `src/domain/projects/PortfolioProject.ts`
- Create: `src/domain/projects/ProjectRepository.ts`
- Create: `src/content.config.ts`
- Create: `tests/project-schema.test.ts`

**Interfaces:**
- Produces: `PortfolioProject`, `ProofPoint`, `ProjectQuery`, `ProjectRepository`.

- [ ] **Step 1: Create `src/domain/projects/PortfolioProject.ts`**

```ts
export type Locale = "es" | "en";
export type ProjectClassification = "real" | "open-source" | "internal" | "concept";
export type OutcomeKind = "verified-result" | "system-metric" | "expected-outcome" | "demonstrated-capability";

export interface ProofPoint {
  kind: OutcomeKind;
  label: string;
  value?: string;
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface PortfolioProject {
  slug: string;
  locale: Locale;
  classification: ProjectClassification;
  title: string;
  elevatorPitch: string;
  challenge: string;
  constraints: string[];
  strategy: string;
  solution: string;
  capabilities: string[];
  industries: string[];
  technologies: string[];
  outcomes: ProofPoint[];
  liveUrl?: string;
  sourceUrl?: string;
  fallbackPoster: string;
  confidentiality: "public" | "partial" | "private";
  accessibilityNotes: string[];
  relatedServices: string[];
  ctaPreset: string;
}

export interface ProjectQuery {
  locale: Locale;
  capabilities?: string[];
  industries?: string[];
  technologies?: string[];
  classification?: ProjectClassification[];
  text?: string;
}
```

- [ ] **Step 2: Create `src/domain/projects/ProjectRepository.ts`**

```ts
import type { Locale, PortfolioProject, ProjectQuery } from "./PortfolioProject";

export interface ProjectRepository {
  list(query: ProjectQuery): Promise<PortfolioProject[]>;
  getBySlug(slug: string, locale: Locale): Promise<PortfolioProject | null>;
}
```

- [ ] **Step 3: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from "astro:content";

const proofPoint = z.object({
  kind: z.enum(["verified-result", "system-metric", "expected-outcome", "demonstrated-capability"]),
  label: z.string().min(2),
  value: z.string().optional(),
  description: z.string().min(10),
  sourceLabel: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    locale: z.enum(["es", "en"]),
    classification: z.enum(["real", "open-source", "internal", "concept"]),
    title: z.string().min(2),
    elevatorPitch: z.string().min(20),
    challenge: z.string().min(20),
    constraints: z.array(z.string()).min(1),
    strategy: z.string().min(20),
    solution: z.string().min(20),
    capabilities: z.array(z.string()).min(1),
    industries: z.array(z.string()).min(1),
    technologies: z.array(z.string()).min(1),
    outcomes: z.array(proofPoint).min(1),
    liveUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    fallbackPoster: z.string().startsWith("/media/projects/"),
    confidentiality: z.enum(["public", "partial", "private"]),
    accessibilityNotes: z.array(z.string()).min(1),
    relatedServices: z.array(z.string()).min(1),
    ctaPreset: z.string().min(2)
  })
});

const capabilities = defineCollection({
  type: "data",
  schema: z.object({
    locale: z.enum(["es", "en"]),
    name: z.string(),
    description: z.string().min(20),
    technicalScope: z.array(z.string()).min(1),
    suitableIndustries: z.array(z.string()).min(1),
    commonOutcomes: z.array(z.string()).min(1),
    ctaContext: z.string(),
    sceneId: z.string(),
    fallbackPoster: z.string()
  })
});

export const collections = { projects, capabilities };
```

- [ ] **Step 4: Add a schema smoke test and run**

```ts
import { describe, expect, it } from "vitest";
import type { PortfolioProject } from "../src/domain/projects/PortfolioProject";

describe("portfolio domain", () => {
  it("accepts the canonical classification vocabulary", () => {
    const classification: PortfolioProject["classification"] = "open-source";
    expect(classification).toBe("open-source");
  });
});
```

```bash
pnpm test -- tests/project-schema.test.ts
pnpm check
git add src/domain src/content.config.ts tests/project-schema.test.ts
git commit -m "feat: define validated portfolio content model"
```

### Task 4: Import Phase 0 evidence into bilingual project content

**Files:**
- Create: `scripts/import-evidence.ts`
- Create: `src/content/projects/es/*.md`
- Create: `src/content/projects/en/*.md`

**Interfaces:**
- Consumes: `data/evidence/*.json`.
- Produces: twelve localized project records.

- [ ] **Step 1: Create `scripts/import-evidence.ts`**

```ts
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const evidenceDirectory = new URL("../data/evidence/", import.meta.url);
const outputRoot = new URL("../src/content/projects/", import.meta.url);
const translations: Record<string, { es: string; en: string }> = {
  omnisync: { es: "Sincronización multicanal de inventario, precios y pedidos.", en: "Multichannel inventory, pricing, and order synchronization." },
  "hamburguesa-nomada": { es: "Plataforma de evento, resultados y reconocimientos digitales.", en: "Event, results, and digital recognition platform." },
  vald: { es: "Experiencia digital para ultraciclismo, ruta y resultados.", en: "Digital ultracycling, route, and results experience." },
  nutrichilango: { es: "Comparación de precio y nutrición para alternativas vegetales.", en: "Price and nutrition comparison for plant-based alternatives." },
  tecuiyo: { es: "Tecnología cívica para comprender derechos laborales en México.", en: "Civic technology for understanding labor rights in Mexico." },
  "developer-tools": { es: "Herramientas abiertas para flujos de desarrollo, automatización y comercio.", en: "Open tools for development, automation, and commerce workflows." }
};

for (const locale of ["es", "en"] as const) await mkdir(new URL(`${locale}/`, outputRoot), { recursive: true });

for (const file of (await readdir(evidenceDirectory)).filter((name) => name.endsWith(".json"))) {
  const record = JSON.parse(await readFile(new URL(file, evidenceDirectory), "utf8"));
  const slug = record.project.slug;
  for (const locale of ["es", "en"] as const) {
    const elevatorPitch = translations[slug]?.[locale];
    if (!elevatorPitch) throw new Error(`Missing translation seed for ${slug}/${locale}`);
    const frontmatter = {
      locale,
      classification: record.classification,
      title: record.project.title,
      elevatorPitch,
      challenge: record.project.summary,
      constraints: ["Publicar únicamente evidencia verificable y respetar los límites de confidencialidad."],
      strategy: "Convertir capacidades observables en una narrativa técnica, accesible y comercialmente útil.",
      solution: record.project.summary,
      capabilities: ["Web Experiences"],
      industries: ["Technology"],
      technologies: ["TypeScript"],
      outcomes: record.proofPoints.map((point: Record<string, unknown>) => ({ ...point, sourceLabel: record.sources[0].label, sourceUrl: record.sources[0].url })),
      liveUrl: record.links.find((link: { public: boolean }) => link.public)?.url,
      fallbackPoster: record.media.find((media: { role: string }) => media.role === "fallback-poster").path.replace("/media/", "/media/projects/"),
      confidentiality: record.publication.confidentiality,
      accessibilityNotes: ["La experiencia conserva contenido completo sin WebGL y con movimiento reducido."],
      relatedServices: ["Digital product engineering"],
      ctaPreset: slug
    };
    const body = locale === "es" ? "## Evidencia\n\nEste caso se publicará únicamente con afirmaciones clasificadas y fuentes revisadas.\n" : "## Evidence\n\nThis case is published only with classified claims and reviewed sources.\n";
    await writeFile(new URL(`${locale}/${slug}.md`, outputRoot), `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${body}`);
  }
}
```

- [ ] **Step 2: Run import and inspect all records**

```bash
pnpm import:evidence
find src/content/projects -type f -maxdepth 2 -print
pnpm check
```

Expected: twelve Markdown files and no content schema errors.

- [ ] **Step 3: Replace translation seed strings with editorially approved complete Spanish and English copy**

For each file, keep the exact schema fields and case-study order from section 13 of the approved specification. Do not add a numeric result unless it exists in the Phase 0 ledger as `verified-result` or `system-metric`.

- [ ] **Step 4: Commit**

```bash
git add scripts/import-evidence.ts src/content/projects
git commit -m "content: import bilingual flagship case studies"
```

### Task 5: Implement the Astro repository adapter and deterministic filters

**Files:**
- Create: `src/infrastructure/content/AstroProjectRepository.ts`
- Create: `src/features/evaluate-mode/projectFilters.ts`
- Create: `tests/project-filters.test.ts`

**Interfaces:**
- Produces: `filterProjects(projects, query)` and `AstroProjectRepository`.

- [ ] **Step 1: Write the failing filter tests**

```ts
import { describe, expect, it } from "vitest";
import { filterProjects } from "../src/features/evaluate-mode/projectFilters";
import type { PortfolioProject } from "../src/domain/projects/PortfolioProject";

const project = (slug: string, capabilities: string[], title: string): PortfolioProject => ({
  slug, locale: "es", classification: "real", title, elevatorPitch: title, challenge: title,
  constraints: ["constraint"], strategy: title, solution: title, capabilities, industries: ["Technology"],
  technologies: ["TypeScript"], outcomes: [{ kind: "demonstrated-capability", label: "Built", description: "Observable implementation" }],
  fallbackPoster: `/media/projects/${slug}/poster.avif`, confidentiality: "public",
  accessibilityNotes: ["Static parity"], relatedServices: ["Engineering"], ctaPreset: slug
});

const projects = [project("one", ["AI and Automation"], "Automation"), project("two", ["Web Experiences"], "Website")];

describe("project filters", () => {
  it("combines text and capability filters", () => {
    expect(filterProjects(projects, { locale: "es", capabilities: ["AI and Automation"], text: "auto" }).map((item) => item.slug)).toEqual(["one"]);
  });
});
```

- [ ] **Step 2: Create `projectFilters.ts`**

```ts
import type { PortfolioProject, ProjectQuery } from "../../domain/projects/PortfolioProject";

const normalize = (value: string): string => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function filterProjects(projects: PortfolioProject[], query: ProjectQuery): PortfolioProject[] {
  const text = normalize(query.text ?? "");
  return projects.filter((project) => {
    if (project.locale !== query.locale) return false;
    if (query.capabilities?.length && !query.capabilities.every((value) => project.capabilities.includes(value))) return false;
    if (query.industries?.length && !query.industries.every((value) => project.industries.includes(value))) return false;
    if (query.technologies?.length && !query.technologies.every((value) => project.technologies.includes(value))) return false;
    if (query.classification?.length && !query.classification.includes(project.classification)) return false;
    if (text) {
      const haystack = normalize([project.title, project.elevatorPitch, ...project.capabilities, ...project.industries, ...project.technologies].join(" "));
      if (!haystack.includes(text)) return false;
    }
    return true;
  });
}
```

- [ ] **Step 3: Create `AstroProjectRepository.ts`**

```ts
import { getCollection } from "astro:content";
import type { Locale, PortfolioProject, ProjectQuery } from "../../domain/projects/PortfolioProject";
import type { ProjectRepository } from "../../domain/projects/ProjectRepository";
import { filterProjects } from "../../features/evaluate-mode/projectFilters";

export class AstroProjectRepository implements ProjectRepository {
  async list(query: ProjectQuery): Promise<PortfolioProject[]> {
    const entries = await getCollection("projects");
    const projects = entries.map((entry) => ({ slug: entry.slug.split("/").at(-1) ?? entry.slug, ...entry.data })) as PortfolioProject[];
    return filterProjects(projects, query);
  }

  async getBySlug(slug: string, locale: Locale): Promise<PortfolioProject | null> {
    const projects = await this.list({ locale });
    return projects.find((project) => project.slug === slug) ?? null;
  }
}
```

- [ ] **Step 4: Test and commit**

```bash
pnpm test -- tests/project-filters.test.ts
pnpm check
git add src/infrastructure src/features/evaluate-mode tests/project-filters.test.ts
git commit -m "feat: add project repository and deterministic filters"
```

### Task 6: Build the bilingual layout, skip link, header, and mode switch

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/accessibility/SkipLink.astro`
- Create: `src/components/navigation/SiteHeader.astro`
- Create: `src/components/core/ModeSwitch.astro`
- Create: `src/pages/es/index.astro`
- Create: `src/pages/en/index.astro`

**Interfaces:**
- Produces: `BaseLayout` props `locale`, `title`, `description`, `canonicalPath`, and `alternatePath`.

- [ ] **Step 1: Create `SkipLink.astro`**

```astro
<a class="skip-link" href="#main-content">Saltar al contenido principal</a>
<style>
  .skip-link { position: fixed; inset: 0 auto auto 0; z-index: 1000; transform: translateY(-120%); padding: 1rem; background: var(--color-brand); color: white; }
  .skip-link:focus { transform: translateY(0); }
</style>
```

- [ ] **Step 2: Create `ModeSwitch.astro`**

```astro
---
interface Props { locale: "es" | "en"; active: "explore" | "evaluate"; }
const { locale, active } = Astro.props;
const labels = locale === "es" ? { explore: "Explorar", evaluate: "Evaluar" } : { explore: "Explore", evaluate: "Evaluate" };
const evaluateHref = locale === "es" ? "/es/proyectos/" : "/en/projects/";
const exploreHref = `/${locale}/`;
---
<nav aria-label={locale === "es" ? "Modo de experiencia" : "Experience mode"}>
  <a href={exploreHref} aria-current={active === "explore" ? "page" : undefined}>{labels.explore}</a>
  <a href={evaluateHref} aria-current={active === "evaluate" ? "page" : undefined}>{labels.evaluate}</a>
</nav>
```

- [ ] **Step 3: Create `SiteHeader.astro`**

```astro
---
import ModeSwitch from "../core/ModeSwitch.astro";
interface Props { locale: "es" | "en"; mode: "explore" | "evaluate"; }
const { locale, mode } = Astro.props;
const projectsHref = locale === "es" ? "/es/proyectos/" : "/en/projects/";
const diagnosticHref = locale === "es" ? "/es/diagnostico/" : "/en/diagnostic/";
---
<header class="container">
  <a href={`/${locale}/`} aria-label="IzignaMx home">IzignaMx</a>
  <ModeSwitch locale={locale} active={mode} />
  <nav aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
    <a href={projectsHref}>{locale === "es" ? "Proyectos" : "Projects"}</a>
    <a href={diagnosticHref}>{locale === "es" ? "Solicitar diagnóstico" : "Request a diagnostic"}</a>
  </nav>
</header>
```

- [ ] **Step 4: Create `BaseLayout.astro`**

```astro
---
import SkipLink from "../components/accessibility/SkipLink.astro";
import SiteHeader from "../components/navigation/SiteHeader.astro";
import "../styles/global.scss";
interface Props {
  locale: "es" | "en";
  title: string;
  description: string;
  canonicalPath: string;
  alternatePath: string;
  mode?: "explore" | "evaluate";
}
const { locale, title, description, canonicalPath, alternatePath, mode = "explore" } = Astro.props;
const alternateLocale = locale === "es" ? "en" : "es";
---
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(canonicalPath, Astro.site)} />
    <link rel="alternate" hreflang={alternateLocale} href={new URL(alternatePath, Astro.site)} />
    <link rel="alternate" hreflang="x-default" href={new URL("/", Astro.site)} />
  </head>
  <body>
    <SkipLink />
    <SiteHeader locale={locale} mode={mode} />
    <main id="main-content"><slot /></main>
  </body>
</html>
```

- [ ] **Step 5: Create the Spanish and English static Explore baselines**

Spanish headline: `Construimos experiencias digitales que aún no existen.`

English headline: `We build digital experiences that do not exist yet.`

Each route must include visible links to Evaluate mode and the diagnostic route before any future WebGL canvas.

- [ ] **Step 6: Build and commit**

```bash
pnpm build
git add src/layouts src/components/accessibility src/components/navigation src/components/core src/pages/es/index.astro src/pages/en/index.astro
git commit -m "feat: add bilingual accessible application shell"
```

### Task 7: Implement Evaluate mode as an accessible React island

**Files:**
- Create: `src/components/projects/ProjectCatalog.tsx`
- Create: `src/pages/es/proyectos/index.astro`
- Create: `src/pages/en/projects/index.astro`
- Create: `tests/ProjectCatalog.test.tsx`

**Interfaces:**
- Consumes: serialized `PortfolioProject[]`.
- Produces: search, capability filters, result count announcements, and project links.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectCatalog } from "../src/components/projects/ProjectCatalog";

const projects = [
  { slug: "omnisync", locale: "es", classification: "internal", title: "OmniSync", elevatorPitch: "Sincronización", challenge: "a", constraints: ["a"], strategy: "a", solution: "a", capabilities: ["Commerce Systems"], industries: ["Commerce"], technologies: ["TypeScript"], outcomes: [], fallbackPoster: "/media/projects/omnisync/poster.avif", confidentiality: "partial", accessibilityNotes: ["a"], relatedServices: ["a"], ctaPreset: "omnisync" }
] as const;

describe("ProjectCatalog", () => {
  it("filters and announces the result count", async () => {
    render(<ProjectCatalog locale="es" projects={[...projects]} />);
    await userEvent.type(screen.getByRole("searchbox"), "Omni");
    expect(screen.getByRole("status")).toHaveTextContent("1 proyecto");
  });
});
```

- [ ] **Step 2: Create `ProjectCatalog.tsx`**

```tsx
import { useMemo, useState } from "react";
import type { PortfolioProject } from "../../domain/projects/PortfolioProject";
import { filterProjects } from "../../features/evaluate-mode/projectFilters";

export function ProjectCatalog({ locale, projects }: { locale: "es" | "en"; projects: PortfolioProject[] }) {
  const [text, setText] = useState("");
  const [capability, setCapability] = useState("");
  const capabilities = useMemo(() => [...new Set(projects.flatMap((project) => project.capabilities))].sort(), [projects]);
  const filtered = useMemo(() => filterProjects(projects, { locale, text, capabilities: capability ? [capability] : undefined }), [projects, locale, text, capability]);
  const labels = locale === "es"
    ? { search: "Buscar proyectos", all: "Todas las capacidades", count: `${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}`, open: "Abrir caso" }
    : { search: "Search projects", all: "All capabilities", count: `${filtered.length} ${filtered.length === 1 ? "project" : "projects"}`, open: "Open case" };

  return <section aria-labelledby="catalog-title">
    <h1 id="catalog-title">{locale === "es" ? "Proyectos y capacidades" : "Projects and capabilities"}</h1>
    <label>{labels.search}<input type="search" value={text} onChange={(event) => setText(event.currentTarget.value)} /></label>
    <label>{locale === "es" ? "Capacidad" : "Capability"}
      <select value={capability} onChange={(event) => setCapability(event.currentTarget.value)}>
        <option value="">{labels.all}</option>
        {capabilities.map((value) => <option key={value}>{value}</option>)}
      </select>
    </label>
    <p role="status" aria-live="polite">{labels.count}</p>
    <ul>{filtered.map((project) => <li key={project.slug}>
      <img src={project.fallbackPoster} alt="" width="640" height="360" loading="lazy" />
      <h2>{project.title}</h2><p>{project.elevatorPitch}</p>
      <a href={locale === "es" ? `/es/proyectos/${project.slug}/` : `/en/projects/${project.slug}/`}>{labels.open}</a>
    </li>)}</ul>
  </section>;
}
```

- [ ] **Step 3: Create both Astro route adapters**

Each route instantiates `AstroProjectRepository`, loads its locale, renders `ProjectCatalog client:visible`, and supplies a static `<noscript>` list containing the same project links.

- [ ] **Step 4: Test, build, and commit**

```bash
pnpm test -- tests/ProjectCatalog.test.tsx
pnpm build
git add src/components/projects src/pages/es/proyectos src/pages/en/projects tests/ProjectCatalog.test.tsx
git commit -m "feat: deliver accessible Evaluate mode catalog"
```

### Task 8: Generate localized case-study routes

**Files:**
- Create: `src/pages/es/proyectos/[slug].astro`
- Create: `src/pages/en/projects/[slug].astro`
- Create: `src/components/projects/ProofPoint.astro`

**Interfaces:**
- Produces: static routes for all twelve localized content entries.

- [ ] **Step 1: Create `ProofPoint.astro`**

```astro
---
import type { ProofPoint } from "../../domain/projects/PortfolioProject";
interface Props { point: ProofPoint; locale: "es" | "en"; }
const { point, locale } = Astro.props;
const labels = {
  "verified-result": locale === "es" ? "Resultado verificado" : "Verified result",
  "system-metric": locale === "es" ? "Métrica del sistema" : "System metric",
  "expected-outcome": locale === "es" ? "Resultado esperado" : "Expected outcome",
  "demonstrated-capability": locale === "es" ? "Capacidad demostrada" : "Demonstrated capability"
};
---
<article>
  <p>{labels[point.kind]}</p>
  <h3>{point.label}</h3>
  {point.value && <strong>{point.value}</strong>}
  <p>{point.description}</p>
  {point.sourceUrl && <a href={point.sourceUrl} rel="external noopener noreferrer">{point.sourceLabel}</a>}
</article>
```

- [ ] **Step 2: Implement both dynamic routes**

Each route must:

1. Use `getStaticPaths()` from the `projects` collection.
2. Render classification before the project claim.
3. Render fallback poster with explicit dimensions.
4. Render problem, constraints, strategy, solution, outcomes, technologies, accessibility notes, and related services.
5. Render live and source links only when present.
6. Link to the localized diagnostic route with `project=<slug>` and `service=<ctaPreset>` URL parameters.
7. Include `CreativeWork` JSON-LD without unsupported metrics.

- [ ] **Step 3: Build and verify route count**

```bash
pnpm build
find dist/es/proyectos dist/en/projects -name index.html | wc -l
```

Expected: `12` or more when index routes are included; six detail pages per locale must exist.

- [ ] **Step 4: Commit**

```bash
git add src/pages/es/proyectos src/pages/en/projects src/components/projects/ProofPoint.astro
git commit -m "feat: generate evidence-backed case study routes"
```

### Task 9: Implement lead context and diagnostic wizard

**Files:**
- Create: `src/features/diagnostic/LeadContext.ts`
- Create: `src/components/conversion/DiagnosticWizard.tsx`
- Create: `tests/lead-context.test.ts`
- Create: `tests/DiagnosticWizard.test.tsx`

**Interfaces:**
- Produces: `parseLeadContext(url, locale)` and progressive diagnostic data.

- [ ] **Step 1: Write lead context tests**

```ts
import { describe, expect, it } from "vitest";
import { parseLeadContext } from "../src/features/diagnostic/LeadContext";

describe("lead context", () => {
  it("preserves project and campaign context without personal data", () => {
    const context = parseLeadContext(new URL("https://book.izignamx.com/es/diagnostico/?project=omnisync&service=commerce&utm_source=portfolio"), "es");
    expect(context).toEqual({
      sourceRoute: "/es/diagnostico/",
      sourceProject: "omnisync",
      selectedServices: ["commerce"],
      locale: "es",
      campaign: { utm_source: "portfolio" }
    });
  });
});
```

- [ ] **Step 2: Create `LeadContext.ts`**

```ts
export interface LeadContext {
  sourceRoute: string;
  sourceProject?: string;
  sourceCapability?: string;
  sourceConcept?: string;
  selectedServices: string[];
  locale: "es" | "en";
  campaign?: Record<string, string>;
}

const safeSlug = (value: string | null): string | undefined => value && /^[a-z0-9-]{1,80}$/.test(value) ? value : undefined;

export function parseLeadContext(url: URL, locale: "es" | "en"): LeadContext {
  const campaign = Object.fromEntries([...url.searchParams].filter(([key, value]) => key.startsWith("utm_") && /^[a-zA-Z0-9._-]{1,100}$/.test(value)));
  const service = safeSlug(url.searchParams.get("service"));
  return {
    sourceRoute: url.pathname,
    ...(safeSlug(url.searchParams.get("project")) && { sourceProject: safeSlug(url.searchParams.get("project")) }),
    ...(safeSlug(url.searchParams.get("capability")) && { sourceCapability: safeSlug(url.searchParams.get("capability")) }),
    ...(safeSlug(url.searchParams.get("concept")) && { sourceConcept: safeSlug(url.searchParams.get("concept")) }),
    selectedServices: service ? [service] : [],
    locale,
    ...(Object.keys(campaign).length && { campaign })
  };
}
```

- [ ] **Step 3: Create `DiagnosticWizard.tsx`**

The component must render one form with these required controls: name, contact method, organization/project, and desired build or improvement. Progressive controls are current URL, timing, budget range, integrations, and reference projects. It stores only unsent form state in `sessionStorage`, accepts an optional public HTTPS submission endpoint as a serializable prop, prevents double submission, and shows a plain-language fallback link when delivery is unavailable or fails. It must never claim successful delivery without a successful endpoint response.

The JSON request shape must be:

```ts
interface DiagnosticSubmission {
  name: string;
  contactMethod: string;
  organization: string;
  request: string;
  currentUrl?: string;
  timing?: string;
  budgetRange?: string;
  integrations?: string;
  references?: string;
  context: LeadContext;
  consent: true;
  website: "";
}
```

- [ ] **Step 4: Test keyboard progression, required validation, storage restoration, and retry behavior**

Use Testing Library to verify:

1. First field receives focus after heading navigation.
2. Submit is blocked while required fields are empty.
3. Session data restores after remount.
4. A failed fetch preserves data and enables a second explicit submit.
5. A successful fetch clears session data and announces completion.

- [ ] **Step 5: Commit**

```bash
pnpm test -- tests/lead-context.test.ts tests/DiagnosticWizard.test.tsx
git add src/features/diagnostic src/components/conversion tests/lead-context.test.ts tests/DiagnosticWizard.test.tsx
git commit -m "feat: add contextual diagnostic wizard"
```

### Task 10: Decide and configure the static-compatible diagnostic transport

**Files:**
- Create: `docs/adr/0003-form-backend.md`
- Create: `src/features/diagnostic/BrowserDiagnosticTransport.ts`
- Create: `tests/browser-diagnostic-transport.test.ts`

**Interfaces:**
- Consumes: `DiagnosticSubmission` JSON and a public HTTPS endpoint.
- Produces: a successful delivery result only after a successful external response.

- [ ] **Step 1: Record ADR 0003**

Document the selected external form processor or independently hosted endpoint,
including CORS behavior, server-side validation, rate limiting, spam controls,
retention/deletion policy, data location, availability, and fallback channel.
No provider secret may be present in the repository or browser bundle.

- [ ] **Step 2: Implement a browser transport**

Accept only a configured `https:` endpoint, submit the hosting-neutral JSON
contract, treat non-2xx responses as failures, and return no personal data to
analytics or logs. The endpoint is public configuration, not authentication.

- [ ] **Step 3: Test the boundary**

Verify invalid/non-HTTPS configuration fails loudly, non-2xx responses fail,
successful responses resolve, and no automatic retry occurs.

- [ ] **Step 4: Run and commit**

```bash
pnpm test -- tests/browser-diagnostic-transport.test.ts
git add docs/adr/0003-form-backend.md src/features/diagnostic/BrowserDiagnosticTransport.ts tests/browser-diagnostic-transport.test.ts
git commit -m "feat: configure static diagnostic transport"
```

### Task 11: Add accessibility, privacy, search, and metadata routes

**Files:**
- Create: localized accessibility and privacy pages.
- Create: `public/robots.txt`
- Create: `src/components/core/OrganizationSchema.astro`
- Modify: `BaseLayout.astro`

**Interfaces:**
- Produces: Organization JSON-LD, sitemap through Astro integration or explicit generation, privacy explanation, motion-control documentation.

- [ ] **Step 1: Create Organization schema**

```astro
---
const schema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "IzignaMx",
  url: "https://izignamx.com/",
  sameAs: ["https://github.com/IzignaMx", "https://github.com/CripterHack"]
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

- [ ] **Step 2: Create privacy and accessibility pages**

Each language must explain:

- Motion level control and reduced-motion parity.
- Canvas alternative content.
- Keyboard support.
- Data collected by the diagnostic form.
- Data excluded from analytics.
- Contact channels for accessibility feedback and privacy questions.

- [ ] **Step 3: Create `public/robots.txt`**

```text
User-agent: *
Allow: /
Sitemap: https://book.izignamx.com/sitemap-index.xml
```

- [ ] **Step 4: Add Pagefind markup**

Project title, elevator pitch, capabilities, industries, technologies, and case body must be inside an element with `data-pagefind-body`. Navigation, footer, and diagnostic form must use `data-pagefind-ignore`.

- [ ] **Step 5: Build and commit**

```bash
pnpm build
pnpm exec pagefind --site dist
git add src/pages public/robots.txt src/components/core/OrganizationSchema.astro src/layouts/BaseLayout.astro
git commit -m "feat: add discoverability privacy and accessibility routes"
```

### Task 12: Add end-to-end, accessibility, budget, and GitHub Pages deployment gates

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/static-flow.spec.ts`
- Create: `pa11yci.json`
- Create: `scripts/verify-budgets.ts`
- Create: `scripts/validate-built-html.ts`
- Create: `.github/workflows/quality.yml`
- Create: `public/CNAME`

**Interfaces:**
- Produces: a validated GitHub Pages artifact for `book.izignamx.com`.

- [ ] **Step 1: Create Playwright static-flow tests**

Tests must execute these exact flows:

1. Open `/es/` with reduced motion.
2. Follow Evaluate mode.
3. Filter by `Commerce Systems`.
4. Open OmniSync.
5. Follow contextual diagnostic CTA.
6. Verify project context exists in the page.
7. Submit against a mocked successful endpoint.
8. Switch to English.
9. Tab through all header and form controls without a keyboard trap.

- [ ] **Step 2: Create `scripts/verify-budgets.ts`**

The script must gzip every initial HTML, CSS, and JS asset, fail when critical HTML plus CSS exceeds 120 KB compressed, and fail when initial JavaScript referenced by `/es/index.html` exceeds 180 KB compressed. It must print each measured byte count.

- [ ] **Step 3: Create `scripts/validate-built-html.ts`**

The script must scan `dist/**/*.html` and fail for:

- invalid brand spelling,
- missing `<html lang>`,
- missing canonical link,
- project pages without a classification label,
- images without `alt`, `width`, or `height`,
- external `_blank` links without `noopener`.

- [ ] **Step 4: Configure the custom domain**

Create `public/CNAME` containing only `book.izignamx.com`. Keep root-relative
routes valid by deploying at the custom-domain root rather than a repository
subpath.

- [ ] **Step 5: Create CI workflow**

Jobs:

1. `quality`: install, evidence validation, Astro check, unit/component tests, build, built HTML validation, budget checks.
2. `e2e`: start preview, run Playwright in reduced motion and standard modes.
3. `accessibility`: run Pa11y against Spanish and English home, catalogs, OmniSync, Nómada, diagnostic, privacy, and accessibility routes.
4. `deploy`: upload the Pages artifact and deploy through the protected `github-pages` environment only after all previous jobs pass.

- [ ] **Step 6: Run, commit, and open PR**

```bash
pnpm check
pnpm test
pnpm build
pnpm test:e2e
pnpm exec pa11y-ci --config pa11yci.json
git add playwright.config.ts tests/e2e pa11yci.json scripts public/CNAME .github/workflows/quality.yml
git commit -m "ci: enforce static quality and GitHub Pages gates"
git push -u origin feat/phase-1-foundation
gh pr create \
  --base main \
  --head feat/phase-1-foundation \
  --title "Phase 1: deliver accessible static capability book" \
  --body "Adds bilingual static routing, validated case studies, Evaluate mode, contextual diagnostics, configurable external form delivery, SEO, privacy, accessibility, Pagefind, automated testing, budgets, and GitHub Pages deployment."
```

## Phase 1 acceptance checklist

- [ ] Site works with JavaScript disabled.
- [ ] Spanish and English routes are complete.
- [ ] Six projects render in both locales.
- [ ] Evaluate mode supports search and capability filtering.
- [ ] Reduced-motion visitors lose no content or action.
- [ ] Diagnostic context survives from project to form.
- [ ] Failed submission preserves user data.
- [ ] Static diagnostic transport passes HTTPS, failure, and configuration checks.
- [ ] No orange global accent or invalid brand spelling exists.
- [ ] Automated accessibility and keyboard flows pass.
- [ ] Static budget gates pass.
- [ ] GitHub Pages artifact deploys at `book.izignamx.com` after all quality gates pass.

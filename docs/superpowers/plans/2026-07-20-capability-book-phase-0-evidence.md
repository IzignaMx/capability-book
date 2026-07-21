# IzignaMx Capability Book Phase 0 Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a machine-validated evidence, ownership, link, asset, and claims ledger for the six flagship case studies before product code is written.

**Architecture:** The repository begins as a small TypeScript validation workspace. JSON evidence records are validated by JSON Schema and Vitest, while dedicated guards enforce canonical `IzignaMx` naming, forbid orange as a global accent, verify public links, and produce capture manifests consumed by later Astro content adapters.

**Tech Stack:** Node.js, pnpm, TypeScript strict, Vitest, Ajv, Playwright, GitHub Actions.

## Global Constraints

- The brand name MUST always be written exactly as `IzignaMx`.
- The principal accent is IzignaMx Blue `#3b82f6`.
- Orange MUST NOT be used as a global brand accent, CTA, focus, active, progress, selection, or identity color.
- Real work, open-source work, internal work, and concepts MUST be explicitly classified.
- Numeric claims MUST be classified as `verified-result`, `system-metric`, `expected-outcome`, or `demonstrated-capability`.
- No record may publish private or confidential details without an explicit public boundary.
- All six flagship records require a fallback poster and at least one source of technical evidence.
- Project text must use inclusive, respectful, non-speciesist language.
- Phase 0 may not introduce UI, WebGL, marketing claims, or production form handling.

---

## Dependency and delivery boundary

This plan is the prerequisite for:

1. `2026-07-20-capability-book-phase-1-foundation.md`
2. `2026-07-20-capability-book-phase-2-cinematic-slice.md`

Phase 0 is complete only when `pnpm validate:evidence` passes in CI and the generated summary reports six publishable flagship entries.

## File map

```text
.
├── .github/workflows/evidence.yml
├── data/
│   ├── evidence.schema.json
│   ├── evidence/
│   │   ├── developer-tools.json
│   │   ├── hamburguesa-nomada.json
│   │   ├── nutrichilango.json
│   │   ├── omnisync.json
│   │   ├── tecuiyo.json
│   │   └── vald.json
│   ├── media-manifest.json
│   └── measurement-plan.json
├── docs/
│   ├── brand/identity-constraints.md
│   ├── evidence/README.md
│   └── superpowers/specs/2026-07-20-izignamx-capability-book-design.md
├── scripts/
│   ├── capture-projects.ts
│   ├── check-brand.ts
│   ├── check-links.ts
│   ├── generate-evidence-summary.ts
│   └── validate-evidence.ts
├── tests/
│   ├── brand-guard.test.ts
│   ├── evidence-schema.test.ts
│   └── link-policy.test.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts
```

### Task 1: Create the repository and validation workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Preserve: `docs/brand/identity-constraints.md`
- Preserve: `docs/superpowers/specs/2026-07-20-izignamx-capability-book-design.md`

**Interfaces:**
- Produces: `pnpm test`, `pnpm validate:evidence`, and a strict TypeScript runtime for later tasks.

- [ ] **Step 1: Create and enter the repository**

```bash
gh repo create IzignaMx/capability-book \
  --private \
  --description "IzignaMx immersive capability book and verified portfolio" \
  --clone
cd capability-book
git switch -c feat/phase-0-evidence
mkdir -p docs/brand docs/superpowers/specs
```

Expected: an empty repository on branch `feat/phase-0-evidence`.

- [ ] **Step 2: Copy the approved specification files without altering them**

```bash
cp /mnt/data/izignamx-capability-book-spec/docs/superpowers/specs/2026-07-20-izignamx-capability-book-design.md \
  docs/superpowers/specs/2026-07-20-izignamx-capability-book-design.md
cp /mnt/data/izignamx-capability-book-spec/docs/brand/identity-constraints.md \
  docs/brand/identity-constraints.md
```

Expected: both approved files exist and `grep -R "IzignaMx" docs` finds the canonical name.

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "@izignamx/capability-book",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "check:brand": "tsx scripts/check-brand.ts",
    "check:links": "tsx scripts/check-links.ts",
    "validate:evidence": "tsx scripts/validate-evidence.ts && pnpm check:brand && pnpm test",
    "evidence:summary": "tsx scripts/generate-evidence-summary.ts",
    "capture:projects": "tsx scripts/capture-projects.ts"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@types/node": "latest",
    "ajv": "latest",
    "ajv-formats": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["scripts/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
      }
    }
  }
});
```

- [ ] **Step 6: Install, type-check, and commit**

```bash
pnpm install
pnpm typecheck
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts docs
git commit -m "chore: initialize IzignaMx evidence workspace"
```

Expected: type checking exits `0`.

### Task 2: Define and test the evidence schema

**Files:**
- Create: `data/evidence.schema.json`
- Create: `tests/evidence-schema.test.ts`
- Create: `scripts/validate-evidence.ts`

**Interfaces:**
- Produces: JSON records with `project`, `classification`, `publication`, `proofPoints`, `sources`, `links`, and `media`.
- Consumed by: Phase 1 content import adapter.

- [ ] **Step 1: Write the failing schema test**

```ts
import { readFile } from "node:fs/promises";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

const schema = JSON.parse(
  await readFile(new URL("../data/evidence.schema.json", import.meta.url), "utf8")
);

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

describe("evidence schema", () => {
  it("rejects an unsupported brand spelling and an unclassified outcome", () => {
    const valid = validate({
      project: { slug: "sample", title: "Izigna" },
      classification: "real",
      publication: { confidentiality: "public", publishable: true },
      proofPoints: [{ kind: "claim", label: "Fast", description: "Fast" }],
      sources: [],
      links: [],
      media: []
    });

    expect(valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm test -- tests/evidence-schema.test.ts
```

Expected: FAIL because `data/evidence.schema.json` does not exist.

- [ ] **Step 3: Create `data/evidence.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://book.izignamx.com/schemas/evidence.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["project", "classification", "publication", "proofPoints", "sources", "links", "media"],
  "properties": {
    "project": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slug", "title", "owner", "summary"],
      "properties": {
        "slug": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        "title": { "type": "string", "minLength": 2, "not": { "pattern": "^(Izigna|IzignaMX|Izignamx|IZIGNA)$" } },
        "owner": { "enum": ["IzignaMx", "Edgar Zorrilla", "Shared"] },
        "summary": { "type": "string", "minLength": 30 }
      }
    },
    "classification": { "enum": ["real", "open-source", "internal", "concept"] },
    "publication": {
      "type": "object",
      "additionalProperties": false,
      "required": ["confidentiality", "publishable", "reviewedAt"],
      "properties": {
        "confidentiality": { "enum": ["public", "partial", "private"] },
        "publishable": { "type": "boolean" },
        "reviewedAt": { "type": "string", "format": "date" },
        "notes": { "type": "string" }
      }
    },
    "proofPoints": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["kind", "label", "description", "sourceIds"],
        "properties": {
          "kind": { "enum": ["verified-result", "system-metric", "expected-outcome", "demonstrated-capability"] },
          "label": { "type": "string", "minLength": 2 },
          "value": { "type": "string" },
          "description": { "type": "string", "minLength": 10 },
          "sourceIds": { "type": "array", "minItems": 1, "items": { "type": "string" } }
        }
      }
    },
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "label", "type", "url"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "label": { "type": "string" },
          "type": { "enum": ["live", "repository", "documentation", "analytics", "client-confirmation", "test-report"] },
          "url": { "type": "string", "format": "uri" }
        }
      }
    },
    "links": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["label", "url", "public"],
        "properties": {
          "label": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "public": { "type": "boolean" }
        }
      }
    },
    "media": {
      "type": "array",
      "minItems": 1,
      "contains": {
        "type": "object",
        "properties": { "role": { "const": "fallback-poster" } },
        "required": ["role"]
      },
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "role", "path", "license"],
        "properties": {
          "id": { "type": "string" },
          "role": { "enum": ["fallback-poster", "screenshot", "video", "diagram", "logo"] },
          "path": { "type": "string", "pattern": "^/media/" },
          "license": { "enum": ["owned", "client-authorized", "open-license"] }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Create `scripts/validate-evidence.ts`**

```ts
import { readdir, readFile } from "node:fs/promises";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const root = new URL("../", import.meta.url);
const schema = JSON.parse(await readFile(new URL("data/evidence.schema.json", root), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const directory = new URL("data/evidence/", root);
const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();

if (files.length !== 6) {
  throw new Error(`Expected exactly 6 flagship evidence files, found ${files.length}`);
}

for (const file of files) {
  const value = JSON.parse(await readFile(new URL(file, directory), "utf8"));
  if (!validate(value)) {
    throw new Error(`${file}: ${ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }
  const sourceIds = new Set(value.sources.map((source: { id: string }) => source.id));
  for (const point of value.proofPoints) {
    for (const sourceId of point.sourceIds) {
      if (!sourceIds.has(sourceId)) throw new Error(`${file}: proof point references missing source ${sourceId}`);
    }
  }
}

console.log(`Validated ${files.length} flagship evidence records.`);
```

- [ ] **Step 5: Run the test and commit**

```bash
pnpm test -- tests/evidence-schema.test.ts
git add data/evidence.schema.json scripts/validate-evidence.ts tests/evidence-schema.test.ts
git commit -m "feat: define flagship evidence schema"
```

Expected: PASS.

### Task 3: Add the six flagship evidence records

**Files:**
- Create: `scripts/seed-evidence.ts`
- Create: `data/evidence/omnisync.json`
- Create: `data/evidence/hamburguesa-nomada.json`
- Create: `data/evidence/vald.json`
- Create: `data/evidence/nutrichilango.json`
- Create: `data/evidence/tecuiyo.json`
- Create: `data/evidence/developer-tools.json`

**Interfaces:**
- Produces: six schema-valid, publishable evidence entries with concrete sources and no unsupported commercial metrics.

- [ ] **Step 1: Create `scripts/seed-evidence.ts` with the complete approved seed data**

```ts
import { mkdir, writeFile } from "node:fs/promises";

const reviewedAt = "2026-07-20";
const media = (slug: string) => [{ id: "fallback-poster", role: "fallback-poster", path: `/media/${slug}/poster.avif`, license: "owned" }];
const publication = (confidentiality: "public" | "partial", notes: string) => ({ confidentiality, publishable: true, reviewedAt, notes });

const records = [
  {
    project: {
      slug: "omnisync",
      title: "OmniSync",
      owner: "IzignaMx",
      summary: "Plataforma multicanal que sincroniza inventario, precios, pedidos y estados operativos entre Shopify y canales externos."
    },
    classification: "internal",
    publication: publication("partial", "Publicar únicamente arquitectura y comportamiento visibles o revisados para difusión."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Arquitectura por adaptadores", description: "Los canales se integran mediante contratos desacoplados que permiten ampliar el sistema sin modificar el núcleo.", sourceIds: ["repository"] },
      { kind: "demonstrated-capability", label: "Protección de precios", description: "El sistema distingue sincronización de inventario y reglas de precio para evitar sobrescrituras no deseadas.", sourceIds: ["repository"] },
      { kind: "demonstrated-capability", label: "Procesamiento asíncrono", description: "Colas, webhooks y estados en tiempo real coordinan operaciones multicanal y recuperación ante fallos.", sourceIds: ["repository"] }
    ],
    sources: [
      { id: "repository", label: "Repositorio privado OmniSync", type: "repository", url: "https://github.com/IzignaMx/OmniSync" },
      { id: "live", label: "Producto OmniSync", type: "live", url: "https://omnisync.izignamx.com/" }
    ],
    links: [
      { label: "Producto OmniSync", url: "https://omnisync.izignamx.com/", public: true },
      { label: "Repositorio privado", url: "https://github.com/IzignaMx/OmniSync", public: false }
    ],
    media: media("omnisync")
  },
  {
    project: {
      slug: "hamburguesa-nomada",
      title: "Hamburguesa Nómada",
      owner: "IzignaMx",
      summary: "Centro digital para un evento comunitario ciclista con resultados, reconocimientos descargables, códigos QR y catálogo basado en plantas."
    },
    classification: "real",
    publication: publication("public", "El caso puede mostrar funciones públicas y el contexto comunitario autorizado."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Reconocimientos digitales", description: "La plataforma consulta resultados y genera tarjetas descargables vinculadas mediante códigos QR.", sourceIds: ["repository", "live"] },
      { kind: "demonstrated-capability", label: "Actualización automatizada", description: "Un flujo programado detecta cambios de datos y vuelve a publicar el sitio sin intervención manual.", sourceIds: ["repository"] },
      { kind: "demonstrated-capability", label: "Experiencia PWA", description: "La aplicación prioriza acceso móvil, compartir contenido y continuidad bajo condiciones de conectividad limitada.", sourceIds: ["repository", "live"] }
    ],
    sources: [
      { id: "repository", label: "Repositorio Hamburguesa Nómada", type: "repository", url: "https://github.com/IzignaMx/hamburguesa-nomada" },
      { id: "live", label: "Sitio Hamburguesa Nómada", type: "live", url: "https://nomada.izignamx.com/" }
    ],
    links: [
      { label: "Sitio público", url: "https://nomada.izignamx.com/", public: true },
      { label: "Código fuente", url: "https://github.com/IzignaMx/hamburguesa-nomada", public: true }
    ],
    media: media("hamburguesa-nomada")
  },
  {
    project: {
      slug: "vald",
      title: "VALD",
      owner: "IzignaMx",
      summary: "Experiencia digital de ultraciclismo que organiza ruta, elevación, cronología, resultados, galería y patrocinadores en una entrega estática."
    },
    classification: "real",
    publication: publication("public", "El sitio y el repositorio son públicos; las afirmaciones se limitan a comportamiento observable."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Narrativa de ruta", description: "La experiencia integra cronología, elevación, puntos de control y resultados en una estructura editorial modular.", sourceIds: ["repository", "live"] },
      { kind: "demonstrated-capability", label: "Arquitectura estática", description: "Astro, estilos modulares y generación estática reducen dependencias de ejecución y favorecen despliegues simples.", sourceIds: ["repository"] },
      { kind: "demonstrated-capability", label: "Continuidad móvil", description: "La interfaz se diseñó con enfoque mobile-first, soporte PWA y contenido utilizable sin animaciones avanzadas.", sourceIds: ["repository", "live"] }
    ],
    sources: [
      { id: "repository", label: "Repositorio VALD", type: "repository", url: "https://github.com/IzignaMx/vald-landing" },
      { id: "live", label: "Sitio VALD", type: "live", url: "https://vald.izignamx.com/" }
    ],
    links: [
      { label: "Sitio público", url: "https://vald.izignamx.com/", public: true },
      { label: "Código fuente", url: "https://github.com/IzignaMx/vald-landing", public: true }
    ],
    media: media("vald")
  },
  {
    project: {
      slug: "nutrichilango",
      title: "NutriChilango",
      owner: "IzignaMx",
      summary: "Plataforma de comparación de precios, nutrición, disponibilidad y recetas para facilitar decisiones informadas sobre alternativas vegetales en CDMX."
    },
    classification: "real",
    publication: publication("public", "Las fuentes, cálculos y actualizaciones deben conservar trazabilidad editorial."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Comparación multidimensional", description: "La plataforma relaciona precio, nutrición y disponibilidad mediante filtros, rankings y visualizaciones.", sourceIds: ["repository", "live"] },
      { kind: "demonstrated-capability", label: "Datos geográficos", description: "Mapas y ubicaciones permiten explorar alternativas vegetales según contexto territorial.", sourceIds: ["repository", "live"] },
      { kind: "demonstrated-capability", label: "Actualizaciones programadas", description: "Procesos automatizados mantienen información y contenido sin requerir una aplicación de servidor permanente.", sourceIds: ["repository"] }
    ],
    sources: [
      { id: "repository", label: "Repositorio NutriChilango", type: "repository", url: "https://github.com/IzignaMx/nutrichilango" },
      { id: "live", label: "Sitio NutriChilango", type: "live", url: "https://nutrichilango.izignamx.com/" }
    ],
    links: [
      { label: "Sitio público", url: "https://nutrichilango.izignamx.com/", public: true },
      { label: "Código fuente", url: "https://github.com/IzignaMx/nutrichilango", public: true }
    ],
    media: media("nutrichilango")
  },
  {
    project: {
      slug: "tecuiyo",
      title: "Tecuiyo",
      owner: "Edgar Zorrilla",
      summary: "Plataforma cívica abierta que organiza información, búsquedas, cálculos y documentos para comprender derechos laborales en México."
    },
    classification: "real",
    publication: publication("public", "La plataforma informa y orienta; no debe presentarse como sustituto de asesoría jurídica profesional."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Consulta estructurada", description: "Búsqueda y navegación temática conectan preguntas laborales con contenido y herramientas relevantes.", sourceIds: ["repository", "live"] },
      { kind: "demonstrated-capability", label: "Cálculos y documentos", description: "La plataforma integra calculadoras y generación de documentos dentro de una experiencia accesible.", sourceIds: ["repository"] },
      { kind: "demonstrated-capability", label: "Arquitectura de producto", description: "React, TypeScript y componentes accesibles separan contenido, datos, navegación y estados de interfaz.", sourceIds: ["repository"] }
    ],
    sources: [
      { id: "repository", label: "Repositorio Tecuiyo", type: "repository", url: "https://github.com/CripterHack/tecuiyo-derechos-mx" },
      { id: "live", label: "Sitio Tecuiyo", type: "live", url: "https://tecuiyo.izignamx.com/" }
    ],
    links: [
      { label: "Sitio público", url: "https://tecuiyo.izignamx.com/", public: true },
      { label: "Código fuente", url: "https://github.com/CripterHack/tecuiyo-derechos-mx", public: true }
    ],
    media: media("tecuiyo")
  },
  {
    project: {
      slug: "developer-tools",
      title: "Developer Tools Collection",
      owner: "Edgar Zorrilla",
      summary: "Colección abierta de herramientas para commits asistidos por IA, descarga autenticada de contenido y edición visual dentro de BigCommerce."
    },
    classification: "open-source",
    publication: publication("public", "Cada herramienta conserva su licencia, límites de uso, privacidad y documentación pública."),
    proofPoints: [
      { kind: "demonstrated-capability", label: "Smart Git Commit", description: "CLI que analiza cambios, propone agrupaciones atómicas y genera mensajes compatibles con Conventional Commits mediante modelos locales.", sourceIds: ["smart-git"] },
      { kind: "demonstrated-capability", label: "Instagram Downloader Skill", description: "Skill y CLI que coordinan sesión autenticada, automatización de navegador y rutas de recuperación sin solicitar contraseñas.", sourceIds: ["instagram-skill"] },
      { kind: "demonstrated-capability", label: "BigCommerce WYSIWYG Extension", description: "Extensión que incorpora edición visual local en Page Builder respetando restricciones de seguridad del navegador.", sourceIds: ["bigcommerce-extension"] }
    ],
    sources: [
      { id: "smart-git", label: "Repositorio Smart Git Commit", type: "repository", url: "https://github.com/CripterHack/smart-git-commit" },
      { id: "instagram-skill", label: "Repositorio Instagram Downloader Skill", type: "repository", url: "https://github.com/CripterHack/ig-downloader-skill" },
      { id: "bigcommerce-extension", label: "Repositorio BigCommerce WYSIWYG Extension", type: "repository", url: "https://github.com/CripterHack/bigcommerce-wysiwyg-extension" },
      { id: "live", label: "Catálogo de aplicaciones IzignaMx", type: "live", url: "https://apps.izignamx.com/" }
    ],
    links: [
      { label: "Catálogo de aplicaciones", url: "https://apps.izignamx.com/", public: true },
      { label: "Smart Git Commit", url: "https://github.com/CripterHack/smart-git-commit", public: true },
      { label: "Instagram Downloader Skill", url: "https://github.com/CripterHack/ig-downloader-skill", public: true },
      { label: "BigCommerce WYSIWYG Extension", url: "https://github.com/CripterHack/bigcommerce-wysiwyg-extension", public: true }
    ],
    media: media("developer-tools")
  }
] as const;

const directory = new URL("../data/evidence/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const record of records) {
  await writeFile(new URL(`${record.project.slug}.json`, directory), `${JSON.stringify(record, null, 2)}\n`);
}
console.log(`Seeded ${records.length} flagship evidence records.`);
```

- [ ] **Step 2: Generate and validate the records**

```bash
pnpm exec tsx scripts/seed-evidence.ts
pnpm validate:evidence
```

Expected: `Seeded 6 flagship evidence records.` followed by `Validated 6 flagship evidence records.`

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-evidence.ts data/evidence
git commit -m "docs: add verified flagship evidence ledger"
```

### Task 4: Enforce naming and palette constraints automatically

**Files:**
- Create: `scripts/check-brand.ts`
- Create: `tests/brand-guard.test.ts`

**Interfaces:**
- Produces: `scanBrandViolations(text, path)` and a CLI that exits non-zero on violations.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { scanBrandViolations } from "../scripts/check-brand.js";

describe("brand guard", () => {
  it("rejects invalid names and orange identity tokens", () => {
    expect(scanBrandViolations("IzignaMX --color-brand: #ff6a1a", "sample.css")).toEqual([
      "sample.css: disallowed brand spelling IzignaMX",
      "sample.css: orange cannot be assigned to a global brand token"
    ]);
  });

  it("accepts canonical naming and blue", () => {
    expect(scanBrandViolations("IzignaMx --color-brand: #3b82f6", "sample.css")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
pnpm test -- tests/brand-guard.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create `scripts/check-brand.ts`**

```ts
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const invalidNames = [
  { label: "IzignaMX", pattern: /\bIzignaMX\b/ },
  { label: "Izignamx", pattern: /\bIzignamx\b/ },
  { label: "IZIGNA", pattern: /\bIZIGNA\b/ },
  { label: "Izigna", pattern: /\bIzigna\b(?!Mx)/ }
];
const orangePattern = /--(?:color-)?(?:brand|accent|primary|focus|active|selection)\s*:\s*(?:#ff6a1a|#f97316|orange)\b/i;

export function scanBrandViolations(text: string, filePath: string): string[] {
  const violations: string[] = [];
  for (const rule of invalidNames) {
    if (rule.pattern.test(text)) violations.push(`${filePath}: disallowed brand spelling ${rule.label}`);
  }
  if (orangePattern.test(text)) violations.push(`${filePath}: orange cannot be assigned to a global brand token`);
  return violations;
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];
  for (const entry of entries) {
    const resolved = path.join(directory, entry);
    const metadata = await stat(resolved);
    if (metadata.isDirectory()) files.push(...(await collectFiles(resolved)));
    else if (/\.(astro|css|json|md|mdx|scss|ts|tsx|yml|yaml)$/.test(entry)) files.push(resolved);
  }
  return files;
}

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const roots = ["src", "public", "data", "docs/evidence"];
  const files = (await Promise.all(roots.map(async (entry) => {
    try { return await collectFiles(path.join(root, entry)); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }))).flat();
  const violations = (
    await Promise.all(files.map(async (file) => scanBrandViolations(await readFile(file, "utf8"), path.relative(root, file))))
  ).flat();
  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 4: Run and commit**

```bash
pnpm test -- tests/brand-guard.test.ts
pnpm check:brand
git add scripts/check-brand.ts tests/brand-guard.test.ts
git commit -m "test: enforce IzignaMx identity constraints"
```

Expected: PASS and no brand violations.

### Task 5: Add deterministic link policy and verification

**Files:**
- Create: `scripts/check-links.ts`
- Create: `tests/link-policy.test.ts`

**Interfaces:**
- Produces: `isAllowedPublicUrl(url)` and a live link checker with controlled timeout and one retry.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isAllowedPublicUrl } from "../scripts/check-links.js";

describe("public link policy", () => {
  it("allows HTTPS and rejects localhost, credentials, and insecure HTTP", () => {
    expect(isAllowedPublicUrl("https://nomada.izignamx.com/")).toBe(true);
    expect(isAllowedPublicUrl("http://localhost:4321/")).toBe(false);
    expect(isAllowedPublicUrl("https://user:pass@example.com/")).toBe(false);
    expect(isAllowedPublicUrl("http://example.com/")).toBe(false);
  });
});
```

- [ ] **Step 2: Create `scripts/check-links.ts`**

```ts
import { readdir, readFile } from "node:fs/promises";

export function isAllowedPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function request(url: string): Promise<number> {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    headers: { "user-agent": "IzignaMx-Capability-Book-Link-Check/1.0" }
  });
  return response.status;
}

async function main(): Promise<void> {
  const directory = new URL("../data/evidence/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
  const urls = new Set<string>();
  for (const file of files) {
    const record = JSON.parse(await readFile(new URL(file, directory), "utf8"));
    for (const link of record.links) if (link.public) urls.add(link.url);
  }
  for (const url of urls) {
    if (!isAllowedPublicUrl(url)) throw new Error(`Disallowed public URL: ${url}`);
    let status: number;
    try {
      status = await request(url);
    } catch {
      status = await request(url);
    }
    if (status >= 400) throw new Error(`${url} returned HTTP ${status}`);
    console.log(`${status} ${url}`);
  }
}

if (process.argv[1]?.endsWith("check-links.ts")) await main();
```

- [ ] **Step 3: Run and commit**

```bash
pnpm test -- tests/link-policy.test.ts
pnpm check:links
git add scripts/check-links.ts tests/link-policy.test.ts
git commit -m "test: verify flagship public links"
```

Expected: tests pass and each public URL returns a status below `400`.

### Task 6: Build the media capture manifest and capture script

**Files:**
- Create: `data/media-manifest.json`
- Create: `scripts/capture-projects.ts`
- Create: `public/media/.gitkeep`

**Interfaces:**
- Produces: desktop and mobile PNG evidence captures under `artifacts/captures/<slug>/`.
- Does not produce final optimized posters. Phase 1 converts approved captures to AVIF.

- [ ] **Step 1: Create `data/media-manifest.json`**

```json
{
  "viewports": [
    { "name": "mobile", "width": 390, "height": 844 },
    { "name": "desktop", "width": 1440, "height": 900 }
  ],
  "projects": [
    { "slug": "omnisync", "url": "https://omnisync.izignamx.com/" },
    { "slug": "hamburguesa-nomada", "url": "https://nomada.izignamx.com/" },
    { "slug": "vald", "url": "https://vald.izignamx.com/" },
    { "slug": "nutrichilango", "url": "https://nutrichilango.izignamx.com/" },
    { "slug": "tecuiyo", "url": "https://tecuiyo.izignamx.com/" },
    { "slug": "developer-tools", "url": "https://apps.izignamx.com/" }
  ]
}
```

- [ ] **Step 2: Create `scripts/capture-projects.ts`**

```ts
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const manifest = JSON.parse(await readFile(new URL("../data/media-manifest.json", import.meta.url), "utf8"));
const browser = await chromium.launch();

try {
  for (const project of manifest.projects) {
    for (const viewport of manifest.viewports) {
      const page = await browser.newPage({ viewport });
      await page.goto(project.url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const directory = new URL(`../artifacts/captures/${project.slug}/`, import.meta.url);
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        path: new URL(`${viewport.name}.png`, directory).pathname,
        fullPage: true,
        animations: "disabled"
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
```

- [ ] **Step 3: Install browser, capture, and commit the manifest only**

```bash
pnpm exec playwright install chromium
pnpm capture:projects
git add data/media-manifest.json scripts/capture-projects.ts public/media/.gitkeep
git commit -m "chore: add reproducible project capture pipeline"
```

Expected: twelve PNG files exist under `artifacts/captures/`; raw captures remain ignored until editorial approval.

### Task 7: Define the analytics measurement plan and evidence summary

**Files:**
- Create: `data/measurement-plan.json`
- Create: `scripts/generate-evidence-summary.ts`
- Create: `docs/evidence/README.md`

**Interfaces:**
- Produces: `artifacts/evidence-summary.md` and event definitions consumed by Phase 1.

- [ ] **Step 1: Create `data/measurement-plan.json`**

```json
{
  "privacy": {
    "collectPersonalDataInEvents": false,
    "collectFormContentInAnalytics": false,
    "retentionDecision": "ADR-0002"
  },
  "events": [
    "explore_started",
    "mode_changed",
    "capability_viewed",
    "project_opened",
    "project_scene_engaged",
    "live_demo_clicked",
    "source_clicked",
    "concept_viewed",
    "diagnostic_started",
    "diagnostic_completed",
    "contact_channel_selected"
  ],
  "dimensions": ["locale", "sourceRoute", "sourceProject", "sourceCapability", "sourceConcept"],
  "forbiddenDimensions": ["name", "email", "phone", "message", "organization"]
}
```

- [ ] **Step 2: Create `scripts/generate-evidence-summary.ts`**

```ts
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const directory = new URL("../data/evidence/", import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
const records = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, directory), "utf8"))));
const lines = [
  "# Flagship evidence summary",
  "",
  "| Project | Classification | Publishable | Proof points | Public links |",
  "|---|---|---:|---:|---:|",
  ...records.map((record) => `| ${record.project.title} | ${record.classification} | ${record.publication.publishable ? "yes" : "no"} | ${record.proofPoints.length} | ${record.links.filter((link: { public: boolean }) => link.public).length} |`),
  ""
];
const artifacts = new URL("../artifacts/", import.meta.url);
await mkdir(artifacts, { recursive: true });
await writeFile(new URL("evidence-summary.md", artifacts), lines.join("\n"));
```

- [ ] **Step 3: Create `docs/evidence/README.md`**

```markdown
# Evidence workflow

A project is publishable only when its JSON record validates, its public links pass, its ownership and confidentiality boundary are reviewed, every proof point cites at least one source, and a licensed fallback poster is listed.

Raw captures are review artifacts. They do not become public media until approved, cropped, optimized, supplied with alt text, and copied into `public/media/<project>/`.

Numeric claims are prohibited unless their `kind` and source support the wording used in the public case study.
```

- [ ] **Step 4: Generate, inspect, and commit**

```bash
pnpm evidence:summary
cat artifacts/evidence-summary.md
git add data/measurement-plan.json scripts/generate-evidence-summary.ts docs/evidence/README.md
git commit -m "docs: define evidence and measurement workflow"
```

Expected: summary contains six rows.

### Task 8: Add the Phase 0 CI release gate

**Files:**
- Create: `.github/workflows/evidence.yml`
- Modify: `.gitignore`

**Interfaces:**
- Produces: required CI checks `evidence / validate` and `evidence / links`.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
coverage/
artifacts/captures/
artifacts/evidence-summary.md
.env
.DS_Store
```

- [ ] **Step 2: Create `.github/workflows/evidence.yml`**

```yaml
name: evidence

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm validate:evidence
      - run: pnpm evidence:summary
      - uses: actions/upload-artifact@v4
        with:
          name: evidence-summary
          path: artifacts/evidence-summary.md

  links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check:links
```

- [ ] **Step 3: Run the full local gate**

```bash
pnpm typecheck
pnpm validate:evidence
pnpm check:links
pnpm evidence:summary
```

Expected: every command exits `0`.

- [ ] **Step 4: Commit and open the Phase 0 pull request**

```bash
git add .gitignore .github/workflows/evidence.yml
git commit -m "ci: enforce flagship evidence release gate"
git push -u origin feat/phase-0-evidence
gh pr create \
  --base main \
  --head feat/phase-0-evidence \
  --title "Phase 0: establish verified portfolio evidence" \
  --body "Creates the machine-validated evidence ledger, brand guard, link verification, reproducible capture pipeline, measurement plan, and CI gates for six flagship IzignaMx case studies."
```

## Phase 0 acceptance checklist

- [ ] Exactly six flagship evidence records validate.
- [ ] Every proof point cites a source ID present in its record.
- [ ] Every record includes a licensed fallback poster path.
- [ ] Public links use HTTPS and return below HTTP 400.
- [ ] No unsupported `IzignaMx` spelling appears.
- [ ] No orange global accent token appears.
- [ ] Confidentiality and publishability are explicit.
- [ ] Raw captures exist for 390×844 and 1440×900.
- [ ] The evidence summary contains six project rows.
- [ ] GitHub Actions passes on the pull request.

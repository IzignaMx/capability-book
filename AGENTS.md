# IzignaMx Book — Agent Guide

Bilingual (es/en) Astro 7 static portfolio site at [book.izignamx.com](https://book.izignamx.com/). Evidence-backed Book with a cinematic 3D Explore layer.

## Quick start

```bash
pnpm install          # pnpm 10.13.1 required (engine-strict in .npmrc)
pnpm dev              # astro dev server
pnpm build            # full CI pipeline: astro check → build → pagefind → validate:html → verify:budgets
pnpm test             # vitest unit tests (jsdom, globals)
pnpm test:e2e         # playwright e2e (builds + serves on :4333)
pnpm test:a11y        # pa11y-ci WCAG2AA audit (requires preview on :4321)
pnpm check            # astro check + tsc --noEmit + brand check
pnpm validate:evidence # schema + slug + source ref validation on data/evidence/*.json
```

## CI pipeline order (quality.yml)

1. `pnpm validate:evidence` — schema + cross-ref integrity
2. `pnpm check` — astro check, tsc, brand scan
3. `pnpm test` — vitest unit tests
4. `pnpm build` — full production build
5. `pnpm verify:3d-budgets` — gzip budgets for JS, models, posters
6. e2e (Playwright) — sequential after quality
7. a11y (Pa11y) — sequential after quality
8. deploy — only on `main`, non-PR, after quality+e2e+a11y

## Architecture

- **Astro 7** static site, `output: "static"`, `trailingSlash: "always"`
- **Bilingual**: `/es/` and `/en/` routes with parallel content trees
- **React islands**: `@astrojs/react` for interactive components (3D canvas, diagnostic wizard)
- **SCSS** via `sass` — tokens in `src/styles/tokens.scss`, global in `global.scss`
- **Two modes**: `explore` (scroll-narrative with 3D) and `evaluate` (project catalog + diagnostic)
- **Content**: Astro content collections (`src/content/projects/` per locale, `src/content/capabilities/`)
- **Evidence**: `data/evidence/*.json` validated against `data/evidence.schema.json` (AJV, strict mode)
- **3D**: Three.js + React Three Fiber, deferred scene loading, adaptive quality probe
- **Motion**: GSAP + ScrollTrigger isolated behind `src/motion/` interfaces (see ADR-0004)
- **Domain**: `src/domain/projects/` (PortfolioProject, ProjectRepository) → `src/infrastructure/content/AstroProjectRepository.ts`

## Brand constraints (enforced in CI)

- Brand name is **always** `IzignaMx` — never `IzignaMX`, `Izignamx`, `IZIGNA`, or bare `Izigna`
- Primary accent: IzignaMx Blue `#3b82f6` — **orange is forbidden** on brand/accent/primary/focus/active/selection/progress tokens
- `pnpm check:brand` scans `src/`, `public/`, `data/evidence/`, `docs/evidence/` for violations
- `pnpm test` includes `brand-guard.test.ts` and `design-tokens.test.ts`

## Evidence system

- Exactly **6 flagship evidence records** in `data/evidence/` (one JSON per project slug)
- Each record: project metadata, classification, proof points, sources, links, media
- `pnpm validate:evidence` — AJV schema validation + slug-filename match + source ID uniqueness + proof point cross-refs
- `pnpm evidence:summary` — generates `artifacts/evidence-summary.md`
- `pnpm check:links` — HEAD probes all public links (retries 2x, GET fallback for 403/405/501)
- `pnpm capture:projects` — Playwright screenshots per `data/media-manifest.json` (12 PNGs: 6 projects × 2 viewports)

## Testing

- **Unit tests**: `tests/**/*.{test,spec}.{ts,tsx}` (vitest, jsdom, globals)
- **E2E**: `tests/e2e/` (Playwright, chromium only, fully parallel)
- **Coverage thresholds**: 90% statements/functions/lines, 85% branches
- **Setup**: `tests/setup.ts` — jest-dom matchers + React cleanup per test
- **E2E server**: `pnpm build && pnpm preview --host 127.0.0.1 --port 4333` (env: `PUBLIC_DIAGNOSTIC_ENDPOINT`, `PUBLIC_ENABLE_TEST_HOOKS`)
- **A11y**: Pa11y against `http://127.0.0.1:4321` (WCAG2AA, 30s timeout, incognito)

## Build budgets

- Critical HTML+CSS: **120 KB gzip** (`/es/index.html` + linked CSS)
- Initial JavaScript: **180 KB gzip** (module closure from home page)
- 3D bootstrap: **250 KB gzip** (ExploreCanvas + HeroSignalScene closure)
- Deferred scenes: **1.5 MB transfer** each (unique JS + assets, excluding bootstrap)
- Hero GLB: **700 KB** max; posters: 180 KB mobile / 320 KB desktop
- Budget exceptions require an ADR under `docs/architecture/adr/exceptions/`

## Key scripts

| Script | Purpose |
|--------|---------|
| `check-brand.ts` | Scans for brand name violations and orange tokens |
| `check-links.ts` | Probes public evidence links (HEAD → GET fallback, 2 retries) |
| `validate-evidence.ts` | AJV schema + cross-ref validation |
| `validate-built-html.ts` | Checks lang, canonical, brand, img alt/width/height, noopener |
| `verify-budgets.ts` | Gzip budget enforcement for critical path |
| `verify-3d-budgets.ts` | Gzip + transfer budgets for 3D scenes |
| `capture-projects.ts` | Playwright screenshots per media manifest |
| `import-evidence.ts` | Syncs evidence JSON → Astro content collections |
| `generate-evidence-summary.ts` | Markdown summary of all evidence records |
| `built-module-graph.ts` | TypeScript-based static import graph analysis |

## GSAP rules (ADR-0004)

- GSAP is **browser-only**, isolated in `src/motion/` — never imported at module scope in Astro-evaluated code
- Must use `client:only` or `client:visible` directives for React islands that use it
- Must revert contexts and kill triggers on unmount
- On failure: complete static fallback, never hide content
- No smooth-scroll proxy or paid scrolling layer

## 3D model pipeline (ADR-0005)

- Default: **Three.js primitives** first, custom GLB only when necessary
- Compression: **Meshopt** default, Draco only if measured savings justify decoder cost
- Textures: AVIF/WebP via Sharp; KTX2/Basis only if GPU-memory pressure justifies it
- `three` and `@types/three` pinned to same version (0.185.1)
- `@gltf-transform/cli` for model optimization (`gltf-transform optimize --compress meshopt --texture-compress webp`)

## Environment & infra

- Node 22.12.0 (`.nvmrc`), pnpm 10.13.1 (`packageManager` field)
- Deployed to **GitHub Pages** via `actions/deploy-pages@v5`
- `CNAME` in `public/` for custom domain
- `.env` is gitignored; `PUBLIC_DIAGNOSTIC_ENDPOINT` and `PUBLIC_ENABLE_TEST_HOOKS` used in E2E
- No analytics personal data collected (see `data/measurement-plan.json` and ADR-0002)

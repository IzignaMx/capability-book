# FIX-UNIFIED-PROJECT-COVERS — Reporte de implementación

**Rama:** `feat/unified-project-covers` · **Fecha:** 2026-08-04 · **Estado:** ✅ Pipeline completo verde

## Resumen

Cada proyecto utiliza ahora una misma fuente visual canónica y un tratamiento consistente en `/es/`, `/en/`, `/es/proyectos/`, `/en/projects/` y los casos individuales ES/EN. Se eliminaron las tres variantes divergentes (ProjectCatalog `visualEvidence[0]`, ProjectEncounter `fallbackPoster`, ProjectCaseStudyHero tercera variante) y se unificaron bajo un resolver de presentación compartido con ratio canónico 8:5.

## Project Cover Matrix (6 proyectos × 4 contextos)

| Proyecto | catalog-cover | explore-encounter | case-study-cover | full-evidence |
|---|---|---|---|---|
| omnisync | evidence desktop 1440×900 (local) | evidence desktop 1440×900 (local) | evidence desktop 1440×900 (local) | desktop + mobile vertical |
| hamburguesa-nomada | evidence desktop (production) | evidence desktop (production) | evidence desktop (production) | desktop + mobile vertical |
| vald | evidence desktop (production) | evidence desktop (production) | evidence desktop (production) | desktop + mobile vertical |
| nutrichilango | evidence desktop (production) | evidence desktop (production) | evidence desktop (production) | desktop + mobile vertical |
| tecuiyo | evidence desktop (production) | evidence desktop (production) | evidence desktop (production) | desktop + mobile vertical |
| developer-tools | evidence desktop (production) | evidence desktop (production) | evidence desktop (production) | desktop + mobile vertical |

Todos los contextos cover usan **la misma fuente canónica**: `evidence.variants.desktop` (1440×900, AVIF+WebP) en todos los breakpoints. El fallback (si faltara evidencia) usa `poster-cover` 8:5 (1280×800, derivado Sharp). `full-evidence` conserva la variante mobile vertical (390×844) sin recorte destructivo.

## Component Contract

### Resolver puro compartido — `src/domain/projects/projectVisualResolver.ts`
- `resolveProjectVisual(project: ProjectVisualSource, context, options?, overrides?)` → `ResolvedProjectVisual`
- Contextos: `catalog-cover` | `explore-encounter` | `case-study-cover` | `full-evidence`
- Devuelve: `sourceKind` (evidence/fallback/placeholder), `desktop` + `mobile` (solo full-evidence), `alt`, `caption`, `stateKind`, `aspectRatio`, `objectFit`, `objectPosition`, `loading`, `fetchPriority`
- Regla 4: en contextos cover, `mobile` es siempre `null` — nunca se usa la variante vertical en portadas horizontales
- Regla 6: jerarquía `visualEvidence[0]` → `fallbackPoster` → placeholder explícito
- `canonicalCoverKey(project, context)` — helper determinista para tests (mismo proyecto → mismo asset en Explore y Evaluate)

### Metadata visual opcional — `src/domain/projects/coverVisualOverrides.ts`
- `COVER_VISUAL_OVERRIDES` (vacío por defecto) + `coverOverridesFor(slug)` — `objectPosition`, `fit`, `background` solo cuando se necesiten

### Contrato CSS compartido — `src/styles/project-cover.scss`
- `[data-project-cover]` → `object-fit: var(--cover-object-fit, cover)` + `object-position: var(--cover-object-position, top center)`
- `[data-cover-context='full-evidence'] img { height: auto }` (sin recorte destructivo)

### Renderers
- **Astro**: `src/components/projects/ProjectCover.astro` (usado por `ProjectCaseStudyHero.astro`, `ProjectEncounter.astro`)
- **React**: `ProjectCardCover` en `ProjectCatalog.tsx` (mismo resolver, sin duplicación de lógica)
- Sin migración de framework; el catálogo sigue en React porque es un island interactivo (filtros/búsqueda)

### Estados de evidencia (regla 7) — texto accesible FUERA de la imagen
- `data-cover-kind`: `direct-production-capture` | `local-development-capture` | `deterministic-reconstruction` | `illustrative`
- Caption del resolver: `{caption} · Captura directa de producción | Captura local autorizada | Reconstrucción determinista`
- Hero: figcaption `Portada de producción · evidencia completa más abajo` / `Portada de captura local autorizada · …` / `Portada ilustrativa · sin captura pública autorizada`
- Sin pills flotantes sobre la captura

### Numeración decorativa (regla 8)
- Eliminado el `<span>01/02/03</span>` de las portadas del catálogo + su CSS. El orden permanece semántico en el DOM.

## Capturas antes / después

- **Antes**: `audit/screenshots/components/` (Phase 0, 210 archivos) — portadas 16:9 con variante mobile vertical insertada en contenedores horizontales.
- **Después**: `audit/after-covers/` (27 PNGs) — `CatalogCover`, `Encounter`, `CaseHero` (fallback) en 360/390/768/1024/1280/1440 + `CaseHeroProduction` (evidencia) en 390/1440.

## Pruebas

| Suite | Resultado |
|---|---|
| `pnpm check` (astro + tsc + brand + tokens) | ✅ 0 errores |
| `pnpm test` (unit) | ✅ 147/147 (29 files) — incluye `project-visual-resolver.test.ts` (9 casos) + `ProjectCatalog.test.tsx` actualizado |
| `pnpm build` (budgets) | ✅ HTML+CSS 11.9KB/120KB · JS 66.8KB/180KB |
| `pnpm test:e2e` | ✅ 37/37 — incluye `project-cover.spec.ts` actualizado + `project-covers.spec.ts` (9 casos regla 9) |
| `pnpm test:a11y` (pa11y WCAG2AA, 14 URLs) | ✅ 0 errores |

### Cobertura de la regla 9 (e2e `project-covers.spec.ts`)
- Mismo proyecto → mismo asset canónico en Explore y Evaluate ✅
- Ningún source vertical (`home-mobile`) en portadas landscape ✅
- Aspect ratio 8:5 consistente (atributos y render) ✅
- Alt no vacío para evidencia informativa ✅
- Fallback funciona (unit: omnisync sin evidencia → poster-cover ilustrativo) ✅
- Loading eager solo above-the-fold (hero + 2 primeras cards; resto lazy) ✅
- AVIF/WebP mantienen width/height (1440×900) ✅
- No CLS (layout-shift < 0.1) ✅
- No imagen distorsionada (naturalWidth/Height ≈ 8:5) ✅

## Performance comparison

| Métrica | Antes | Después |
|---|---|---|
| Fuentes por portada | 3 variantes divergentes | 1 resolver canónico |
| Variante mobile en cover | 390×844 vertical (recorte) | nunca (desktop landscape en todos los breakpoints) |
| Fallback | 16:9 1280×720 | 8:5 1280×800 (derivado Sharp, sin estirar) |
| HTML+CSS crítico | — | 11.9KB gzip (dentro de 120KB) |
| JS inicial | — | 66.8KB gzip (dentro de 180KB) |

## Preservation Audit

- **Evidencia real intacta**: no se sustituyó ninguna captura por composiciones ficticias; no hay div-screenshots.
- **Logos internos de proyectos**: sin modificar.
- **Provenance/alt/caption/clasificación**: conservados y ahora también expuestos como `data-cover-kind` + caption accesible.
- **Sin afirmaciones falsas**: `local-development-capture` (omnisync) se distingue de `direct-production-capture` en texto accesible.
- **Contenido editorial de casos**: sin cambios.
- **Sin overlays numéricos decorativos**: numeración eliminada.
- **Marca**: `IzignaMx` verificado por `check:brand` (0 violaciones).

## Taste Skill Pre-Flight Check (frontend-philosophy)

- **Typography**: sin cambios.
- **Color**: sin cambios; acento `#3b82f6` intacto; sin naranja.
- **Motion**: sin cambios (transiciones existentes).
- **Space**: ratio canónico 8:5 aplicado consistentemente; gutters de Fase 0 intactos.
- **Depth**: sin cambios.

## Notas operativas

- Preview en `:4321` (pid 1168) detenido tras las capturas.
- Datos temporales en `C:\Users\edgar\AppData\Local\Temp\opencode\` pendientes de aprobación para limpieza.
- `pnpm generate:covers` regenera los derivados 8:5 de posters si cambian los assets.
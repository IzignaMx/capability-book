# FIX-SPACING-FOUNDATION — Reporte de implementación

**Rama:** `fix/spacing-foundation` · **Fecha:** 2026-08-04 · **Estado:** ✅ Pipeline completo verde

## Resumen

Fase 0 del rediseño: se corrigieron los defectos de espaciado objetivo del Book sin rediseñar covers, gateway raíz ni composición del hero. Se estableció una métrica de espaciado coherente (escala 4px + tokens semánticos), se normalizaron los controles interactivos a 44px mínimos y se añadió validación automática de variables CSS en CI.

## Métricas antes / después

| Métrica | Antes | Después | Objetivo |
|---|---|---|---|
| Declaraciones CSS inválidas (`--space-5`/`--space-10` indefinidos) | 16 | 0 | 0 |
| Controles < 44px de altura | 51 | 0 | 0 |
| Footer: separación entre links (390px) | 0px (concatenación `AccesibilidadPrivacidadContacto`) | **20px** | > 0 |
| Header desktop 1024–1440 | 86px | **78px** | ≤ 80px |
| Header 768 (2 filas) | 167px | **147px** | mejora |
| Link "English" (1024px) | 39.14px ancho | **67.9 × 44px** | ≥ 44px |
| Gutter página 360px | ~21px | **20px** | 20px |
| Gutter página 390px | ~21px | **24px** | 24px |
| Gutter página 768px | ~21px | **32px** | 32px |
| Gutter página 1280px | ~21px | **48px** | 48px |
| CTA caso (1440px) | 0.9rem/1.2rem padding | **48px alto, 20px inline, 1 línea** | ≥ 44px / ≥ 20px |
| Input catálogo (1280px) | 0.75rem/1rem padding | **52px alto, 20px inline** | ≥ 44px / ≥ 20px |
| Fallos de contraste | 0 | 0 | 0 |
| Overflow horizontal | 0 | 0 | 0 |

## Ledger de variables

### Escala extendida (justificación: Option C)
| Token | Valor | Justificación |
|---|---|---|
| `--space-5` | 1.25rem (20px) | 15 consumidores compartían la intención de 20px; 20px = padding inline mínimo de control |
| `--space-10` | 2.5rem (40px) | Rellena el hueco 2rem→3rem; usado por `--section-space-lg` |

### Tokens semánticos (Option B)
| Token | Valor |
|---|---|
| `--page-gutter` | 1.5rem · 1.25rem (≤22.5rem) · 2rem (≥48rem) · 3rem (≥64rem) |
| `--section-space-sm` | `var(--space-8)` |
| `--section-space-lg` | `clamp(var(--space-10), 10vh, var(--space-16))` |
| `--card-padding` | `var(--space-4) var(--space-5)` |
| `--control-padding-block` | `var(--space-3)` |
| `--control-padding-inline` | `var(--space-5)` |
| `--cluster-gap` | `var(--space-5)` |
| `--content-gap` | `var(--space-5)` |

### Decisión por uso (16 consumidores inválidos)

| # | Ubicación | Decisión |
|---|---|---|
| 1 | `ProjectEncounter.astro:109` gap | `--content-gap` |
| 2 | `ProjectEncounter.astro:194` actions padding | tokens de control |
| 3 | `BaseLayout.astro:100` footer gap | `--cluster-gap` |
| 4 | `BaseLayout.astro:109` footer nav gap | `--cluster-gap` |
| 5 | `explore.scss:8` intro gap | `--content-gap` |
| 6 | `explore.scss:48` controls padding | tokens de control |
| 7 | `explore.scss:177` chapter gap | `--content-gap` |
| 8 | `explore.scss:220` capability li padding | `--card-padding` |
| 9 | `explore.scss:268` ledger gap | `--cluster-gap` |
| 10 | `explore.scss:346` uplink p margin | `--content-gap` |
| 11 | `explore.scss:364` uplink primary padding | tokens de control |
| 12 | `explore.scss:435` mobile quality/uplink | `--section-space-sm var(--page-gutter)` |
| 13 | `information-page.scss:9` header gap | `--content-gap` |
| 14 | `information-page.scss:80` notice padding | `--card-padding` |
| 15 | `information-page.scss:88` mobile section gap | `--content-gap` |
| 16 | `explore.scss:250` quality-scan padding-block | `--section-space-lg` |

### Retenidos (sin uso, canónicos — no eliminar)
`--color-carbon`, `--color-lead`, `--color-teal`, `--motion-standard` (verificados por `check:tokens` como 4 unused intencionales).

## Normalización de controles

- **44px mínimos**: header nav links, footer links, CTA de caso, hero actions, controles de catálogo, encounter actions, uplink primary, mode-switch.
- **Padding inline ≥ 20px**: `--control-padding-inline` en todos los controles tipo pill.
- **Estados**: `:hover` (color/borde) + `:focus-visible` (anillo global) + `:active` táctil (`translateY(1px)`) en hero actions, explore controls, encounter actions, uplink primary, mode-switch, case CTA.
- **Links inline de texto** (categoría documentada, sin pill): footer links (hover → `--color-text`), links compactos de evidencia (≥24px hit area WCAG 2.5.8), links de fuente de ProofPoint.

## Validación automática

- **`scripts/check-tokens.ts`** (nuevo): escanea `src/**/*.{scss,astro,tsx,ts}`, detecta consumidores de variables CSS indefinidas sin fallback, duplicados cross-file y tokens sin uso. Dos fases (definiciones → consumidores) para evitar falsos positivos por orden alfabético.
- **`pnpm check:tokens`** integrado en `pnpm check` (junto a brand).
- **tests/token-guard.test.ts** (nuevo): 9 casos unitarios.
- **tests/e2e/spacing-foundation.spec.ts** (nuevo): 28 casos e2e (overflow, gutters, footer, controles, focus ring, header).

## Resultados del pipeline

| Paso | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ |
| `pnpm check` (astro check + tsc + brand + tokens) | ✅ 0 errores |
| `pnpm test` | ✅ 138/138 |
| `pnpm build` (budgets) | ✅ HTML+CSS 11.7KB/120KB · JS 66.8KB/180KB |
| `pnpm test:e2e` | ✅ 28/28 |
| `pnpm test:a11y` (pa11y WCAG2AA, 14 URLs) | ✅ 0 errores |

## Preservation Audit

- **No tocados**: colores, tipografías, logo, rutas, labels de navegación, campos de formulario, copy legal, selección de evidencia, covers de proyecto, composición del hero.
- **Tokens canónicos retenidos**: `--color-carbon`, `--color-lead`, `--color-teal`, `--motion-standard`.
- **Marca**: `IzignaMx` verificado por `check:brand` (0 violaciones).
- **Presupuestos 3D/JS**: sin cambios en el pipeline 3D; budgets críticos intactos.

## Taste Pre-Flight Check (frontend-philosophy)

- **Typography**: sin cambios (Aptos Display/Aptos/Cascadia Code intactos).
- **Color**: sin cambios; acento primario `#3b82f6` intacto; sin naranja.
- **Motion**: `:active` táctil añadido (propósito: feedback físico); transiciones `--motion-fast` en controles; sin animaciones decorativas nuevas.
- **Space**: métrica coherente 20/24/32/48px; gutters consistentes; sin densidad excesiva.
- **Depth**: sin cambios (gradientes/radial intactos).

## Capturas

- **Antes**: `audit/screenshots/components/<Name>/<WxH>.png` (210 archivos, Phase 0).
- **Después**: `audit/after/<Name>/<WxH>.png` (18 capturas: Header 360/768/1024/1440, Footer 390/1440, ProjectEncounter 390/1440, QualityScan 390/1440, UplinkCTA 390/1440, ProjectCatalog 390/1440, CasePage 360/1440, Home 390/1440).

## Notas operativas

- El dev server del audit en `:4321` (pid 29752) fue detenido para ejecutar `test:a11y` (requiere preview del build en ese puerto). Puede relanzarse con `pnpm dev`.
- Datos temporales del audit en `C:\Users\edgar\AppData\Local\Temp\opencode\capability-book-audit-data\` — pendientes de aprobación para limpieza.

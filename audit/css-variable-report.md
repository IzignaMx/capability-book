# CSS custom-property audit

Audit date: 2026-08-04  
Branch/commit: `main` at `8ebd323`  
Scope: every `var()` consumer in repository source matched against the canonical definitions in `src/styles/tokens.scss`.

## Verdict

**P0 — the token graph is not closed.** The extraction found **401 `var()` consumers across 28 consumed names**, **31 unique definitions**, no duplicate definitions, and two consumed-but-undefined names:

- `--space-5`: 15 consumers
- `--space-10`: 1 consumer

That produces **16 declarations invalid at computed-value time**. The failures are visible in production geometry: the footer links concatenate, Explore controls lose padding, section rhythm collapses, and multiple controls retain only their `min-height` rather than a usable padded target.

Five defined tokens are currently unused: `--color-carbon`, `--color-lead`, `--color-teal`, `--motion-standard`, and `--space-16`. They are not defects, but should be reviewed before extending the system.

## Canonical brand contract

The current token file is the source of truth and must be preserved during redesign:

| Role | Canonical value |
|---|---|
| Space background | `--color-space: #020617` |
| Midnight surface | `--color-midnight: #0b1120` |
| IzignaMx Blue | `--color-brand: #3b82f6` |
| Bright blue | `--color-brand-bright: #60a5fa` |
| Cyan | `--color-cyan: #22d3ee` |
| Display family | `"Aptos Display", "Segoe UI Variable Display", sans-serif` |
| Body family | `"Aptos", "Segoe UI Variable Text", sans-serif` |
| Data family | `"Cascadia Code", "SFMono-Regular", monospace` |

Do not migrate this audit’s recommendations to ADAM.CG PRO, Inter, JetBrains Mono, `#2E96FF`, or a replacement logo/isotype system.

## Why each undefined use fails completely

`var(--space-5)` and `var(--space-10)` have neither definitions nor fallbacks. CSS accepts each declaration during cascade, then cannot substitute a computed value. The **whole winning declaration** becomes invalid at computed-value time:

- a two-value `padding` or `margin` shorthand loses both axes, not only the undefined component;
- the browser does not revive an earlier cascaded declaration;
- non-inherited spacing properties resolve to their initial/unset behavior, effectively zero here;
- a surviving `min-height: 44px` does not restore horizontal padding, separation, or a 44-pixel-wide target.

## P0 invalid declaration ledger

| # | File:line | Selector | Invalid declaration | Viewport scope | Observed/effective result |
|---:|---|---|---|---|---|
| 1 | `src/components/explore/ProjectEncounter.astro:109` | `.project-encounter` | `gap: var(--space-5)` | All | Internal grid gap resolves effectively to zero; the stacked mobile layout is visibly compressed. |
| 2 | `src/components/explore/ProjectEncounter.astro:194` | `.project-encounter__actions a` | `padding: var(--space-3) var(--space-5)` | All | Entire shorthand is lost: computed padding is `0`; `min-height: 44px` survives but the labels have no inset. |
| 3 | `src/layouts/BaseLayout.astro:100` | `.site-footer` | `gap: var(--space-5)` | All | Footer groups lose their intended separation. |
| 4 | `src/layouts/BaseLayout.astro:109` | `.site-footer nav` | `gap: var(--space-5)` | All | Footer links touch; screenshots visibly read `AccesibilidadPrivacidadContacto`. |
| 5 | `src/styles/explore.scss:8` | `.explore-intro` | `gap: var(--space-5)` | All | Intro stack loses its designed rhythm. |
| 6 | `src/styles/explore.scss:48` | `.explore-evaluate-link`, `.explore-controls a`, `.explore-controls button` | `padding: var(--space-3) var(--space-5)` | All | Entire shorthand is lost; controls retain height but compute to zero padding. |
| 7 | `src/styles/explore.scss:177` | `.explore-chapter` | `gap: var(--space-5)` | All | Chapter content loses internal spacing. |
| 8 | `src/styles/explore.scss:220` | `.capability-list li` | `padding: var(--space-4) var(--space-5)` | All | Capability-card padding resolves to zero on both axes. |
| 9 | `src/styles/explore.scss:268` | `.quality-scan__ledger li` | `gap: var(--space-5)` | Above `48rem` | Ledger row gap resolves to zero. A valid `gap: var(--space-4)` at line 440 restores it at `<=48rem`. |
| 10 | `src/styles/explore.scss:346` | `.uplink-cta__layout > div:first-child > p` | `margin: var(--space-5) 0 0` | All | Entire margin shorthand is lost; the intended top separation disappears. |
| 11 | `src/styles/explore.scss:364` | `.uplink-cta__primary` | `padding: var(--space-3) var(--space-5)` | All | Entire shorthand is lost and defeats the earlier valid inline padding; computed padding is zero while `min-height: 48px` survives. |
| 12 | `src/styles/explore.scss:435` | `.quality-scan`, `.uplink-cta` | `padding: var(--space-8) var(--space-5)` | `<=48rem` | Entire mobile shorthand is lost. Uplink’s valid base padding is displaced; both sections reach zero padding on the affected rule. |
| 13 | `src/styles/information-page.scss:9` | `.information-page__header` | `gap: var(--space-5)` | All | Information-page header gap resolves effectively to zero. |
| 14 | `src/styles/information-page.scss:80` | `.information-page__notice` | `padding: var(--space-4) var(--space-5)` | All | Notice loses all padding. |
| 15 | `src/styles/information-page.scss:88` | `.information-page section` | `gap: var(--space-5)` | `<=42rem` | Mobile gap resolves to zero and displaces the valid desktop clamp declaration. |
| 16 | `src/styles/explore.scss:250` | `.quality-scan` | `padding-block: clamp(var(--space-10), 10vh, 7rem)` | All; base rule above `48rem` | Both block paddings resolve to zero. The `<=48rem` replacement at line 435 also fails because it contains `--space-5`, leaving QualityScan without section padding at every audited width. |

## Complete definition/consumer reconciliation

The table below accounts for every extracted name. “Files” deduplicates locations; the consumer count includes every individual declaration, including token-to-token consumption inside `tokens.scss`.

| Token | Definition | Consumers | Consumer files |
|---|---:|---:|---|
| `--color-brand` | `#3b82f6` | 8 | `SkipLink.astro`; `ModeSwitch.astro`; localized home/case pages; `explore.scss` |
| `--color-brand-bright` | `#60a5fa` | 22 | `DiagnosticWizard.scss`; `ProjectEncounter.astro`; `SiteHeader.astro`; project components; localized home/case pages; gateway; `explore.scss`; `tokens.scss` |
| `--color-carbon` | `#1b1b1d` | 0 | — |
| `--color-cyan` | `#22d3ee` | 32 | Diagnostic, Explore, project components/pages, gateway, `explore.scss`, `information-page.scss` |
| `--color-lead` | `#66686a` | 0 | — |
| `--color-line` | `rgb(148 163 184 / 24%)` | 50 | Diagnostic, navigation, Explore, all project components/pages, layout, gateway, shared styles |
| `--color-midnight` | `#0b1120` | 8 | Encounter, project hero/catalog/evidence, case pages, `global.scss`, `information-page.scss` |
| `--color-mist` | `#f5f5f7` | 1 | `DiagnosticWizard.scss` |
| `--color-space` | `#020617` | 15 | Accessibility, diagnostic, mode, catalog, localized home/case pages, Explore/global styles, `tokens.scss` |
| `--color-teal` | `#00b4c0` | 0 | — |
| `--color-text` | `#ffffff` | 6 | Diagnostic, Encounter, Catalog, shared Explore/global/information styles |
| `--color-text-muted` | `#cbd5e1` | 42 | Diagnostic, navigation, Explore, every project component, layout, localized pages, gateway/shared styles |
| `--color-white` | `#ffffff` | 5 | ModeSwitch, SiteHeader, ProjectCatalog |
| `--content-width` | `76rem` | 7 | Diagnostic, Catalog, localized catalog/case pages, `global.scss` |
| `--focus-ring` | `0 0 0 3px var(--color-space), 0 0 0 6px var(--color-brand-bright)` | 2 | Diagnostic and `global.scss` |
| `--font-body` | `"Aptos", "Segoe UI Variable Text", sans-serif` | 2 | `explore.scss`; `global.scss` |
| `--font-data` | `"Cascadia Code", "SFMono-Regular", monospace` | 31 | Accessibility, diagnostic, mode, Explore/project components, layout, localized pages, gateway/shared styles |
| `--font-display` | `"Aptos Display", "Segoe UI Variable Display", sans-serif` | 23 | Diagnostic, navigation, Explore/project components, localized pages, gateway/shared styles |
| `--motion-fast` | `140ms` | 12 | SkipLink, ModeSwitch, SiteHeader, localized homes, gateway |
| `--motion-standard` | `240ms` | 0 | — |
| `--radius-md` | `0.75rem` | 1 | `DiagnosticWizard.scss` |
| `--radius-pill` | `999px` | 13 | Diagnostic, navigation, Encounter/Catalog, localized home/case pages, gateway/Explore styles |
| `--radius-sm` | `0.25rem` | 4 | SkipLink, DiagnosticWizard, ProjectCatalog |
| `--space-1` | `0.25rem` | 3 | ModeSwitch; `explore.scss` |
| `--space-2` | `0.5rem` | 9 | Diagnostic, mode, Encounter, header, gateway, Explore styles |
| `--space-3` | `0.75rem` | 30 | Accessibility, diagnostic, Encounter/header, localized homes, gateway, Explore/information styles |
| `--space-4` | `1rem` | 20 | Accessibility, diagnostic, mode, Encounter/header, localized homes, Explore/information styles |
| `--space-5` | **Undefined** | **15** | `ProjectEncounter.astro`; `BaseLayout.astro`; `explore.scss`; `information-page.scss` |
| `--space-6` | `1.5rem` | 15 | Diagnostic, header, layout, localized homes, gateway, Explore styles |
| `--space-8` | `2rem` | 17 | Accessibility, localized homes, gateway, Explore styles |
| `--space-10` | **Undefined** | **1** | `explore.scss` |
| `--space-12` | `3rem` | 7 | Localized homes; `explore.scss` |
| `--space-16` | `4rem` | 0 | — |

Totals reconcile to **31 definitions + 2 undefined consumed names**, **401 consumer declarations**, and **zero duplicate definitions**.

## Recommended correction order

1. Close the spacing-token graph before any visual redesign. Decide whether `5`/`10` are intentional scale entries or mistaken references; do not replace them ad hoc per component.
2. Add a regression test that extracts `var()` names and fails on any consumed name without a definition or explicit fallback.
3. Re-run visual and control geometry audits after the token fix. Current padding/gap measurements are accurate evidence of the defect, not the intended final geometry.
4. Review unused tokens separately; do not delete canonical colors merely to make the usage count non-zero.

No source correction is included in this audit.

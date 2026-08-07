# Component, control, and responsive audit matrix

Audit date: 2026-08-04  
Branch/commit: `main` at `8ebd323`  
Mode: **Redesign — Preserve**

## Coverage and method

- **19 routes × 7 required viewports = 133 full-page captures**.
- **11 required components × 7 viewports = 77 component captures**.
- Viewports: `360x800`, `390x844`, `768x1024`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`.
- All 133 document requests returned HTTP 200.
- No audited viewport had document-level horizontal overflow.
- No console errors, page errors, or request failures were recorded. One manually observed development warning (`THREE.Clock` deprecation) is a P2 maintenance item, not a render failure.
- The audit recorded **2,408 control observations**, representing **344 stable route/control instances** across the seven widths.

Computed geometry was collected after lazy media was primed and decoded. Contrast ratios are text/background ratios at the observed state. State coverage combines component rules with the shared global focus ring.

### Measurement caveat

The automated line counter uses `Range.getClientRects()`. It overcounts nested text/icon fragments, including the visually one-line IzignaMx brand and some card/evidence links. Therefore:

- target dimensions, padding, contrast, paths, and neighbor distances are authoritative computed values;
- “wrap” is reported as a defect only when confirmed in screenshots;
- a focused skip link visible in some component captures is deliberate focus-state evidence, not its normal resting state.

## Full-page route matrix

Every row has captures at all seven viewports. Screenshot folders use the route path beneath `audit/screenshots/`.

| Route | Page role | Responsive finding | Screenshot folder |
|---|---|---|---|
| `/` | Language gateway | One-line wordmark/H1 at every width; calm centered composition; content fits the initial viewport. | [`screenshots/root/`](screenshots/root/) |
| `/es/` | Explore home ES | H1 renders four lines at every audited width; CTAs remain initially visible; long page is 7,549–9,449px high. | [`screenshots/es/`](screenshots/es/) |
| `/en/` | Explore home EN | H1 is five lines at 360/390, three at 768–1440, and four in the 1920 capture; CTAs remain usable. | [`screenshots/en/`](screenshots/en/) |
| `/es/proyectos/` | Evaluate catalog ES | Two-line H1; stable one/two-column catalog; raw English capability/classification values remain visible in Spanish. | [`screenshots/es/proyectos/`](screenshots/es/proyectos/) |
| `/en/projects/` | Evaluate catalog EN | Two-line H1; stable one/two-column catalog; same image/crop behavior as ES. | [`screenshots/en/projects/`](screenshots/en/projects/) |
| `/es/proyectos/developer-tools/` | Case ES | Responsive content is stable; portrait mobile evidence is severely cropped in the landscape hero; contextual CTA is three lines at 360. | [`screenshots/es/proyectos/developer-tools/`](screenshots/es/proyectos/developer-tools/) |
| `/es/proyectos/hamburguesa-nomada/` | Case ES | Same hero/crop issue; contextual CTA wraps at 360/390. | [`screenshots/es/proyectos/hamburguesa-nomada/`](screenshots/es/proyectos/hamburguesa-nomada/) |
| `/es/proyectos/nutrichilango/` | Case ES | Same hero/crop issue; contextual CTA wraps at 360/390. | [`screenshots/es/proyectos/nutrichilango/`](screenshots/es/proyectos/nutrichilango/) |
| `/es/proyectos/omnisync/` | Case ES | Large blank desktop zone before hero content; portrait source cropped to top 28.9% on mobile; CTA wraps at 360/390. | [`screenshots/es/proyectos/omnisync/`](screenshots/es/proyectos/omnisync/) |
| `/es/proyectos/tecuiyo/` | Case ES | Same crop issue; CTA wraps at 360 only. | [`screenshots/es/proyectos/tecuiyo/`](screenshots/es/proyectos/tecuiyo/) |
| `/es/proyectos/vald/` | Case ES | Same crop issue; CTA wraps at 360 only. | [`screenshots/es/proyectos/vald/`](screenshots/es/proyectos/vald/) |
| `/en/projects/developer-tools/` | Case EN | Same evidence/crop behavior; contextual CTA wraps at 360/390. | [`screenshots/en/projects/developer-tools/`](screenshots/en/projects/developer-tools/) |
| `/en/projects/hamburguesa-nomada/` | Case EN | Same evidence/crop behavior; contextual CTA wraps at 360/390. | [`screenshots/en/projects/hamburguesa-nomada/`](screenshots/en/projects/hamburguesa-nomada/) |
| `/en/projects/nutrichilango/` | Case EN | Same evidence/crop behavior; contextual CTA wraps at 360/390. | [`screenshots/en/projects/nutrichilango/`](screenshots/en/projects/nutrichilango/) |
| `/en/projects/omnisync/` | Case EN | Large blank desktop zone; portrait source cropped on mobile; CTA wraps at 360/390. | [`screenshots/en/projects/omnisync/`](screenshots/en/projects/omnisync/) |
| `/en/projects/tecuiyo/` | Case EN | Same crop issue; CTA wraps at 360 only. | [`screenshots/en/projects/tecuiyo/`](screenshots/en/projects/tecuiyo/) |
| `/en/projects/vald/` | Case EN | Same crop issue; CTA wraps at 360 only. | [`screenshots/en/projects/vald/`](screenshots/en/projects/vald/) |
| `/es/diagnostico/` | Diagnostic ES | H1 is 3–4 lines; labels, fallback and disabled delivery state are clear; footer spacing defect recurs. | [`screenshots/es/diagnostico/`](screenshots/es/diagnostico/) |
| `/en/diagnostic/` | Diagnostic EN | H1 is 2–4 lines; form behavior matches ES; footer spacing defect recurs. | [`screenshots/en/diagnostic/`](screenshots/en/diagnostic/) |

## Required component capture matrix

| Component | Selector | What the captures establish | Priority | Captures |
|---|---|---|---|---|
| Header | `.site-header` | One row at 1024–1920 but 86px tall, 6px above Taste’s 80px cap. Two rows at 360/390/768 (155/155/167px). At 360, `Proyectos` is flush left and `English` nearly clips at the right edge despite no page overflow. | P1 | [`Header/`](screenshots/components/Header/) |
| Language gateway | `.language-gateway` | Strong preserve candidate: centered, legible, brand-faithful, intentional negative space, two 50px controls. | Preserve | [`language-gateway/`](screenshots/components/language-gateway/) |
| Hero ES | `.hero` | Distinctive split composition and visible CTAs, but four-line desktop H1 violates the Taste max-two-line hero rule. | P1 | [`Hero-ES/`](screenshots/components/Hero-ES/) |
| Hero EN | `.hero` | Same composition; five-line small-screen H1 and three-line common desktop H1 show copy/scale imbalance. | P1 | [`Hero-EN/`](screenshots/components/Hero-EN/) |
| ProjectEncounter | `.project-encounter` | Correct mobile stack and uncropped 16:9 poster, but internal gap and all action padding collapse because `--space-5` is undefined. | **P0** | [`ProjectEncounter/`](screenshots/components/ProjectEncounter/) |
| ProjectCatalog | `.project-catalog` | Clear filtering and evidence grid. ES leaks raw English enums; mobile portrait evidence is cropped inside 16:9 cards. | P1 | [`ProjectCatalog/`](screenshots/components/ProjectCatalog/) |
| ProjectCard | `.project-card` | Legible content, but `Abrir caso:` can split awkwardly from the project title on mobile; link relies on height only and has no local interaction cycle. | P1 | [`ProjectCard/`](screenshots/components/ProjectCard/) |
| ProjectCaseStudyHero | `.project-hero` | Excessive blank desktop top zone from end alignment/min-height. At `<=40rem`, a 390×844 portrait is forced into 8:5 `cover`, retaining about 28.9% and discarding most evidence. | **P0** | [`ProjectCaseStudyHero/`](screenshots/components/ProjectCaseStudyHero/) |
| QualityScan | `.quality-scan` | Evidence structure is readable, but undefined `--space-10` and the invalid mobile shorthand remove section padding at every width. Links have no local hover/active treatment. | **P0** | [`QualityScan/`](screenshots/components/QualityScan/) |
| UplinkCTA | `.uplink-cta` | Clear conversion intent, but primary padding resolves to zero, desktop columns produce awkward line breaks, and privacy is an 18–40px-high inline target. | **P0** | [`UplinkCTA/`](screenshots/components/UplinkCTA/) |
| Footer | `.site-footer` | Individual links are 44px high, but both layout gaps resolve to zero; text visibly concatenates in both locales. | **P0** | [`Footer/`](screenshots/components/Footer/) |

## Control audit totals

| Measure | Result | Interpretation |
|---|---:|---|
| Observations | 2,408 | 344 stable route/control instances × seven viewports |
| Stable controls failing 44×44 at any width | **51** | Width, height, or both fail; `min-height: 44px` alone is not sufficient. |
| Contrast failures | **0** | Every measurable current-state text/background pair passed its applicable threshold. |
| Contrast unknown | **0** | No audited visible control lacked a computable pair. |
| Automated wrap flags | 58 | Includes nested-Range false positives; only visually confirmed cases are treated as defects below. |
| No component-local hover rule | 232/344 | Global color/focus behavior does not replace hover feedback. |
| No component-local `:focus-visible` rule | 298/344 | A shared global focus ring exists; this count indicates local-state inconsistency, not invisible keyboard focus. |
| No component-local `:active` rule | **344/344** | No tactile active state was found for any stable control. |

### State notation

- **H**: explicit component hover rule.
- **F-G**: shared global `:focus-visible` ring applies.
- **F-L**: component-local focus/focus-visible rule.
- **A**: active/pressed styling. It is absent throughout the audited UI.
- Padding is listed vertical × horizontal.

## Control geometry and state matrix

Repeated controls are consolidated by component and locale. Dimensions are min–max across all seven viewports; every visible label and destination is listed in the route inventory that follows.

### Language gateway

| Text → route | Size | Padding | Wrap | Contrast | States | Nearest control | Verdict |
|---|---|---|---|---:|---|---:|---|
| `Continuar en español` → `/es/` | 200.64×50 | 12×24 | No | 20.17:1 | H, F-G; no A | 12px | Pass |
| `Continue in English` → `/en/` | 185.97×50 | 12×24 | No | 20.17:1 | H, F-G; no A | 12px | Pass |

### Shared skip link and header

| Control | Destination | Size across widths | Padding V×H | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---|---:|---|---:|---|
| `Saltar al contenido principal` | Current route `#main-content` | 269.89×45 | 12×16 | No | 5.48:1 | F-L | 41–81.22px | Pass; visible in some captures because it was focused. |
| `Skip to main content` | Current route `#main-content` | 196.06×45 | 12×16 | No | 5.48:1 | F-L | 41–149.66px | Pass. |
| IzignaMx brand | `/es/` or `/en/` | 95.73–103.70×44 | 0×0 | Visually one line | 20.17:1 | F-G; no H/A | 30–149.66px | Height passes; add intentional horizontal hit-area rather than relying on glyph width. |
| `EXPLORAR` / `EXPLORE` | `/es/` / `/en/` | 92.09×44 | 8×16 | No | 5.48:1 current | H, F-G; no A | 4px | Pass geometry; mode pills are tightly grouped but distinct. |
| `EVALUAR` / `EVALUATE` | `/es/proyectos/` / `/en/projects/` | 92.09×44 | 8×16 | No | 13.59:1 inactive | H, F-G; no A | 4px | Pass geometry; duplicates the adjacent Projects intent. |
| `Proyectos` | `/es/proyectos/` | 53.81–60.38×44 | 0×0 | No | 13.59:1 | H, F-G; no A | 16–42px | Pass 44×44, but lacks inset. |
| `Projects` | `/en/projects/` | 43.48–48.78×44 | 0×0 | No | 13.59:1 | H, F-G; no A | 16–42px | **Fails width at 360/390**. |
| `Solicitar diagnóstico` | `/es/diagnostico/` | 145.19–158.73×44 | 0×16 | No | 20.17:1 | H, F-G; no A | 16–96.8px | Pass. |
| `Request a diagnostic` | `/en/diagnostic/` | 148.05–161.92×44 | 0×16 | No | 20.17:1 | H, F-G; no A | 16–102.43px | Pass. |
| `English` | Locale-paired EN route | 39.14–43.91×44 | 0×0 | No | 13.59:1 | H, F-G; no A | 16–42px | **Fails width at all seven viewports on all nine ES pages.** |
| `Español` | Locale-paired ES route | 42.70–47.91×44 | 0×0 | No | 13.59:1 | H, F-G; no A | 16–42px | **Fails width at 360/390 on all nine EN pages.** |

The header itself changes to two rows at 360, 390, and 768. This is not text wrapping, but it creates a 155–167px navigation block. The 360 capture also shows insufficient edge inset around the second row.

### Explore home conversion controls

| Control | Destination | Size | Padding V×H | Confirmed wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---|---:|---|---:|---|
| `Evaluar proyectos` / `Evaluate projects` | Localized catalog | 176–358×48–50 | 12×24 | No | 5.48:1 | H, F-G; no A | 12px | Pass. |
| `Solicitar diagnóstico` / `Request a diagnostic` | Localized diagnostic | Full-width mobile; 48–50px high | 12×24 | No | 20.17:1 | H, F-G; no A | 12px | Pass. |
| `Ver/View evidence in Evaluate` | Localized catalog | 192.73–358×44 | 0×0 | No | 11.16:1 | H, F-G; no A | 48–128px | Pass target; duplicate catalog intent. |
| `Explorar/Explore evidence in Evaluate` | Localized catalog | 214.06–358×44 | 0×0 | No | 5.48:1 | H, F-G; no A | 12px | Pass target; duplicate catalog intent. |
| `Movimiento avanzado no disponible` / `Advanced motion unavailable` | Button; no route | 225.94–358×44 | 0×0 | No | 13.59:1 | H, F-G, disabled; no A | 12px | Geometry passes; disabled state exists. |

### ProjectEncounter controls

Two encounter instances occur per localized home: OmniSync and Hamburguesa Nómada.

| Text → route pattern | Size | Computed padding | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---:|---|---:|---|
| `Abrir caso completo` → `/es/proyectos/<slug>/`; `Open full case study` → `/en/projects/<slug>/` | 153.72–358×44 | **0×0** | No | 7.93:1 | H, F-G; no A | 12px | P0 padding failure from undefined `--space-5`. |
| `Iniciar diagnóstico relacionado` / `Start related diagnostic` → localized diagnostic with `project` and `service` query | 177.61–358×44 | **0×0** | No | 20.17:1 | H, F-G; no A | 12px | P0 padding failure from undefined `--space-5`. |

Exact destinations:

- OmniSync: `/es/diagnostico/?project=omnisync&service=omnisync` and `/en/diagnostic/?project=omnisync&service=omnisync`.
- Hamburguesa Nómada: `/es/diagnostico/?project=hamburguesa-nomada&service=hamburguesa-nomada` and EN equivalent.

### QualityScan controls

All six rows use `Abrir evidencia ↗` / `Open evidence ↗`; sizes are 123.56×44 ES and 108.34×44 EN, padding 0×0, contrast 11.16:1, nearest-control distance 96.5–203.75px. They pass target geometry but have no local hover or active state; F-G applies.

| Evidence row | ES destination | EN destination |
|---|---|---|
| Accessibility | `/es/accesibilidad/` | `/en/accessibility/` |
| Performance budget | `https://github.com/IzignaMx/capability-book/blob/main/scripts/verify-budgets.ts` | Same |
| Privacy | `/es/privacidad/` | `/en/privacy/` |
| Quality workflow | `https://github.com/IzignaMx/capability-book/actions/workflows/quality.yml` | Same |
| Sitemap | `/sitemap-index.xml` | Same |
| Deployment specification | `https://github.com/IzignaMx/capability-book/blob/main/docs/superpowers/specs/2026-07-20-izignamx-capability-book-design.md#291-primary-deployment` | Same |

### UplinkCTA controls

| Control | Destination | Size | Padding V×H | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---|---:|---|---:|---|
| `Abrir/Open contextual diagnostic` | Localized diagnostic `?concept=quality-scan&service=web-experiences` | 196.72–356×48 | **0×0** | No | 5.48:1 | H, F-G; no A | 12px | P0: invalid shorthand removes primary-button padding. |
| `Revisar/Review evidence in Evaluate` | Localized catalog | 213.52–356×44 | 0×4 | No | 11.16:1 | F-G; no H/A | 12px | Target passes; state and inset are weak. |
| `Leer privacidad` | `/es/privacidad/` | 89.98–380.05×18–40.17 | 0×0 | Can flow with paragraph | 11.16:1 | F-G; no H/A | 22–44.17px | **Fails target at all seven widths.** |
| `Read privacy` | `/en/privacy/` | 74.94–397.59×18–40.17 | 0×0 | Can flow with paragraph | 11.16:1 | F-G; no H/A | 22–44.17px | **Fails target at all seven widths.** |

### Footer controls

| Locale | Text → destination | Size | Padding | Contrast | States | Neighbor | Verdict |
|---|---|---|---:|---|---:|---|
| ES | `Accesibilidad` → `/es/accesibilidad/`; `Privacidad` → `/es/privacidad/`; `Contacto` → `mailto:hola@izignamx.com` | 92.16/72.45/64.09×44 | 0 | 13.59:1 | F-G; no local H/A | **0px** | Individual dimensions pass, but invalid footer gap visibly concatenates all three labels. |
| EN | `Accessibility` → `/en/accessibility/`; `Privacy` → `/en/privacy/`; `Contact` → `mailto:hola@izignamx.com` | 85.13/49.34/54.72×44 | 0 | 13.59:1 | F-G; no local H/A | **0px** | Same P0 gap failure. |

### Project catalog controls

| Control | Size | Padding V×H | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---:|---|---:|---|
| `Buscar proyectos` / `Search projects` input | 294–777.33×52 | 12×16 | No | 20.17:1 | F-G; no H/A or invalid/valid cycle | 16–37.81px | Pass geometry. |
| `Capacidad` / `Capability` select | 294–702×52 | 12×16 | No | 20.17:1 | F-G; no H/A | 16–37.81px | Pass geometry. |
| Six `Abrir caso: <title>` / `Open case: <title>` links | 117.95–377.52×44–49 | 0×0 | Mobile split observed on long ES label | 18.83:1 | F-G; no local H/A | Separated by card layout | Height passes, but link treatment and mobile label composition need work. |

Catalog routes are exact locale mirrors:

| Slug | ES text/destination | EN text/destination |
|---|---|---|
| `developer-tools` | `Abrir caso: Colección de herramientas para desarrollo` → `/es/proyectos/developer-tools/` | `Open case: Developer Tools Collection` → `/en/projects/developer-tools/` |
| `hamburguesa-nomada` | `Abrir caso: Hamburguesa Nómada` → `/es/proyectos/hamburguesa-nomada/` | `Open case: Hamburguesa Nómada` → `/en/projects/hamburguesa-nomada/` |
| `nutrichilango` | `Abrir caso: NutriChilango` → `/es/proyectos/nutrichilango/` | `Open case: NutriChilango` → `/en/projects/nutrichilango/` |
| `omnisync` | `Abrir caso: OmniSync` → `/es/proyectos/omnisync/` | `Open case: OmniSync` → `/en/projects/omnisync/` |
| `tecuiyo` | `Abrir caso: Tecuiyo` → `/es/proyectos/tecuiyo/` | `Open case: Tecuiyo` → `/en/projects/tecuiyo/` |
| `vald` | `Abrir caso: VALD` → `/es/proyectos/vald/` | `Open case: VALD` → `/en/projects/vald/` |

### Project case controls

#### Shared geometry

| Family | Size | Padding V×H | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---:|---|---:|---|
| Hero `Abrir/Open captured site` | ES 147.66×44; EN 126.56×44 | 0×0 | No | 7.93:1 | F-G; no local H/A | 10.39px | Target passes; state treatment is incomplete. |
| Hero `Ver/View reference code · <commit>` | ES 239.06×44; EN 203.91×44 | 0×0 | No | 7.93:1 | F-G; no local H/A | 10.39px | Target passes. |
| Compact ledger `Producto en vivo` / `Live product` | 125.23×22 / 91.78×22 | 0×0 | No | 7.93:1 | F-G; no local H/A | **3.19px** | **Fails target at every width** on five public projects per locale. |
| Compact ledger `Código fuente` / `Source code` | 106.03×22 / 91.50×22 | 0×0 | No | 7.93:1 | F-G; no local H/A | **3.19px** | **Fails target at every width** on four public-source projects per locale. |
| Proof-point repository links | 128.25–276.75×44 | 0×0 | Longest wraps at 1024 only | 7.93:1 | F-G; no local H/A | 73.83–277.08px | Target passes; local state absent. |
| Contextual diagnostic CTA | 264–550.81×52.78–100.78 | 14.4×19.2 | Mobile only; no desktop wrap | 5.48:1 | F-G; no local H/A | 153–217px | Geometry/contrast pass, but labels become 2–3 lines on narrow screens. |

#### Project source and CTA destination matrix

The same external targets are used in ES and EN; only visible labels differ.

| Project | Captured/live target | Commit-pinned reference | Public ledger source(s) | Contextual diagnostic |
|---|---|---|---|---|
| Developer Tools | `https://cripterhack.github.io/bigcommerce-wysiwyg-extension/` | `https://github.com/CripterHack/bigcommerce-wysiwyg-extension/tree/fcabcea67d2fecc3f14f648eb2d833b9ab35452e` | `https://apps.izignamx.com/`; Smart Git, Instagram Downloader, BigCommerce repositories | `/<locale>/diagnostic-or-diagnostico/?project=developer-tools&service=developer-tools` |
| Hamburguesa Nómada | `https://nomada.izignamx.com/` | `https://github.com/IzignaMx/hamburguesa-nomada/tree/05467064095c9bb31e7ccc47bb8184f380531706` | `https://github.com/IzignaMx/hamburguesa-nomada` | `...?project=hamburguesa-nomada&service=hamburguesa-nomada` |
| NutriChilango | `https://nutrichilango.izignamx.com/` | `https://github.com/IzignaMx/nutrichilango/tree/a699c3a509c3293ce19f42e2b64201471b2df66c` | `https://github.com/IzignaMx/nutrichilango` | `...?project=nutrichilango&service=nutrichilango` |
| OmniSync | Private repository reference `https://github.com/IzignaMx/OmniSync` | `https://github.com/IzignaMx/OmniSync/tree/a4368b8b50ee32f77d3c585a69563d2e64ca9535` | No public live/source compact pair, correctly reflecting partial confidentiality | `...?project=omnisync&service=omnisync` |
| Tecuiyo | `https://tecuiyo.izignamx.com/` | `https://github.com/CripterHack/tecuiyo-derechos-mx/tree/4f917283d867240144cb3ef34fe0a84c9018a70c` | `https://github.com/CripterHack/tecuiyo-derechos-mx` | `...?project=tecuiyo&service=tecuiyo` |
| VALD | `https://vald.izignamx.com/` / immutable captured commit | `https://github.com/IzignaMx/vald-landing/tree/401c2862b2243bb203e5f0967ed86f2ce44e9c36` | Live VALD link; no public source-code compact link | `...?project=vald&service=vald` |

For contextual diagnostics, ES uses `/es/diagnostico/` and EN uses `/en/diagnostic/`.

### Diagnostic controls

| Family and labels | Size | Padding V×H | Wrap | Contrast | States | Neighbor | Verdict |
|---|---|---|---|---:|---|---:|---|
| Required text inputs: `Nombre/Name`, contact, organization | 270–656.56×51.59 | 12.8×14.4 | No | 20.17:1 | F-L; no H/A | 56px | Pass geometry; no designed valid/invalid/autofill cycle. |
| Required request textarea | 270–656.56×147.59 | 12.8×14.4 | User content wraps | 20.17:1 | F-L; no H/A | 41px | Pass. |
| Optional disclosure summary | 270–656.56×46.38 | 11.2×0 | Label does not wrap | 7.93:1 | F-L; no H/A | 41px | Pass height; no horizontal inset. |
| Optional URL input | 270–656.56×51.59 | 12.8×14.4 | No | 20.17:1 | F-L; no H/A | Nested measurement can read 0 | Pass. |
| Timing/investment selects | 270–656.56×50.59 | 12.8×14.4 | No | 20.17:1 | F-L; no H/A | 0–56px by responsive grid | Pass. |
| Integrations/references textareas | 270–656.56×99.59 | 12.8×14.4 | User content wraps | 20.17:1 | F-L; no H/A | 0–56px | Pass. |
| Consent checkbox | **24×24** | 0×0 | N/A | 20.17:1 | F-L; no H/A | 0px to nested privacy link | **Fails raw 44×44 box at all widths**; the associated label may enlarge the effective click target and needs pointer testing. |
| `aviso de privacidad` | `/es/privacidad/`; 135.30×21 | 0×0 | No | 7.93:1 | F-L; no H/A | 0px within label | **Fails target at all widths.** |
| `privacy notice` | `/en/privacy/`; 97.66×21 | 0×0 | No | 7.93:1 | F-L; no H/A | 0px within label | **Fails target at all widths.** |
| Disabled submit `Envío no disponible` / `Delivery unavailable` | 182.03/186.34×50 | 12×16 | No | 13.59:1 | F-L, disabled; no H/A | Nested action group reads 0 | Pass; explicit unavailable state. |
| `Contactar por correo` / `Contact us by email` | `mailto:hola@izignamx.com?...`; 188.70/179.70×48 | 12×16 | No | 7.93:1 | F-L; no H/A | Nested action group reads 0 | Pass; reliable fallback. |

Optional labels are complete and localized:

- ES: `URL actual`, `Momento ideal`, `Rango de inversión`, `Integraciones necesarias`, `Proyectos de referencia`.
- EN: `Current URL`, `Ideal timing`, `Investment range`, `Required integrations`, `Reference projects`.

## Exact 44×44 failure inventory

The **51 stable failing controls** reconcile as follows:

| Family | Stable instances | Failing viewports | Cause |
|---|---:|---|---|
| ES `English` locale links | 9 | All seven | Width 39.14–43.91px; no horizontal padding. |
| EN `Español` locale links | 9 | 360, 390 | Width 42.70px at narrow widths; no horizontal padding. |
| EN `Projects` links | 9 | 360, 390 | Width 43.48px at narrow widths; no horizontal padding. |
| Uplink privacy links | 2 | All seven | Inline anchors only 18–40.17px high. |
| ES compact live/source ledger links | 9 | All seven | 22px high with zero padding and 3.19px separation. |
| EN compact live/source ledger links | 9 | All seven | Same. |
| Diagnostic checkboxes | 2 | All seven | Raw input box is 24×24; label may enlarge effective target. |
| Diagnostic inline privacy links | 2 | All seven | 21px high with zero padding. |
| **Total** | **51** |  |  |

## CTA intent audit

### Duplicate catalog intent

The same page can expose all of these simultaneously:

- header `Projects/Proyectos`;
- header `Evaluate/Evaluar`;
- hero `Evaluate projects/Evaluar proyectos`;
- `View/Ver evidence in Evaluate`;
- `Explore/Explorar evidence in Evaluate`;
- Uplink `Review/Revisar evidence in Evaluate`.

This is not a broken route, but it dilutes hierarchy and violates Taste’s one-label-per-intent guidance. Preserve the Explore → Evaluate path while choosing one primary catalog label per context.

### Repeated diagnostic intent

Diagnostic entry appears in the header, hero, both encounters, Uplink, and every case. The conversion path is strategically sound; the labels and relative emphasis are not yet normalized. Preserve query parameters and measurement semantics, then consolidate presentation rather than deleting the path.

## Interaction-cycle priorities

1. **P0:** repair undefined spacing tokens before evaluating intended CTA geometry.
2. **P0:** enlarge the 51 failing target families; do not treat `min-height: 44px` as sufficient.
3. **P1:** add a coherent active/pressed state; none of 344 stable controls has one.
4. **P1:** retain the global focus ring, but add component-local focus treatment where backgrounds/materials differ.
5. **P1:** complete hover/invalid/valid/disabled/autofill cycles for catalog and diagnostic inputs.
6. **P1:** shorten mobile contextual diagnostic labels while preserving their exact routes and query context.
7. **P2:** normalize external-link affordances and decide consistently whether arrows/new-tab behavior are exposed.

No component or control was changed by this audit.

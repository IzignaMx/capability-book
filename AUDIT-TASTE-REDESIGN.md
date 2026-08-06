# IzignaMx Capability Book — Taste redesign audit

Audit date: 2026-08-04  
Repository state audited: `main` at `8ebd323`  
Audit mode: **Redesign — Preserve**  
Implementation status: **Audit only; no product/source/config/data changes made**

## Design Read

> Reading this as: a bilingual, evidence-backed developer-studio capability portfolio for technical and procurement evaluators, with a dark-space industrial/editorial language, leaning on custom SCSS, explicit provenance, and restrained cinematic 3D.

### Inferred dials

| Dial | Declared value | Evidence |
|---|---:|---|
| `DESIGN_VARIANCE` | **7** | Asymmetric split heroes, 3D narrative, offset evidence layouts, and editorial scale are distinctive without becoming chaotic. |
| `MOTION_INTENSITY` | **6** | Three.js/GSAP and scroll narrative are meaningful to Explore, but the core evidence and conversion paths remain static and readable. |
| `VISUAL_DENSITY` | **4** | Moderate evidence density, broad negative space, and long-form chapters; neither gallery-minimal nor cockpit-dense. |

The requested starting point of `7 / 6 / 4` is supported by the actual interface. The redesign should not increase these values merely to appear “new.”

## Executive verdict

The site has a strong foundation worth preserving:

- an unusually clear evidence/provenance system;
- complete ES/EN route parity for the flagship flow;
- a recognizable dark-space IzignaMx visual language;
- useful static/no-WebGL fallbacks;
- sound semantic structure, labels, canonicals, alternates, and case schema;
- zero audited runtime/page/request failures and zero document overflow at the required widths.

The current UI is not ready for a purely cosmetic polish pass. Three systemic defects must be corrected first:

1. **P0 CSS token closure:** 16 winning declarations reference undefined spacing tokens and collapse at computed-value time.
2. **P0 evidence framing:** mobile portrait screenshots are destroyed by fixed landscape `cover` frames, retaining only 26.0–28.9% of the source.
3. **P0 interaction geometry:** 51 stable route/control instances fail 44×44 at one or more viewports; footer and CTA spacing failures prove that `min-height: 44px` alone is not enough.

After those corrections, the highest-value redesign work is typographic/rhythm calibration, CTA consolidation, case-hero recomposition, and metadata/a11y state completion—not a stack, font, palette, or logo migration.

## Deliverables

| Deliverable | Status |
|---|---|
| This central audit | `AUDIT-TASTE-REDESIGN.md` |
| Component/control audit | [`audit/component-matrix.md`](audit/component-matrix.md) |
| CSS custom-property audit | [`audit/css-variable-report.md`](audit/css-variable-report.md) |
| Project-cover/evidence audit | [`audit/project-cover-matrix.md`](audit/project-cover-matrix.md) |
| Full-page and component screenshots | [`audit/screenshots/`](audit/screenshots/) |

Capture inventory:

- **133 full-page PNGs:** 19 routes × seven viewports.
- **77 component PNGs:** 11 required components × seven viewports.
- Required viewports: 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080.

## Browser validation summary

| Check | Result |
|---|---:|
| Page loads | 133/133 HTTP 200 |
| Horizontal overflow | 0/133 |
| Console errors | 0 |
| Page errors | 0 |
| Request failures | 0 |
| Control observations | 2,408 |
| Stable route/control instances | 344 |
| Stable controls failing 44×44 at any width | 51 |
| Measured contrast failures | 0 |
| Full-page screenshots | 133 |
| Component screenshots | 77 |

One manually observed development-only warning reports `THREE.Clock` as deprecated in favor of `THREE.Timer`; it is tracked as P2 maintenance.

## Section 11.B — existing-system audit

### 1. Brand and token truth

The redesign must begin from `src/styles/tokens.scss` and the canonical assets, not from a generic Taste preset.

| System | Preserve |
|---|---|
| Primary color | IzignaMx Blue `#3b82f6` |
| Bright blue | `#60a5fa` |
| Cyan | `#22d3ee` |
| Backgrounds | `#020617`, `#0b1120`, and the current dark radial/linear atmosphere |
| Display type | Aptos Display |
| Body type | Aptos |
| Data type | Cascadia Code |
| Mark | Canonical favicon/isotype under `public/` |
| Name | Always `IzignaMx` |

Explicitly blocked as redesign defaults: ADAM.CG PRO, Inter, JetBrains Mono, `#2E96FF`, orange brand/accent tokens, and a replacement wordmark/isotype.

The existing visual language is cohesive: blue/cyan signal accents, dark-space surfaces, data-mono labels, pills for mode/action controls, and evidence frames. Its problem is implementation integrity and scale calibration, not lack of identity.

### 2. Information architecture and page tree

```text
/
├─ /es/
│  ├─ /es/proyectos/
│  │  └─ /es/proyectos/{developer-tools,hamburguesa-nomada,nutrichilango,omnisync,tecuiyo,vald}/
│  ├─ /es/diagnostico/
│  ├─ /es/accesibilidad/
│  └─ /es/privacidad/
└─ /en/
   ├─ /en/projects/
   │  └─ /en/projects/{developer-tools,hamburguesa-nomada,nutrichilango,omnisync,tecuiyo,vald}/
   ├─ /en/diagnostic/
   ├─ /en/accessibility/
   └─ /en/privacy/
```

The root is a language gateway. Each localized home is the Explore narrative; each catalog is Evaluate; all six slugs are stable and mirrored. This IA is coherent and should remain stable.

### 3. Navigation

Shared localized navigation contains:

1. IzignaMx brand → locale home;
2. Explore/Evaluate mode switch;
3. Projects/Proyectos → catalog;
4. Request/Solicitar diagnóstico → diagnostic;
5. paired language route.

Strengths:

- route pairing is explicit rather than machine-translated at runtime;
- `aria-current` and semantic navigation are present;
- the mode model is legible and consistent across pages.

Weaknesses:

- `Projects/Proyectos` and `Evaluate/Evaluar` are duplicate catalog destinations in the same header;
- desktop header is 86px, above Taste’s 80px cap;
- at 360/390/768 it becomes a 155–167px two-row block;
- 360px captures show insufficient horizontal safe area in the second row;
- locale links and EN `Projects` fail 44px target width at narrow sizes.

Do not silently rename navigation labels or URLs. Any consolidation needs an explicit content/measurement decision.

### 4. Conversion paths

Primary path:

```text
Language gateway → Explore home → Evaluate catalog → case evidence → contextual diagnostic
```

Supporting paths:

- Explore hero → catalog or diagnostic;
- project encounter → full case or project-contextual diagnostic;
- QualityScan → proof sources;
- Uplink → quality-context diagnostic, Evaluate, or privacy;
- case → project-context diagnostic;
- diagnostic delivery unavailable → `mailto:` fallback.

This funnel should be preserved. The defect is duplicate intent presentation: a home can expose six differently worded catalog links, while diagnostic intent recurs in the header, hero, two encounters, Uplink, and every case. Consolidate label/priority by context without removing contextual query parameters.

### 5. Value and content blocks

#### Explore home

- asymmetric value-proposition hero;
- “systems with intention” specialty panel;
- signal/assembly narrative;
- six capabilities: Web Experiences, AI and Automation, Data and Visualization, Commerce Systems, Developer Products, Impact Technology;
- two flagship encounters: OmniSync and Hamburguesa Nómada;
- QualityScan proof ledger;
- Uplink conversion close.

The structure is differentiated and evidence-led. It should be edited for rhythm and hierarchy, not replaced by generic feature cards.

#### Evaluate catalog

- clear H1/subtitle;
- project search;
- capability filter;
- result count;
- six evidence-backed cards.

The ES shell is localized but raw classification/capability enums remain English. That weakens bilingual credibility.

#### Case studies

- classification/confidentiality;
- claim and evidence hero;
- solution/narrative;
- visual evidence;
- proof points with source references;
- evidence ledger;
- related services;
- contextual diagnostic.

This is the strongest part of the information model. Preserve provenance, immutable commit references, and the distinction between public production, open-source, and authorized local-demo evidence.

#### Diagnostic

- clear value framing;
- required name, contact method, organization/project, and request;
- optional URL, timing, investment, integrations, references;
- explicit consent/privacy link;
- unavailable endpoint state and email fallback;
- draft persistence in `sessionStorage`.

Labels are above controls, status/error regions are present, and no placeholder is used as a label. The form needs state/target refinement, not restructuring.

### 6. Preserve / reshape / retire

#### Preserve

- brand tokens, type families, favicon/isotype, and dark-space atmosphere;
- Astro static output, React islands, SCSS, GSAP isolation, Three.js/R3F;
- ES/EN slugs, route parity, nav semantics, hreflang, canonical URLs;
- Explore/Evaluate conceptual model;
- semantic HTML content outside the canvas and no-WebGL fallback;
- evidence schema, classifications, confidentiality, licenses, captions, and source links;
- contextual diagnostic query parameters;
- global focus ring, skip link, reduced-motion path, image dimensions/alt;
- language gateway’s calm, clear composition;
- static/cPanel-compatible deployment.

#### Reshape

- H1 scale/line lengths and section rhythm;
- header height/safe area and duplicate catalog intent;
- mobile evidence frames;
- case-hero min-height/alignment;
- CTA labels, target padding, and full interaction states;
- raw taxonomy localization;
- QualityScan and Uplink spacing;
- social metadata and schema-domain consistency;
- dense sci-fi terminology where it obscures evidence.

#### Retire

- undefined custom-property references;
- portrait screenshots cropped into fixed landscape frames;
- zero-gap footer navigation;
- height-only “44px targets” with sub-44 width or inline 18–22px anchors;
- repeated differently worded links for the same catalog intent;
- oversized four/five-line marketing H1s on desktop/common widths;
- empty case-hero vertical space that postpones evidence and conversion;
- product controls with no active state and incomplete hover/form cycles.

### 7. SEO, schema, and social metadata

#### Current strengths

- all 133 localized captures had a description, canonical, and language alternates;
- localized pages expose ES, EN, and `x-default` alternates;
- shared Open Graph type, site name, title, description, URL, and locale exist on localized pages;
- the root gateway has OG type/site/title/description/URL, though no locale/image;
- 12 case routes emit CreativeWork in addition to Organization schema;
- `robots.txt` allows crawling and the sitemap is exposed;
- static HTML validation tooling already exists.

Schema observations across captures:

- root gateway: seven captures with no JSON-LD;
- six localized non-case routes × seven: 42 Organization-only observations;
- 12 case routes × seven: 84 Organization + CreativeWork observations.

#### Gaps

- **all routes lack `og:image`, image dimensions, and image alt metadata**;
- **all routes lack Twitter/X card metadata**;
- root gateway lacks schema and OG locale;
- Organization schema identifies `https://izignamx.com/#organization`, while CreativeWork creator URLs derive from `Astro.site` at `https://book.izignamx.com`; identity/domain intent needs reconciliation, not an arbitrary replacement;
- the root gateway does not share the full BaseLayout metadata contract.

### 8. Accessibility

#### Strengths

- localized skip link and `#main-content` target;
- semantic landmarks and heading structure;
- visible labels for search/filter/form fields;
- live result count and diagnostic status/alert regions;
- no-JS catalog and non-canvas narrative content;
- localized alt/caption text and reserved media dimensions;
- global keyboard focus ring;
- reduced-motion CSS and motion controls;
- all measured text/control contrast pairs pass.

#### Risks and failures

- 51 stable route/control instances fail 44×44 at one or more widths;
- `English`, `Español`, and EN `Projects` links lack horizontal hit-area;
- compact evidence-ledger links are only 22px high and 3.19px apart;
- Uplink privacy links are 18–40.17px high;
- diagnostic privacy links are 21px high;
- raw checkboxes are 24×24; their associated labels may enlarge the effective target and require pointer testing;
- every stable control lacks a local active/pressed state;
- many controls rely only on the global focus ring with no surface-specific focus treatment;
- entrance/3D behavior still needs explicit reduced-motion verification after recomposition;
- the canvas must never become the only route to content.

### 9. Analytics and measurement contract

`data/measurement-plan.json` is a preservation contract, not redesign copy.

Protected event names:

- `explore_started`
- `mode_changed`
- `capability_viewed`
- `project_opened`
- `project_scene_engaged`
- `live_demo_clicked`
- `source_clicked`
- `concept_viewed`
- `diagnostic_started`
- `diagnostic_completed`
- `contact_channel_selected`

Protected dimensions:

- `locale`
- `sourceRoute`
- `sourceProject`
- `sourceCapability`
- `sourceConcept`

Forbidden dimensions:

- `name`, `email`, `phone`, `message`, `organization`

Retention remains 30 days raw and 395 days aggregated. Explore code dispatches `izignamx:portfolio-event`; this audit did not establish a production analytics sink. A redesign may preserve or complete instrumentation, but must not rename events, collect form content, or silently change attribution semantics.

## Technical audits

### CSS custom properties — P0

The exhaustive scanner found:

- 31 unique definitions;
- 401 consumers;
- zero duplicate definitions;
- two undefined consumed names;
- 15 uses of `--space-5` and one use of `--space-10`;
- five defined-but-unused tokens.

The undefined values invalidate full declarations, including padding/margin shorthands. Visible consequences include:

- `AccesibilidadPrivacidadContacto` in the footer;
- zero action padding in ProjectEncounter;
- zero primary padding in Uplink;
- collapsed capability/Explore/information-page spacing;
- no block padding on QualityScan at any audited width.

See the exact 16-declaration ledger in [`audit/css-variable-report.md`](audit/css-variable-report.md).

### CTA and controls — P0/P1

The target-failure families reconcile to exactly 51 stable instances:

- nine ES locale links;
- nine EN locale links;
- nine EN Projects links;
- two Uplink privacy links;
- 18 compact ES/EN live/source evidence links;
- two diagnostic checkboxes;
- two diagnostic privacy links.

No contrast failures were measured. The issue is geometry, padding, proximity, wrapping, and incomplete states. See [`audit/component-matrix.md`](audit/component-matrix.md).

### Project covers — P0

Physical assets are correct and complete:

- posters: 1280×720;
- desktop evidence: 1440×900;
- mobile evidence: 390×844.

The implementation selects portrait evidence at `<=40rem` but keeps landscape frames:

- catalog 16:9 center cover: ~26.0% retained;
- case hero 8:5 top cover: ~28.9% retained.

All six projects and both locales are affected identically. See [`audit/project-cover-matrix.md`](audit/project-cover-matrix.md).

## Priority register

### P0 — must precede visual redesign

| ID | Finding | Evidence | Acceptance criterion |
|---|---|---|---|
| P0-1 | Undefined `--space-5`/`--space-10` invalidate 16 spacing declarations. | Token scanner + footer/Explore screenshots | Every consumed custom property is defined or has an explicit fallback; zero invalid consumers; intended spacing restored at all seven widths. |
| P0-2 | Mobile project screenshots lose 71.1–74.0% in landscape `cover` frames. | 28 cover groups; 390×844 sources vs 16:9/8:5 frames | Primary project evidence remains legible and materially complete at 360/390; no portrait-in-landscape destructive crop. |
| P0-3 | 51 stable controls fail 44×44; compact evidence pairs are only 3.19px apart. | 2,408 observations | Every actionable target is at least 44×44 or has a demonstrably equivalent associated hit area; adjacent compact links have deliberate spacing. |
| P0-4 | Footer and key Explore/Uplink/QualityScan spacing is visibly collapsed. | Full-page/component captures | No concatenated footer labels; CTA/card/section padding matches defined tokens in all seven viewports. |

### P1 — redesign quality and trust

| ID | Finding | Recommended direction |
|---|---|---|
| P1-1 | ES hero is four lines at common desktop; EN commonly three and small-screen five. | Rebalance copy width, display scale, and specialty visual together; keep hero CTAs in initial viewport. |
| P1-2 | Header is 86px desktop and 155–167px on two-row widths; edge inset is weak at 360. | Reduce desktop to <=80px, design an explicit narrow layout, retain nav labels/routes unless separately approved. |
| P1-3 | Case heroes defer content with a large blank top zone. | Recompose min-height/alignment so claim, evidence, and CTA establish value above the fold. |
| P1-4 | Catalog intent has multiple labels/placements on one page. | Select one label per intent per context; preserve the Explore→Evaluate funnel and analytics semantics. |
| P1-5 | Spanish catalog exposes English taxonomy enums. | Localize presentation through a mapping layer; do not change canonical domain values stored in content. |
| P1-6 | All routes lack OG image/Twitter cards; root schema/shared metadata is incomplete. | Add canonical social assets/metadata and align root with shared layout behavior. |
| P1-7 | Organization/CreativeWork domains differ. | Define one intentional organization identity and reference it consistently from CreativeWork. |
| P1-8 | 344/344 stable controls lack active feedback; many lack local hover/focus cycles. | Establish an accessible interaction-state system, including form invalid/valid/autofill/disabled. |
| P1-9 | Diagnostic/case labels become 2–3 lines on mobile. | Shorten visible labels while preserving accessible names, paths, and query context. |
| P1-10 | Reduced-motion coverage is partly global-duration suppression. | Verify every GSAP/Three/entry transition has a meaningful static result and cleanup. |

### P2 — refinement/maintenance

| ID | Finding | Recommended direction |
|---|---|---|
| P2-1 | Root language gateway adds a step. | Keep it unless analytics prove material abandonment; it is visually strong and explicit. |
| P2-2 | Dense sci-fi terms can obscure evidence. | Simplify labels where procurement/technical readers need direct meaning; preserve voice in atmospheric moments. |
| P2-3 | External-link affordances are inconsistent. | Normalize arrow/new-tab semantics and accessible naming. |
| P2-4 | Five canonical tokens are unused. | Review; do not delete solely for zero usage. |
| P2-5 | Three.js reports `THREE.Clock` deprecation in development. | Plan migration to `THREE.Timer` with visual/performance regression tests. |

## Section 11.D — redesign levers in required order

The sequence matters. Do not jump directly to block replacement.

### 1. Typography refresh

Keep Aptos Display/Aptos/Cascadia Code. Refresh means recalibrating scale, measure, weight, line-height, and wrapping—not changing families.

- reduce localized hero H1s to a maximum two lines at common desktop widths where copy permits;
- prevent five-line mobile headlines from dominating the first screen;
- shorten contextual CTA display labels while retaining accessible context;
- keep data/provenance in Cascadia Code but reduce repeated tiny uppercase labels.

### 2. Spacing and rhythm

First close the spacing-token graph. Then:

- restore intended gaps/padding;
- cap desktop header at 80px;
- add narrow-header safe area;
- remove case-hero dead space;
- preserve generous sections where they communicate importance rather than compensating for alignment.

### 3. Color recalibration

No palette migration. Recalibrate within the canonical dark/blue/cyan system:

- use blue for primary conversion, cyan for evidence/signal, and muted text/line tokens for hierarchy;
- reduce undifferentiated glow rather than replacing the palette;
- keep all current contrast passes;
- do not introduce orange or generic AI-purple accents.

### 4. Motion layer

Keep GSAP/Three.js and the current browser-only isolation rules.

- assign every motion a hierarchy, storytelling, feedback, or state-transition purpose;
- keep static content and no-WebGL parity;
- verify `prefers-reduced-motion` at component level;
- preserve cleanup (`context.revert`, trigger kill) and defer 3D;
- migrate deprecated Three timing APIs separately.

### 5. Hero and key-section recomposition

- retain the asymmetric home hero but rebalance type and specialty panel;
- redesign case hero vertical alignment and mobile evidence frame;
- let catalog cards show enough evidence to be useful;
- tighten QualityScan/Uplink composition after token spacing is valid.

### 6. Full block replacement

Use only if the prior five levers cannot solve a block. No current evidence justifies replacing the language gateway, case-study information model, evidence ledger, diagnostic flow, or Explore/Evaluate architecture wholesale.

## Likely-change files for a future implementation

This is a forecast, not an implementation instruction.

| Concern | Likely files |
|---|---|
| Close token graph and spacing regression | `src/styles/tokens.scss`; token/design tests under `tests/` |
| Shared footer spacing/metadata | `src/layouts/BaseLayout.astro` |
| Explore, QualityScan, Uplink rhythm | `src/styles/explore.scss` |
| Information-page spacing | `src/styles/information-page.scss` |
| Encounter CTA geometry | `src/components/explore/ProjectEncounter.astro` |
| Header geometry/safe area | `src/components/navigation/SiteHeader.astro`; `src/components/core/ModeSwitch.astro` |
| Home hero typography/CTA hierarchy | `src/pages/es/index.astro`; `src/pages/en/index.astro`; `src/features/explore/ExploreNarrative.tsx` |
| Catalog localization/card frames/states | `src/components/projects/ProjectCatalog.tsx` |
| Case hero framing/above-fold composition | `src/components/projects/ProjectCaseStudyHero.astro`; localized `[slug].astro` templates |
| Evidence-link target/state system | `src/components/projects/ProjectEvidenceFigure.astro`; `src/components/projects/ProofPoint.astro` |
| Diagnostic interaction states | `src/components/conversion/DiagnosticWizard.scss`; possibly `DiagnosticWizard.tsx` for accessible display-label refinements |
| Organization/schema identity | `src/components/seo/OrganizationSchema.astro`; case schema in localized `[slug].astro` templates |
| Social metadata | `src/layouts/BaseLayout.astro`; `src/pages/index.astro`; canonical social asset under `public/` if separately approved |
| Motion/timing maintenance | relevant `src/experience/`, `src/motion/`, or ExploreCanvas scene files after targeted discovery |
| Regression coverage | `tests/` unit/e2e/a11y suites and existing budget/HTML validators |

## Blocked/preserved files and contracts

The following are not redesign free space:

| Protected area | Constraint |
|---|---|
| `src/styles/tokens.scss` brand values | May add a justified missing spacing token, but must not replace canonical colors or fonts. |
| `public/favicon.svg` and canonical isotype | No replacement or silent redraw. |
| `public/media/projects/**` | Existing evidence must remain immutable/provenance-safe. New art-directed derivatives require explicit approval and traceability. |
| `data/evidence/*.json` and schema | Do not alter classification, confidentiality, license, provenance, source IDs, or proof relationships for visual convenience. |
| `data/measurement-plan.json` | Do not rename events/dimensions, add personal fields, or change retention silently. |
| Route/slugs and locale parity | No URL, slug, canonical, alternate, or `x-default` changes without migration approval. |
| Primary nav labels | No silent rename; CTA consolidation requires explicit content decision. |
| Diagnostic fields/order and legal copy | Preserve unless separately approved and revalidated for consent/a11y. |
| Architecture | Preserve Astro, React islands, SCSS, GSAP, Three.js/R3F, static output, and cPanel-compatible hosting. |
| Evidence/static fallbacks | Canvas/motion may enhance but never replace accessible HTML evidence. |

## Risks

1. **Evidence integrity:** a visually cleaner crop can accidentally hide proof or misrepresent a project.
2. **Bilingual drift:** changing one locale’s copy/layout without its pair breaks route and trust parity.
3. **SEO migration:** moving/renaming routes or organization IDs can fragment canonical/entity signals.
4. **Analytics drift:** changing labels and paths without preserving event semantics breaks baseline comparison.
5. **Motion regression:** reworking heroes can increase bundle cost, CLS, main-thread work, or reduced-motion failures.
6. **3D budgets:** visual enhancement can breach the existing bootstrap/deferred-scene/asset budgets.
7. **Accessibility regression:** adding padding/animation is insufficient unless keyboard, focus, target, and state cycles are retested.
8. **Static-hosting regression:** server-only assumptions or runtime image pipelines would violate deployment constraints.
9. **Token patching:** replacing each undefined use ad hoc would deepen inconsistency; the scale must be resolved centrally.
10. **Capture artifacts:** focused skip links in some component screenshots should not be “fixed away”; they prove focus visibility.

## Recommended implementation plan

No implementation is included. If approved later, use this order:

### Phase 0 — freeze contracts and acceptance tests

- record route, evidence, analytics, brand, and budget invariants;
- add a custom-property closure test;
- define target/crop acceptance criteria for the seven viewports.

### Phase 1 — P0 token and target repair

- resolve `--space-5`/`--space-10` centrally;
- restore footer/Explore/Uplink/QualityScan geometry;
- repair all 51 target families;
- rerun component screenshots before visual redesign.

### Phase 2 — evidence framing

- choose an explicit mobile strategy per catalog and case hero;
- preserve captions, alt, provenance, dimensions, and CLS reservation;
- validate every six-project × two-locale context.

### Phase 3 — typography and rhythm

- recalibrate heroes and header;
- remove case dead space;
- preserve Aptos/Cascadia and current palette;
- localize taxonomy through presentation mappings.

### Phase 4 — interaction and conversion hierarchy

- consolidate repeated catalog/diagnostic labels by context;
- add hover/focus/active/form cycles;
- preserve routes, queries, and measurement events.

### Phase 5 — metadata/entity alignment

- add OG image and Twitter cards;
- bring the gateway into the shared metadata/schema contract;
- reconcile Organization/CreativeWork identity.

### Phase 6 — motivated motion and final validation

- refine only motion that communicates hierarchy/story/state;
- verify static and reduced-motion modes;
- run evidence validation, checks, unit tests, build/budgets, e2e, a11y, HTML validation, and the complete 19×7 visual matrix.

## Exit gate

The audit is complete when these artifacts exist and no product implementation has occurred. That condition is met by the report set and screenshot tree. The recommended next decision is whether to approve **Phase 0/1 only**, not a wholesale visual rewrite.

Audit stops here.

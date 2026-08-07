# Project cover and visual-evidence matrix

Audit date: 2026-08-04  
Branch/commit: `main` at `8ebd323`

## Verdict

The project media system is complete, localized, and physically consistent, but the responsive selection policy is wrong for the containers that consume it.

- All six projects have an owned 1280×720 `fallbackPoster`.
- All six `visualEvidence[0]` records have 1440×900 desktop AVIF/WebP and 390×844 mobile AVIF/WebP variants.
- ES and EN select the **same physical media**; only alt text/captions are localized.
- Home encounters are safe: the 16:9 poster is shown in a 16:9 frame with no crop.
- Catalog mobile is **P0**: a 390×844 portrait screenshot is forced into a 16:9 centered `cover` frame, retaining about **26.0%** of the screenshot and discarding about **74.0%**.
- Case hero mobile is **P0**: the same portrait is forced into an 8:5 top-anchored `cover` frame, retaining about **28.9%** and discarding the lower **71.1%**.
- Catalog desktop has a mild crop: 8:5 evidence in a 16:9 frame retains 90% of source height.
- Case hero desktop is ratio-correct and uncropped, but its surrounding hero uses excessive min-height/end alignment, creating a large blank area above the evidence.

The issue is not missing media. It is the mismatch between portrait source selection and fixed landscape cover frames.

## Physical asset truth

Dimensions were read from all 30 project image files, not inferred from declarations.

| Asset role | Format count | Physical dimensions | Ratio |
|---|---:|---:|---:|
| `poster.avif` | 6 | 1280×720 | 16:9 / 1.778 |
| `home-desktop.avif` | 6 | 1440×900 | 8:5 / 1.600 |
| `home-desktop.webp` | 6 | 1440×900 | 8:5 / 1.600 |
| `home-mobile.avif` | 6 | 390×844 | portrait / 0.462 |
| `home-mobile.webp` | 6 | 390×844 | portrait / 0.462 |

## Canonical project media and evidence classification

| Slug | ES / EN title | `fallbackPoster` | `visualEvidence[0]` and variants | Project classification | Evidence role, license, provenance |
|---|---|---|---|---|---|
| `developer-tools` | Colección de herramientas para desarrollo / Developer Tools Collection | `/media/projects/developer-tools/poster.avif` | `bigcommerce-demo-production`; `/media/projects/developer-tools/evidence/home-{desktop,mobile}.{avif,webp}` | `open-source`; public | Screenshot; client-authorized; `direct-production-capture`; commit `fcabcea…` |
| `hamburguesa-nomada` | Hamburguesa Nómada / Hamburguesa Nómada | `/media/projects/hamburguesa-nomada/poster.avif` | `home-production`; matching evidence path | `real`; public | Screenshot; client-authorized; `direct-production-capture`; commit `0546706…` |
| `nutrichilango` | NutriChilango / NutriChilango | `/media/projects/nutrichilango/poster.avif` | First home evidence; matching evidence path | `real`; public | Screenshot; owned; `direct-production-capture`; commit `a699c3a…` |
| `omnisync` | OmniSync / OmniSync | `/media/projects/omnisync/poster.avif` | `home-local-demo`; matching evidence path | `internal`; `partial` confidentiality | Screenshot; owned; `local-development-capture`; authorized simulated data, explicitly **not** a public production instance; commit `a4368b8…` |
| `tecuiyo` | Tecuiyo / Tecuiyo | `/media/projects/tecuiyo/poster.avif` | First home evidence; matching evidence path | `real`; public | Screenshot; open-license; `direct-production-capture`; commit `4f91728…` |
| `vald` | VALD / VALD | `/media/projects/vald/poster.avif` | First home evidence; matching evidence path | `real`; public | Screenshot; owned; `direct-production-capture` from immutable 2025 commit `401c286…` |

Every poster is classified as an illustrative fallback. Every catalog/case cover uses the first evidence item, which is classified as a screenshot. Provenance and confidentiality must remain visible in any redesign.

## Rendering policy by context

| Context | Data source | Source selected at 360/390 | Source selected at 768–1920 | Container | `object-fit` / position | Retained source | Finding |
|---|---|---|---|---|---|---:|---|
| Explore `ProjectEncounter` | `fallbackPoster` | 1280×720 poster | Same poster | 16:9, max 43rem | `cover` / center | 100% | Safe; no responsive `<picture>`, but ratio and source agree. |
| Evaluate `ProjectCatalog` card | `visualEvidence[0]` | 390×844 `home-mobile.avif` (WebP fallback) | 1440×900 `home-desktop.avif` (WebP fallback) | 16:9 | `cover` / center | Mobile ~26.0%; desktop 90.0% | **P0 mobile evidence loss**; desktop crops ~5% top and bottom. |
| `ProjectCaseStudyHero` | `visualEvidence[0]` | 390×844 `home-mobile.avif` (WebP fallback) | 1440×900 `home-desktop.avif` (WebP fallback) | 8:5 | `cover` / top center | Mobile ~28.9%; desktop 100% | **P0 mobile evidence loss**; top anchoring discards the lower 71.1%. |
| Evidence figure inside case body | Explicit evidence item | Responsive source | Responsive source | Intrinsic/auto-height figure | No fixed landscape crop | Full evidence | Preserve this evidence-first behavior. |

The source switch is `media="(max-width: 40rem)"`. Thus only the audited 360 and 390 widths select portrait variants; 768 and above select desktop evidence.

### Crop math

- Catalog mobile: `390 ÷ (16/9) = 219.4px` of the 844px source height is visible: `219.4/844 = 26.0%`.
- Case mobile: `390 ÷ (8/5) = 243.75px` visible: `243.75/844 = 28.9%`.
- Catalog desktop: `1440 ÷ (16/9) = 810px` of 900px visible: `90%` retained.
- Case desktop and encounter posters match their frame ratios: `100%` retained.

## ES/EN Explore-home comparison

Only OmniSync and Hamburguesa Nómada appear as ProjectEncounter chapters. Both locales use the same source and geometry.

| Route | Project | Selected at all seven viewports | Natural / declared | Frame | Crop | Evidence classification shown |
|---|---|---|---|---|---|---|
| `/es/` | OmniSync | `/media/projects/omnisync/poster.avif` | 1280×720 / 1280×720 | 16:9, center cover | None; 100% retained | Internal / partial disclosure; illustrative poster rather than screenshot |
| `/en/` | OmniSync | Same physical asset | 1280×720 / 1280×720 | Same | None | Same classification, localized text |
| `/es/` | Hamburguesa Nómada | `/media/projects/hamburguesa-nomada/poster.avif` | 1280×720 / 1280×720 | 16:9, center cover | None | Real/public; illustrative poster |
| `/en/` | Hamburguesa Nómada | Same physical asset | 1280×720 / 1280×720 | Same | None | Same classification, localized text |

### Home finding

The posters are visually safe and preserve layout stability, but the presentation changes evidence mode without a strong visible cue: Explore uses illustrative posters, while Evaluate and cases use evidence screenshots. Preserve both roles, but make the role/provenance distinction explicit rather than letting the image alone imply equivalent proof.

## ES/EN catalog cover matrix

The following applies to every card in `/es/proyectos/` and `/en/projects/`. ES and EN asset selection is structurally identical.

| Slug | ES route/card | EN route/card | 360/390 selected asset | 768–1920 selected asset | Mobile observed crop | Desktop observed crop | Evidence classification |
|---|---|---|---|---|---|---|---|
| `developer-tools` | `/es/proyectos/` → developer-tools | `/en/projects/` → developer-tools | `/media/projects/developer-tools/evidence/home-mobile.avif` | `/media/projects/developer-tools/evidence/home-desktop.avif` | Center slice only; ~26.0% retained, top and bottom discarded | ~90% retained | Screenshot; open-source/public; client-authorized direct production capture |
| `hamburguesa-nomada` | `/es/proyectos/` → hamburguesa-nomada | `/en/projects/` → hamburguesa-nomada | `/media/projects/hamburguesa-nomada/evidence/home-mobile.avif` | `/media/projects/hamburguesa-nomada/evidence/home-desktop.avif` | Same severe center crop | Same mild crop | Screenshot; real/public; client-authorized direct production capture |
| `nutrichilango` | `/es/proyectos/` → nutrichilango | `/en/projects/` → nutrichilango | `/media/projects/nutrichilango/evidence/home-mobile.avif` | `/media/projects/nutrichilango/evidence/home-desktop.avif` | Same severe center crop | Same mild crop | Screenshot; real/public; owned direct production capture |
| `omnisync` | `/es/proyectos/` → omnisync | `/en/projects/` → omnisync | `/media/projects/omnisync/evidence/home-mobile.avif` | `/media/projects/omnisync/evidence/home-desktop.avif` | Same severe center crop | Same mild crop | Screenshot; internal/partial; authorized simulated local-development capture |
| `tecuiyo` | `/es/proyectos/` → tecuiyo | `/en/projects/` → tecuiyo | `/media/projects/tecuiyo/evidence/home-mobile.avif` | `/media/projects/tecuiyo/evidence/home-desktop.avif` | Same severe center crop | Same mild crop | Screenshot; real/public; open-license direct production capture |
| `vald` | `/es/proyectos/` → vald | `/en/projects/` → vald | `/media/projects/vald/evidence/home-mobile.avif` | `/media/projects/vald/evidence/home-desktop.avif` | Same severe center crop | Same mild crop | Screenshot; real/public; owned immutable production capture |

### Catalog finding

The mobile-specific files are not suitable as `cover` sources for landscape cards. They are portrait page captures, not landscape crops. A redesign should either:

1. let the frame become portrait/auto-height on mobile;
2. keep a landscape frame but use an intentionally art-directed landscape crop/poster; or
3. use `contain` with a designed surface/scrim that makes the full screenshot legible.

Do not merely change `object-position`; no position can recover 74% discarded content.

## Every case-hero route

At 360/390, each route chooses its 390×844 portrait AVIF and crops it into an 8:5 frame with `object-position: top center`. At 768–1920, each chooses the ratio-matched 1440×900 desktop AVIF. WebP is the fallback for each variant.

| Route | `visualEvidence[0]` selected at 360/390 | Selected at 768–1920 | Container/position | Observed result |
|---|---|---|---|---|
| `/es/proyectos/developer-tools/` | `/media/projects/developer-tools/evidence/home-mobile.avif` | `/media/projects/developer-tools/evidence/home-desktop.avif` | 8:5; cover; top center | Mobile retains top 28.9%; desktop retains 100%. |
| `/en/projects/developer-tools/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop; localized caption/alt only. |
| `/es/proyectos/hamburguesa-nomada/` | `/media/projects/hamburguesa-nomada/evidence/home-mobile.avif` | `/media/projects/hamburguesa-nomada/evidence/home-desktop.avif` | Same | Mobile retains top 28.9%; desktop retains 100%. |
| `/en/projects/hamburguesa-nomada/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop. |
| `/es/proyectos/nutrichilango/` | `/media/projects/nutrichilango/evidence/home-mobile.avif` | `/media/projects/nutrichilango/evidence/home-desktop.avif` | Same | Mobile retains top 28.9%; desktop retains 100%. |
| `/en/projects/nutrichilango/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop. |
| `/es/proyectos/omnisync/` | `/media/projects/omnisync/evidence/home-mobile.avif` | `/media/projects/omnisync/evidence/home-desktop.avif` | Same | Mobile retains top 28.9%; desktop image uncropped, but surrounding hero has excessive blank space. |
| `/en/projects/omnisync/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop and blank-zone behavior. |
| `/es/proyectos/tecuiyo/` | `/media/projects/tecuiyo/evidence/home-mobile.avif` | `/media/projects/tecuiyo/evidence/home-desktop.avif` | Same | Mobile retains top 28.9%; desktop retains 100%. |
| `/en/projects/tecuiyo/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop. |
| `/es/proyectos/vald/` | `/media/projects/vald/evidence/home-mobile.avif` | `/media/projects/vald/evidence/home-desktop.avif` | Same | Mobile retains top 28.9%; desktop retains 100%. |
| `/en/projects/vald/` | Same physical mobile asset | Same physical desktop asset | Same | Same crop. |

The `<img>` fallback declares 1440×900 even when the selected `<source>` is 390×844. The CSS aspect-ratio reserves the landscape frame, so layout is stable, but the declared intrinsic intent and selected portrait content diverge.

## Evidence-integrity guardrails

Any redesign must preserve:

1. the distinction among `real`, `open-source`, and `internal` projects;
2. public versus `partial` confidentiality;
3. visual-evidence role (`screenshot`) versus fallback role (`illustrative`);
4. license and provenance (`owned`, `client-authorized`, `open-license`; direct production versus local development);
5. immutable commit references and localized captions;
6. OmniSync’s explicit simulated-data/non-public-production disclosure;
7. alt text and fixed dimensions or equivalent aspect-ratio reservation to avoid CLS.

## Recommended order

1. **P0:** change the mobile frame/source contract so full evidence is not destroyed.
2. **P1:** decide whether desktop catalog cards should preserve all 8:5 evidence or use intentional 16:9 art direction.
3. **P1:** reduce case-hero empty vertical space without hiding provenance/captions.
4. **P2:** make poster-versus-screenshot roles explicit in Explore.
5. Re-capture all 28 route/cover contexts in both locales after changes.

No media, metadata, content record, or rendering component was modified by this audit.

# Sculptural Editorial Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved sculptural/editorial art direction across the existing Book while preserving its identity, truthful evidence and usability.

**Architecture:** A shared eight-signature SVG vocabulary and a small native-scroll motion owner connect the homepage, archive, cases and map. An original Higgsfield folio supplies real rendered artwork and an optional lightweight GLB for the explicitly activated constellation. Existing Astro static delivery, React controls and project data remain authoritative.

**Tech Stack:** Existing Astro 7, React 19, TypeScript, CSS/SVG, deferred Three.js, Sharp, pnpm 10.13.1 and Node 22. No dependency additions.

**Spec:** `docs/superpowers/specs/2026-11-04-book-sculptural-atlas-design.md` — approved by the user together with the two Higgsfield concept images (2.5 estimated credits total).

## Global Constraints

- Keep all existing `--bk-*` color values, Aileron, current icons, logo, control focus and spacing/type scales. New artwork uses the same blue/graphite/pale/cyan range.
- Eight cases, 32 localized content destinations, existing stages, narratives, captures, image bytes and `portfolio-catalog.json` stay unchanged.
- Default delivery is prerendered HTML plus CSS/SVG. Native scroll; no automatic WebGL on entry, no scroll trapping, per-frame React state or loading gate.
- Keep critical HTML+CSS ≤120 KiB gzip, initial JS ≤180 KiB gzip, 3D bootstrap ≤250 KiB gzip, deferred scenes ≤1.5 MiB transfer, GLB ≤700 KiB, posters ≤180 KiB mobile / ≤320 KiB desktop.
- Preserve reduced-motion, forced colors, touch pan-y, keyboard, no-JS content, observer/setup failure fallbacks and cleanup on hide/offscreen/unmount.
- Exactly two approved paid image explorations; do not submit further paid generation. Higgsfield 3D scene edits/renders use their supported tools and source/version guards.
- Work on `feat/book-sculptural-atlas`; preserve main-only quality/e2e/accessibility/deploy flow. No Awwwards submission, payment, DNS or CDN-setting changes.

## Review Focus

1. Restored scroll/hash navigation: completed content is visible and active reading anchors remain usable.
2. Preferences changing during lazy work: reduced motion/forced colors/closing 3D cannot mount an unwanted renderer or keep drawing.
3. Missing art or observer support: real evidence and links remain visible; enhancements fail open.
4. Short/touch screens: no clipped headline, hidden control, horizontal overflow or trapped vertical gesture.
5. Immutable evidence contract: only decorative assets change; shared project identities, real images, stages and provenance remain exact.

## Task 1: Shared visual grammar and bounded motion

**Files:** create `atlas/book/art/trajectories.ts`, `TrajectoryMark.tsx`, `FolioArt.tsx`, `useAtlasMotion.ts`, `atlas-art.css`; create `tests/atlas-art.test.tsx`.

**Interfaces:**
- `projectSignature(slug: string): readonly [string, string, string]` returns the existing three-path study for each case, safe fallback to OmniSync.
- `atlasPhase(progress: number): { index: 0 | 1 | 2 | 3; name: 'matter' | 'trajectory' | 'weave' | 'constellation'; progress: number }` clamps unsafe input.
- `TrajectoryMark({slug, activePath?, compact?, className?})` is decorative SVG, no extra accessible chatter.
- `FolioArt({phase, className?, eager?})` is a decorative responsive picture using `/art/folio/<phase>-desktop.{avif,webp}` (1600×1100) and `<phase>-mobile.{avif,webp}` (800×1000); asset failure hides only the art. Text stays native.
- `useAtlasMotion(ref, {enabled?: boolean})` enhances a supplied element, sets `data-atlas-motion`, `data-atlas-stage`, `--atlas-progress`, bounded pointer CSS offsets, and exposes no per-frame React state. Default SSR content is complete. One event-batched RAF owner with pause/cleanup, visibility and preferences.

- [ ] Test safe phase mapping, eight signatures, unknown project fallback, full SSR semantics, reduced-mode/no-observer fail-open, event burst coalescing and unmount cleanup.
- [ ] Implement the shared grammar using current decision-study paths and established CSS variables.
- [ ] Run focused Vitest tests and Atlas typecheck; review lifecycle behavior independently before integration.

## Task 2: Higgsfield original folio and media provenance

**Files:** create `public/art/folio/*`, `docs/atlas/folio-provenance.json`, `docs/atlas/SCULPTURAL-ART-DIRECTION.md`; preserve build assets outside evidence paths.

**Interfaces:** four phase names from Task 1; same framing and dimensions across poses. Optional `/art/folio/folio.glb` must fit 700 KiB. Document actual GLB use versus a procedural counterpart truthfully.

- [ ] Wait for the two already submitted Recraft V4.1 jobs; display together and inspect actual images. No retry with a new paid job on uncertain submission.
- [ ] Create one approved private 3D Jutsu project; read required scene/modeling/light references. Inspect state, then author eight editable folio leaves, deliberate shared junction, camera and light rig.
- [ ] Review low-resolution silhouette/render; correct the largest visual defect before polish. Publish four desktop/mobile poses from the same model, inspect all, then export verified GLB/editable source when useful.
- [ ] Convert actual PNG renders to responsive AVIF/WebP with Sharp, retaining composition; enforce byte limits. Record job IDs, scene revision, render IDs, prompts, dimensions and SHA-256. Include no signed download URLs or local paths in public provenance.
- [ ] Show the settled scene once after visual verification. Preserve all project screenshot bytes and catalog hashes.

## Task 3: Homepage and archive composition

**Files:** modify `atlas/book/Discovery.tsx`, `GameShelf.tsx`; create `discovery-art.css`. Root integrator owns `Chrome.tsx` Card changes to avoid shared edits.

**Consumes:** Task 1 components and native motion, Task 2 art paths.
**Produces:** the existing Home/Archive/Compare exports and all current controls/selectors, with additional scoped classes and signature composition.

- [ ] Keep headline, real-image selector and direct actions intact; replace generic software-window emphasis with one sculptural composition plus clearly separate actual evidence plane.
- [ ] Connect selected project, signature, title and screenshot; add a deliberate native-scroll sequence using the four phases. Keep art out of pointer hit testing.
- [ ] Make archive gallery/list feel like one authored numbered index. Preserve query/category/view/compare behavior and no-JS catalog.
- [ ] Recompose mobile as a strong lead plus compact secondary work while all eight cases remain reachable; keep game stage and play labels truthful.
- [ ] Compare desktop and 320/390px screenshots, native/reduced modes and focused interactions before broad integration. No invented proof or replacement project screenshots.

## Task 4: Case reading and decision studies

**Files:** modify `atlas/book/Case.tsx`, `CaseNavigation.tsx`, `DecisionStudy.tsx`, `RelatedCases.tsx`; create `case-art.css` (avoid editing the shared base CSS).

**Consumes:** `projectSignature`, `TrajectoryMark`, `FolioArt` and existing reading/context helpers. Keep existing Case props and anchor IDs.

- [ ] Add the case signature/registration language to title, chapter rail and phase study; replace duplicated local paths with the shared function.
- [ ] Link phase emphasis to explicit selection or existing active-chapter events; keep art decorative and state updates semantic rather than per-frame.
- [ ] Preserve every narrative/real capture, native/fit image viewer, caption/provenance, keyboard focus and original links. Preserve existing anchor margin because HTML already adds 108px scroll padding.
- [ ] Verify all eight cases and both locales, direct hash entry, mobile contents, dialog Escape/return focus, missing art and reduced/forced-color states. No new marketing copy.

## Task 5: Static and activated constellation

**Files:** modify `atlas/book/Map.tsx`, `ConstellationRuntime.tsx`; create `map-art.css`.

**Consumes:** shared signatures, phase art, optional verified folio GLB. Keeps count/selected/spread/zoom/resetEpoch/playing/reduced/onSelect/onError contract.

- [ ] Recompose the passive SVG with recognizable signatures/numbers and the same folio family; preserve all project selection buttons and static navigation.
- [ ] Replace generic central core with the actual folio GLB if it improves the view, otherwise a documented faithful procedural counterpart. Load only after explicit activation. No new 3D package.
- [ ] Keep real controls, node count, ray picking, keyboard rotation, pause/reset, selection and touch pan-y. Dispose late-resolving assets when closed, lost, hidden or otherwise superseded; no rendering when idle/hidden/offscreen.
- [ ] Run current actual-pixel/draw lifecycle checks plus delayed-load/preference and failed-load tests. Inspect the genuine model, not just counters.

## Task 6: Whole-site integration, evidence and production delivery

**Files:** root integrates `BookPage.tsx`, `Chrome.tsx`, `Editorial.tsx`, `Brief.tsx`, layout/style imports, documentation and new verification scripts as necessary. Product data and screenshots are immutable.

- [ ] Connect supporting pages with restrained signature/registration treatment, keep navigation/controls and transactions direct. Verify accessible IzignaMx spelling while preserving intended visual uppercase.
- [ ] Check the approved spec against all surfaces and actual two concept images / 3D renders. Create a fidelity ledger with typography, palette, composition, image framing, section rhythm and mobile findings; fix material mismatches.
- [ ] Frozen install; evidence validation; brand/type/token checks; unit/lifecycle tests; static build; manifest verification before/after e2e and accessibility. Add no CI bypass or budget exemption.
- [ ] Extend browser checks for real scroll progression/reverse, event coalescing, no-JS, reduced motion, forced colors, short layouts, artwork failure and delayed WebGL cancellation. Run the existing 619-check suite and 16-page accessibility audit.
- [ ] Capture the complete representative route/viewport matrix; inspect images and motion. Verify all catalog/source/evidence hashes match baseline.
- [ ] Commit on feature branch, create PR, inspect CI on exact final head, merge through existing permissions only when green. Verify main artifact's Pages deployment and ordinary domain release independently; smoke-check new art and core flows live.
- [ ] Prepare actual 1600×1200 presentation screenshots, a recording of the real interface, source/asset credits and measured limits for a future Awwwards submission. Do not submit or purchase an entry.

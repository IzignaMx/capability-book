# Atlas Composition Implementation Plan

> **For agentic workers:** Use parallel workers on the independent file boundaries below, with one integrated review before publication.

**Goal:** Make the approved sculptural Atlas feel like one authored scene, connecting selection, artwork and authentic evidence.
**Architecture:** Extend existing React/SVG/CSS surfaces and the single motion coordinator; reuse the original Higgsfield folio and native document navigation.
**Tech Stack:** Astro, React, TypeScript, CSS, native SVG, Higgsfield 3D Jutsu.
**Spec:** docs/superpowers/specs/2026-11-04-book-sculptural-atlas-design.md (already approved); this is a compositional refinement within its delegated implementation choices. User explicitly said continue on this renewed request.

## Global constraints
- Preserve palette tokens, Aileron, 1312px width and established spacing/focus/component system.
- Preserve eight cases, authentic media/data, native scroll, map opt-in, reduced/forced-color/no-JS completeness and existing CI/Pages/Cloudflare pipeline.
- No new runtime dependency, default WebGL, new paid media, or award submission.
- Existing byte limits remain mandatory. New render work uses supported 3D Jutsu tools and documented provenance only.

## Review focus
- Mobile initial active-project identity and all eight selectors must be usable without a long empty art block.
- Selection must update the authored large trajectory, station and real evidence together, including keyboard/reduced-motion.
- Motion must settle to zero pending frames and stop when hidden/offscreen; no per-frame React state.
- Map preview must retain a real capture and accessible case link without duplicating live announcements or IDs.
- Art failure/noJS must keep complete content without native broken-image chrome.

### Task 1: Integrated hero plate
- [ ] Modify Discovery.tsx + add HeroAtlas.tsx + hero-atlas.css; leave shared motion and Map to their owners.
- [ ] Compose original folio with eight decorative stations and enlarged selected signature; bind to active project.
- [ ] Compact responsive opening; show active case identity earlier while preserving full evidence and selector semantics.
- [ ] Verify selection/SSR/390/320/reduced/native + meaningful browser regression; run Atlas check.

### Task 2: Bounded depth and continuity
- [ ] Extend useAtlasMotion.ts coordinated surfaces with optional finite temporal settling, no extra event owner.
- [ ] Add regression for convergence, last visible geometry, preference/visibility changes, cleanup and zero idle frames.
- [ ] Existing direct single-surface API remains compatible.

### Task 3: Immediate constellation context
- [ ] Modify Map.tsx/map-art.css: compact active-project preview before inspector controls using original data/realcapture.
- [ ] Preserve eight controls/native map/opt-in and existing full selected section; avoid duplicate live regions.
- [ ] Verify selection, case route, 390/320/native/forced/reduced, full map regression.

### Task 4: Case continuity, Higgsfield and delivery
- [ ] Root refines Case.tsx/case-art.css with project-linked registration/signature composition and stronger visual hierarchy.
- [ ] Higgsfield worker inspects existing scene and tests camera framing; only ship a new render if actually better and provenanced, otherwise retain reviewed assets.
- [ ] Build/check/unit + same-artifact existing browser/a11y gates, integrated real screenshots, new focused visual regression.
- [ ] Fresh branch review, resolve important findings, PR with completeCI thenmerge/mainCI/Pages/Cloudflare/domain verify. Prepare real-interface presentation and receipt.

## Chromium 140 focus visibility follow-up

The exact PR browser gate reproduced a persistent native-focus occlusion at 320×568: a viewport-visible first selector remained behind the sticky case preview even after scrolling settled and with application scripts blocked. Waiting longer did not solve it. The current layout remains appropriate, but automatic focus scrolling in this engine does not account for the sticky preview.

Add a scoped focus visibility repair to manual project selectors: inspect actual bounds only on focus and call native `scrollIntoView` only when the sticky preview obscures the target or it falls outside the viewport. Preserve native selection, wheel/touch scrolling, the single motion coordinator, all strict focus regressions and complete static content. Visible targets must not move; no UA branch, observer, animation loop or document-wide scroll handler is permitted. Validate against the failing pinned Chromium and the independent cross-engine matrix before merging.

Independent WebKit mouse and touch traces also require respecting native pointer activation: retain a target-specific pointer association through compatibility focus/click, consume it on matching focus, and clear only matching completed/cancelled/blurred gestures. Touch focus can follow pointerup. The focus repair must not move a target between press and release; keyboard/programmatic focus and the strict Chromium 140 conditions remain unchanged.

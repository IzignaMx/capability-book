# Phase 2 review checklist

Use this checklist against the production build from the latest commit on
`feat/phase-2-cinematic-slice`. The cinematic layer is optional enhancement:
all information, navigation, evidence, and conversion paths must remain usable
without WebGL or client-side JavaScript.

## Automated release gates

- [x] `pnpm validate:evidence`
- [x] `pnpm check`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] `pnpm test:e2e`
- [x] Pa11y passes all configured bilingual routes against `pnpm preview`.
- [x] `pnpm verify:3d-budgets`
- [x] The local Pages artifact candidate contains the Explore poster and all
      emitted deferred scene chunks.
- [ ] Required GitHub checks pass on the latest pull-request commit.

Local verification on 2026-07-22 passed 98 unit tests, five Chromium E2E
flows, 14 Pa11y URLs, 23 generated routes, built-HTML validation, and both
general and cinematic transfer budgets. The Explore fallback is a 1600×900
sRGB AVIF at 27,962 bytes. Remote checks remain intentionally open until the
draft pull request exists.

The automated suite covers one-canvas ownership, a permanent quality downgrade
after a 120-frame slow window, reduced-motion parity, controlled renderer
failure, bidirectional chapter traversal, diagnostic context, keyboard flow,
HTML validity, brand rules, and initial/deferred transfer budgets.

## Viewport and interaction review

- [ ] Desktop 1440×900, standard motion, medium quality.
- [ ] Mobile 390×844, low quality, touch-only navigation.
- [ ] Reduced motion creates no canvas and preserves complete content parity.
- [ ] Simulated WebGL failure ends in the static fallback without hiding
      content, navigation, evidence, or conversion actions.
- [ ] Two complete forward/reverse chapter passes retain one live canvas and do
      not change the URL.
- [ ] The explicit motion control swaps immediately between the cinematic and
      static compositions, persists the user reduction, and never overrides a
      system constraint when restored.
- [ ] Evaluate is reachable before the first cinematic chapter.
- [ ] Keyboard-only navigation reaches Evaluate and the contextual diagnostic
      without entering or becoming trapped in the canvas.
- [ ] A screen-reader smoke test announces the chapter structure, motion-control
      status, evidence labels, and diagnostic result messages coherently.

## Content and evidence review

- [ ] Spanish and English provide equivalent chapters, evidence, actions, and
      static fallbacks.
- [ ] OmniSync is labeled as internal work with partial disclosure and shows
      exactly three evidence-backed proof points.
- [ ] Hamburguesa Nómada is labeled as real/public work and shows exactly three
      evidence-backed proof points.
- [ ] Capability IDs in the semantic HTML match the six spatial orbit IDs.
- [ ] Quality-scan statements link to public methodology or repository evidence
      and do not publish unproduced scores or certifications.
- [ ] Contextual diagnostic links preserve their project, capability, concept,
      or service context without personal data in the URL.

## Identity and language review

- [ ] `IzignaMx` uses canonical spelling everywhere visible.
- [ ] IzignaMx Blue `#3b82f6` remains the principal accent.
- [ ] No orange value is used as an IzignaMx identity accent.
- [ ] The modular `IZ` is described as an interpretive spatial system and does
      not modify or replace the official logo.
- [ ] Scientific imagery remains an explicit visual metaphor; no
      pseudoscientific product claim appears.

## Performance, lifecycle, and deployment review

- [ ] Initial and deferred 3D transfer budgets pass without an unapproved ADR
      exception.
- [ ] Reduced motion prevents WebGL and deferred scene modules from loading.
- [ ] Inactive declarative scenes unmount, owned resources dispose, and repeated
      chapter traversal does not increase the live renderer/context count.
- [ ] The browser console contains no repeatable project-owned WebGL, shader,
      asset, or JavaScript error during the critical flow.
- [ ] The draft pull request uploads a complete GitHub Pages artifact but does
      not deploy over production.
- [ ] After an approved merge, the `main` quality, E2E, accessibility, and Pages
      deployment jobs pass and `https://book.izignamx.com/` receives a final
      direct-navigation and asset smoke test.

## Manual reviewer notes

Record physical-device, browser, assistive-technology, or visual-quality
findings here. Do not mark a manual item complete based only on an automated
simulation.

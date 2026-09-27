# Browser games and canonical IzignaMx brand

## Scope

This continuation extends the approved Atlas in PR #10. It adds Distrito Cero and Nexo as two bilingual case studies, a dedicated games discovery filter, a homepage games selection, contextual play links, and eight selectable nodes in the existing constellation. There are now 32 content destinations and 34 HTML documents including root and 404. Production main and DNS are not modified by this review branch.

## Real screenshots

The four original screenshots were captured from the user-specified public game URLs in fresh Chromium contexts, using normal game interface actions. Desktop: 1440×900. Emulated mobile: 390×844 at DPR 1. Both show a real started game rather than an invented scene. Distrito Cero is captured in free exploration with the default character. Nexo is captured in the first solo expedition sector with Vector. Some native onboarding/HUD overlays remain visible, as part of the actual game interface.

`game-captures.json` records URLs, capture times, viewport dimensions, actual UI actions, page titles, HTML response hashes, original PNG hashes, and AVIF/WebP derivatives. Source revisions are repository HEAD observations, not unverified assertions that a CDN served that exact commit. The live page hashes are recorded separately. Pixel output depends on timing and GPU implementation; this is not a deterministic FPS benchmark or physical-device certification.

Source screenshots are not generated imagery. Compression changes image encoding only, not the scene. No game scripts or embedded iframes are loaded by the book; play actions open the actual published game in a new tab.

## Content and claims

Distrito Cero remains labelled as a playable prototype, v0.20.13, and Nexo as beta 1.2. The cases describe verified interface behavior and public project documentation. Nexo's cooperation is local, not online multiplayer. Public source visibility does not assign a new software license. Neither case publishes unmeasured user counts, revenue, retention or therapeutic claims.

The previous six Atlas records are preserved. Their historical evidence pipeline remains in the legacy source. New active-case tests validate the two games and their screenshot files; the browser suite now exercises all eight cases.

## Canonical branding

The white header mark is copied byte-for-byte from `https://izignamx.com/assets/brand-mark-white.svg`. The SVG favicon, ICO, 16px PNG, 32px PNG and Apple touch icon are likewise copied from the production HTML's declared assets. The legacy Atlas `book-mark.svg` path is retained only as an identical compatibility alias, not as a separate design. No font files are redistributed.

`brand-audit.json` records each source URL, response MIME, byte count and SHA-256. Browser checks validate all six delivered asset hashes and confirm the header no longer recolors the mark. Favicon declarations are inherited by all routes, including the language gateway and 404.

## Responsive refinement

The first eight-item hero selector overflowed at 390px. It now uses two intentional rows of four below 1200px, while preserving the desktop arrangement. Both game case titles, play links, filters and project nodes receive additional viewport and keyboard checks. The added section has no animated background or duplicated section border.

## Delivery

This remains a static GitHub Pages artifact built by the existing quality, e2e and accessibility pipeline. Project and page counts in the artifact validator and release metadata are derived from the active catalog. Review output remains noindex; only the existing main-only production workflow enables indexing.

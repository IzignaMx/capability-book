# Shared portfolio evidence

`atlas/book/projects.json` is the active Book catalog. `public/portfolio-catalog.json` is its deterministic public evidence export for the primary IzignaMx website. It covers the existing eight cases; the main website may publish a curated subset without duplicating the entire Book.

The export has schema version 1 and records the SHA-256 of the exact source file. Its project order matches the Book. It includes localized names, classification and release stage, localized Book URLs, public repository/site links, and the approved screenshot's rights, alternative text, caption, provenance and desktop/mobile AVIF/WebP variants. It adds no generation timestamp or runtime service.

Only links explicitly marked `public: true` become repository/site links. Existing screenshot provenance remains intact, including OmniSync's authorized local-demo boundary. A repository reference in capture provenance does not turn a private repository into a public project link. VALD remains the historical 2025 edition; the two games retain their captured prototype/beta stages.

## Update and verify

After an approved content or media change:

```sh
pnpm sync:portfolio
pnpm check:portfolio
```

Both commands use Node standard-library code. Generation validates every published variant's path, file bytes, SHA-256, format and intrinsic dimensions, plus localized image metadata, rights and source provenance. `--check` rejects missing/stale generated output and does not write files. Focused tests work in temporary copies and verify rejection of edited output, stale source, missing/tampered images, incorrect dimensions, missing alternative text and invalid publication flags.

`pnpm build` runs `check:portfolio` before the existing Atlas build. The established quality/e2e/accessibility artifact handoff and main-only Pages deployment remain unchanged. No credentials, network probes or additional dependency are needed for this check.

The dependency-free image readers support the current static screenshot encodings: VP8/VP8L/VP8X WebP and single-image AVIF with `avif` major brand and one `ispe` property. A future encoder that introduces alpha auxiliaries, grids or another compatible brand requires an intentional reader update and verification; unsupported metadata fails closed.

## Primary-site import

The maintained primary source is `IzignaMx/izignamx` on `new_version_3.0`, not its older source `main`. Its build-time importer should consume a reviewed copy of this contract and the approved image bytes, pin the source SHA-256, and validate that its published slugs are a subset of the contract. It should derive duplicated identity, public links and screenshot metadata from that import.

Preserve separate captions and alternative text. Keep the photographed/captured subject accurate: Developer Tools currently shows the public presentation of one BigCommerce tool, not the entire application catalog or an in-editor session. Generate the main site's responsive derivatives from the imported source pixels and record their relationship to the canonical image hashes. Changing an original WebP alone does not update its content-addressed derivatives or `optimized-assets.json`.

The website needs no browser fetch of the catalog. Case narratives can remain editorial, while claims and evidence boundaries agree. Publication of its validated static distribution stays a separate reviewed change in `IzignaMx/izignamx-public-static`; retain previous hashed assets for cached HTML. This document does not authorize a merge or publication.

## Current screenshots

The three shared cases—NutriChilango, Hamburguesa Nómada and Developer Tools—use fresh public-page captures from November 4, 2026, at 1440×900 and emulated 390×844, DPR 1. Their optimized variants preserve the complete captured scene; no generated imagery, layout reconstruction, hidden source content or compositing was used.

The sanitized report [portfolio-captures-2026-11-04.json](portfolio-captures-2026-11-04.json) records each URL, response status, capture time, viewport, raw HTML/PNG hashes, separately observed public repository HEAD and optimized hashes. Raw screenshots and browser diagnostics stay outside the repository. A repository HEAD is a reference observation, not proof of the commit served by the live host.

The NutriChilango page visibly contains its own marketing numbers; they are not adopted as verified portfolio outcomes. Its source CSP blocked a third-party beacon. The BigCommerce presentation's external stylesheet was blocked by the browser's ORB policy; the normal page content remained readable and was visually reviewed. Neither issue was bypassed or changed. These are browser captures, not physical-device certification.

The original six evidence-record identities and narrative claims remain in place. The three refreshed screenshot records are mirrored in their existing legacy evidence JSON so its offline media checks inspect the same approved files as the live Atlas. The other five Book screenshots and all fallback posters remain unchanged.

# Book Atlas: GitHub Pages delivery

## Where the deployable site lives

This repository uses a GitHub Actions Pages build, not branch-root publishing. `quality.yml` builds `dist/`, uploads it with `actions/upload-pages-artifact@v5`, and deploys that artifact with `actions/deploy-pages@v5`. **Do not copy dist/client from Higgsfield, commit dist to the root, or select a different Pages branch.** The Pages source remains GitHub Actions.

The approved Atlas components now live in `atlas/book`. Astro prerenders the 28 localized routes as directory index.html documents. `dist/index.html` is the language gateway and `dist/404.html` is the missing-page fallback. The gateway uses HTML refresh, not an HTTP 308 response, which cannot be implemented by a static file alone. The existing `public/CNAME` and new `.nojekyll` are copied to `dist/`.

No Cloudflare Worker, TanStack server, Higgsfield authentication, runtime API, credentials or database is required. Static output retains React hydration and an explicitly activated Three.js constellation. Fonts still refer to the original brand font URL and are not redistributed in this change.

## Commands

Use Node 22 and pnpm 10.13.1:

```sh
pnpm install --frozen-lockfile
pnpm validate:evidence
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:a11y
python3 scripts/verify-atlas-manifest.py
```

`pnpm build` defaults to noindex review output. For the production artifact use `ATLAS_INDEXABLE=true pnpm build`. Actions sets this only for a non-PR main run. Comparison and 404 remain noindex regardless. `release.json` records the source revision and indexing mode. `sitemap.xml` lists indexable production routes, with a compatibility `sitemap-index.xml`.

Preview: `pnpm preview:atlas` serves only files at port 4210. Browser checks start independent static servers automatically. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE only when using an already installed browser outside Playwright's default path.

## Action gates

1. quality installs from the frozen lockfile, validates existing evidence, checks the original source, runs unit tests and creates the Atlas artifact.
2. e2e and accessibility download that exact `atlas-dist`. They verify all SHA-256 checksums before and after testing. They do not rebuild a potentially different artifact.
3. deploy needs all three jobs and is restricted to main. A PR does not modify production or DNS.

The main workflow intentionally preserves its original job IDs. The independent evidence workflow also retains its evidence, public-link and capture audits, now using frozen dependency installation.

## Safety and rollback

Original Astro source remains in `src/`. Its build, preview and browser checks are available as `build:legacy`, `preview:legacy` and `test:e2e:legacy`. The migration does not rewrite project history or change the six evidence records. Rollback can revert the integration PR and rerun the original pipeline. No forced push is required.

Static CSP uses generated script hashes rather than a reusable server nonce. Arbitrary inline scripts are not permitted. Inline styles remain allowed for the approved interactive styling. Header-only controls such as frame-ancestors and HSTS must be set at the delivery layer if required; a meta CSP is not a substitute for HTTP response headers.

Production checks after an authorized merge: release.json has the new revision and indexable true, all /es/ and /en/ routes respond, homepage no longer contains noindex, and the 3D/contact controls work without a Higgsfield session. A stale Cloudflare copy may need a targeted cache purge. DNS and Cloudflare settings are not altered by this integration.

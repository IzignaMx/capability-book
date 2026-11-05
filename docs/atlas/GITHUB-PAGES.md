# Book Atlas: GitHub Pages delivery

## Where the deployable site lives

This repository uses a GitHub Actions Pages build, not branch-root publishing. `quality.yml` builds `dist/`, uploads it with `actions/upload-pages-artifact@v5`, and deploys that artifact with `actions/deploy-pages@v5`. **Do not copy dist/client from Higgsfield, commit dist to the root, or select a different Pages branch.** The Pages source remains GitHub Actions.

The approved Atlas components now live in `atlas/book`. Astro prerenders the 32 localized routes as directory index.html documents. `dist/index.html` is the language gateway and `dist/404.html` is the missing-page fallback. The gateway uses HTML refresh, not an HTTP 308 response, which cannot be implemented by a static file alone. The existing `public/CNAME` and new `.nojekyll` are copied to `dist/`.

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

Shared project evidence is exported as `public/portfolio-catalog.json`. After approved catalog or media edits, run `pnpm sync:portfolio`; the build rejects stale exports or invalid screenshot metadata. See [PORTFOLIO-CONSISTENCY.md](PORTFOLIO-CONSISTENCY.md) for the primary-site import workflow and capture boundaries.

## Action gates

1. quality installs from the frozen lockfile, validates existing evidence, checks the original source, runs unit tests and creates the Atlas artifact.
2. e2e and accessibility download that exact `atlas-dist`. They verify all SHA-256 checksums before and after testing. They do not rebuild a potentially different artifact.
3. deploy needs all three jobs and is restricted to main. A PR does not modify production or DNS.
4. The same serialized deploy job checks Cloudflare configuration, publishes Pages, invalidates only `book.izignamx.com`, then verifies the ordinary `/release.json` identifies the deployed commit and remains indexable. The purge cannot run after a failed Pages step or on a PR. Offline CDN regression tests run in quality without credentials or network requests.

The main workflow intentionally preserves its original job IDs. The independent evidence workflow also retains its evidence, public-link and capture audits, now using frozen dependency installation.

The three browser jobs use `ubuntu-24.04`, supported by the frozen Playwright 1.55.0 dependency. `ubuntu-latest` moved to Ubuntu 26.04, where that version cannot install Chromium. The quality and deployment gates remain intact; browser tests and accessibility checks are not skipped.

## Safety and rollback

Original Astro source remains in `src/`. Its build, preview and browser checks are available as `build:legacy`, `preview:legacy` and `test:e2e:legacy`. The migration does not rewrite project history or change the six evidence records. Rollback can revert the integration PR and rerun the original pipeline. No forced push is required.

Static CSP uses generated script hashes rather than a reusable server nonce. Arbitrary inline scripts are not permitted. Inline styles remain allowed for the approved interactive styling. Header-only controls such as frame-ancestors and HSTS must be set at the delivery layer if required; a meta CSP is not a substitute for HTTP response headers.

The prerendered BookPage island is enclosed by Cloudflare's documented [`email_off` HTML comments](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/#prevent-cloudflare-from-obfuscating-email). Keep these comments outside the React island and emit them with `Fragment set:html`, because Astro strips ordinary source comments in production. Email obfuscation otherwise rewrites public email text and mailto links before hydration; a slow decoder can cause React error #418. This preserves the original public contact markup and native mailto behavior without changing zone settings or CSP. The static artifact validator checks this delivery boundary.

## Cloudflare invalidation after Pages

Repository Actions configuration uses `vars.CLOUDFLARE_ZONE_ID` (the zone's 32-character ID) and `secrets.CLOUDFLARE_API_TOKEN` (a token with **Cache Purge** permission for that zone). Values are passed only to configuration and purge steps in the main-only deploy job; they are never written to the artifact or logged. Missing configuration fails before publishing. API authorization is verified by the actual post-deployment request.

`.github/scripts/book_cdn.py` sends `POST /zones/{zone_id}/purge_cache` with exactly `{"hosts":["book.izignamx.com"]}`. This invalidates the Book's cached HTML, assets and aliases, including paths removed by a release. It does not purge `izignamx.com` or other subdomains, change DNS/cache rules, or clear visitors' browser caches. The existing `pages` concurrency group covers publication, invalidation and verification together.

API acceptance and successful publication are separate results: HTTP 200 with `success: true` and no errors is required, then the ordinary HTTPS release URL must match `GITHUB_SHA` and `indexable: true`, with bounded retries and no cache-busting query or request headers. An API rejection or persistently stale release fails the deploy job; it is not silently skipped. After fixing configuration or a transient service failure, re-run that deploy job to repeat Pages, invalidation and verification for the same commit. The existing main-only `workflow_dispatch` also follows this sequence.

References: [Cloudflare purge by hostname](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-hostname/) and [Cache Purge API](https://developers.cloudflare.com/api/resources/cache/methods/purge/).

Production checks after an authorized merge: release.json has the new revision and indexable true, all /es/ and /en/ routes respond, homepage no longer contains noindex, and the 3D/contact controls work without a Higgsfield session. Cache invalidation and release identity are now automated after publication; the broader visual checks remain separate. DNS and Cloudflare settings are not altered by this integration.

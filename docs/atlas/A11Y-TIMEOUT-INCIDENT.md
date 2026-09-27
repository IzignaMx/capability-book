# Accessibility audit timeout after the Atlas merge

Date: 2026-09-27
Affected main commit: f7ebaa5a4c9bf8ed77ebc8f2ea27d1094a43d1ff
Failed workflow: https://github.com/IzignaMx/capability-book/actions/runs/36307595210
Failed job: accessibility / 108587349160

## Observed failure

The build, 107 artifact hashes and functional browser suite passed. Pa11y audited four routes without accessibility errors, then navigation to the next route, /es/proyectos/omnisync/, exceeded 45000 ms. Deployment was correctly skipped because accessibility is a required gate.

The pinned Pa11y 9.1.1 implementation navigates with Puppeteer's networkidle2. That is a transport-idle condition rather than proof that the HTML, styles, font and interactive island are ready for inspection. The old script did not log outstanding requests, so the original trace cannot identify one particular stalled asset or attribute the incident definitively to the font CDN. A fresh local run of the same production build and pinned Chromium completed all sixteen routes, confirming the failure was not consistently reproducible in application markup.

A second defect was deterministic: the report was written only after all routes completed. When the process threw, the always-upload artifact step could publish the report already tracked in the checkout rather than this run's partial results.

## Correction

- Navigate to DOMContentLoaded with an explicit deadline. Then require the heading, loaded stylesheets, completed Astro hydration, ready font and critical images before running Pa11y on that same page through its documented browser/page/ignoreUrl API.
- Keep WCAG2AA rules and zero allowed errors. Missing critical resources and application exceptions fail the audit. No elements are hidden and no browser security policy is disabled.
- Each attempt uses a new isolated browser context. Only navigation TimeoutError receives one bounded retry. Both attempts remain in the report, including failure diagnostics. Real accessibility findings are never retried or discarded.
- Replace stale reports before browser startup, checkpoint every page atomically, record technical failures, and always write a final passed/failed and complete/incomplete state. Startup and cleanup errors cannot produce success.
- Keep all sixteen page checks, original evidence jobs, exact-artifact checksums and main-only deploy prerequisites. No runtime source, screenshots, branding, dependencies, CNAME or DNS is changed.

## Regression evidence

Seven unit tests failed before implementation and pass after it. They cover stale-report replacement, real findings, bounded retry, persistent timeout, HTTP failure, startup failure and cleanup failure.

A real-browser fixture adds three pending background requests over the unchanged compiled case. The old network-idle navigation times out despite hydrated content. The replacement completes the actual audit. Separate negative fixtures demonstrate that a missing image alternative is still reported by Pa11y and a failed stylesheet prevents an audit from passing. These synthetic fixtures do not ship in dist.

Local verification: 194 unit/application tests, sixteen audit routes with zero detected errors, four real-browser fault-injection checks, type/brand checks and 107 artifact checksums. Chromium 140 / Playwright build 1187 matches the browser used by the failed Actions job. No physical-device or comprehensive accessibility certification is claimed.

Run the targeted regression with:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
ATLAS_INDEXABLE=true pnpm build
node scripts/verify-atlas-a11y-readiness.cjs
pnpm test:a11y:atlas
python3 scripts/verify-atlas-manifest.py
```

Actions runs the fault-injection check before the unchanged sixteen-page audit and uploads both current reports. Final remote run and deployment evidence are recorded in the corrective PR.

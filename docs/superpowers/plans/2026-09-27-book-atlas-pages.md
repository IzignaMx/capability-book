# Book Atlas GitHub Pages integration

Goal: bring the approved Higgsfield Book Atlas into the existing capability-book Pages pipeline as a fully prerendered static website.
Source: Higgsfield ca3fc9dabbe39df7ce9c74d14320fdb6151b6b16 (code refinements from da75fb9).
Base: GitHub main 171d5cd0ed60a13fcb9b8de634fa08123e031bc1.

Architecture: reuse the repository's pinned Astro/React/Three toolchain. Copy the self-contained Atlas React components under atlas/book, render all 28 allowlisted destinations with Astro and hydrate the existing interactions. No TanStack server, platform SDK or server execution ships. Keep the original src and tests for rollback, and add a separate Astro config targeting the existing dist artifact path.

Tasks:
1. Validate the Actions runs, workflow graph, CNAME and dependency lock. Add failing integration contract tests.
2. Import approved components and evidence references, generate directory HTML, language gateway and 404. Set canonical URLs, sitemap and static hash CSP. Keep PR artifacts noindex and production indexing explicitly conditional on main.
3. Test actual static HTTP delivery, original 3D and contact flows, mobile/keyboard/no-JS routes and image integrity. Compare rendered Atlas before and after migration.
4. Adapt quality, e2e, accessibility jobs so they inspect the same dist artifact. Deployment stays restricted to main after all gates. Retain evidence audits.
5. Commit complete source in a review branch, open a PR and inspect Actions. No forced updates, main merge, DNS edits or production replacement without explicit authorization.

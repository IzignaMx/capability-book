# Evidence workflow

A project is publishable only when its JSON record validates, its public links pass, its ownership and confidentiality boundary are reviewed, every proof point cites at least one source, and a licensed fallback poster is listed.

Raw captures are review artifacts. They do not become public media until approved, cropped, optimized, supplied with meaningful alternative text, and copied into `public/media/<project>/`.

Numeric claims are prohibited unless their `kind` and source support the wording used in the public case study. The accepted categories are:

- `verified-result`: observed outcome backed by analytics or explicit client confirmation.
- `system-metric`: technical measurement produced by a reproducible test or report.
- `expected-outcome`: forecast or target, clearly presented as non-observed.
- `demonstrated-capability`: functionality visible in code, documentation, tests, or the public product.

## Publication review

1. Confirm ownership and the allowed public boundary.
2. Confirm every source URL and whether it may be exposed publicly.
3. Validate each proof point against its referenced source IDs.
4. Capture mobile and desktop evidence with the reproducible capture script.
5. Review confidentiality, people shown, third-party marks, and media licensing.
6. Approve the fallback poster and alternative text before publishing.
7. Run `pnpm validate:evidence`, `pnpm check:links`, and `pnpm evidence:summary`.

# ADR-0003: Diagnostic form backend activation gate

- **Status:** Proposed
- **Date:** 2026-07-21
- **Scope:** IzignaMx Capability Book

## Context

The capability book is deployed as a fully static GitHub Pages site at
`https://book.izignamx.com/`. GitHub Pages can provision HTTPS for that custom
domain, but it does not execute a request-time handler for diagnostic form
submissions. Delivery therefore requires a separately operated HTTPS endpoint.

The diagnostic includes names, contact details, organizations, and free-form
project information. Current official documentation does not establish a
sufficiently complete combination of CORS behavior, fixed retention, deletion,
data location, and raw JSON support to select Formspree, Web3Forms, or Basin
without further contractual review. A separately hosted function offers more
control but adds operational and security responsibility.

Relevant platform and vendor documentation:

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Formspree AJAX forms](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax)
- [Basin plan comparison](https://docs.usebasin.com/plan-comparison/)
- [Web3Forms privacy policy](https://web3forms.com/privacy)
- [Cloudflare Workers CORS example](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)

## Decision

The browser will use a provider-neutral JSON transport that accepts only an
absolute `https:` endpoint, treats every non-2xx response as failure, performs
one request per explicit submit, and does not log or return submission data.
The endpoint URL is public routing configuration and must never be treated as
authentication.

Direct submission remains disabled by default. The mail fallback remains
available and the interface must state truthfully that no information has left
the browser when no endpoint is configured.

ADR-0003 cannot move to **Accepted** and the production endpoint cannot be
configured until all of the following are recorded and verified:

1. CORS permits `https://book.izignamx.com` and does not rely on CORS as spam
   prevention or authentication.
2. Server-side validation rejects unknown, malformed, oversized, or
   non-consensual submissions.
3. Rate limiting and spam controls are active, with secrets kept outside the
   repository and browser bundle.
4. Normal, spam, backup, and deleted-record retention are documented, along
   with an operational deletion procedure.
5. Processing locations, subprocessors, international transfers, and the DPA
   are reviewed for leads collected in Mexico.
6. Availability and failure behavior are documented; the browser does not
   retry automatically.
7. The privacy notice names the processor and purposes before activation.
8. The fallback channel is tested independently of the form processor.

## Consequences

- GitHub Pages remains fully static and contains no server credentials.
- Task 10 can establish and test the delivery boundary without inventing a
  provider commitment or falsely enabling submission.
- Production form delivery remains intentionally unavailable until this ADR is
  accepted and a reviewed public HTTPS endpoint is supplied at build time.
- Choosing a hosted form service reduces operations but requires contractual
  privacy evidence; choosing an owned function increases control and ongoing
  security responsibility.

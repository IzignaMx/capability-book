# ADR-0002: Analytics privacy and retention

- **Status:** Accepted
- **Date:** 2026-07-20
- **Scope:** IzignaMx Capability Book

## Context

The capability book needs enough behavioral evidence to improve navigation, understand which capabilities and projects attract qualified attention, and measure diagnostic completion. It must not turn contact forms or exploratory behavior into a source of unnecessary personal-data collection.

## Decision

Analytics events are provider-agnostic and contain only the event name plus approved contextual dimensions. Event payloads must never include names, email addresses, phone numbers, organizations, free-form messages, form values, full URLs containing query-string identifiers, or persistent cross-site identifiers.

Raw event-level data may be retained for no more than **30 days**. Aggregated reports may be retained for no more than **395 days**. A future provider integration must be configured at or below these limits and must support deletion or expiration.

The approved dimensions are `locale`, `sourceRoute`, `sourceProject`, `sourceCapability`, and `sourceConcept`. New dimensions require an ADR update and privacy review.

## Consequences

- Funnel and content analysis remains possible without collecting contact content.
- Attribution is intentionally limited to first-party route and content context.
- Provider selection in Phase 1 must demonstrate retention controls and data-minimization compatibility.

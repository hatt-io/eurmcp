---
title: EULAW-005 Pinpoint Anchors and Quote Verification
spec_id: EULAW-005
type: improvement-spec
priority: P0
area: exact-retrieval
status: proposed
milestone: 1
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-005 — Pinpoint Anchors and Quote Verification

## Requirement

Every pinpoint excerpt MUST carry a stable source anchor and support deterministic verification against the captured authoritative bytes.

## Acceptance criteria

- [ ] Add source_anchor with source element ID, XPath or equivalent structural locator, plus ordinal only when the source has no stable identifier.
- [ ] Add verify_legal_quote accepting an evidence_id, location, and exact quote.
- [ ] Verification returns exact_match, normalized_match, or no_match; it never repairs the quote.
- [ ] Expose authoritative deep links when the publisher provides stable fragments.
- [ ] Preserve source Unicode and punctuation in exact mode.

## Verification

- [ ] GDPR Article 22 and recital 71 verify exactly in English and Swedish.
- [ ] C-300/21 paragraph 50 verifies exactly in English and Swedish.
- [ ] A changed word returns no_match.
- [ ] An anchor resolving to two nodes returns UPSTREAM_FORMAT_CHANGED.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

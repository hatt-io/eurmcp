---
title: EULAW-005 Pinpoint Anchors and Quote Verification
spec_id: EULAW-005
type: improvement-spec
priority: P0
area: exact-retrieval
status: verified
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

- [x] Add source_anchor with source element ID, XPath or equivalent structural locator, plus ordinal only when the source has no stable identifier.
- [x] Add verify_legal_quote accepting an evidence_id, location, and exact quote.
- [x] Verification returns exact_match, normalized_match, or no_match; it never repairs the quote.
- [x] Expose authoritative deep links when the publisher provides stable fragments.
- [x] Preserve source Unicode and punctuation in exact mode.

## Verification

- [x] GDPR Article 22 and recital 71 verify exactly in English and Swedish.
- [x] C-300/21 paragraph 50 verifies exactly in English and Swedish.
- [x] A changed word returns no_match.
- [x] An anchor resolving to two nodes returns UPSTREAM_FORMAT_CHANGED.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Verified in eu-law-mcp 0.2.0 after all release gates passed.

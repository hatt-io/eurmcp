---
title: EULAW-008 EuroVoc and Advanced Search
spec_id: EULAW-008
type: improvement-spec
priority: P1
area: search
status: proposed
milestone: 2
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-008 — EuroVoc and Advanced Search

## Requirement

Authoritative search MUST support EuroVoc concepts and the principal CELLAR metadata filters with stable, explainable pagination.

## Acceptance criteria

- [ ] Add search_eurovoc_concepts and EuroVoc URI filters to legislation and case search.
- [ ] Support author institution, legal basis, directory code, subject term, procedure, Official Journal reference, and documented in-force metadata.
- [ ] Add opaque cursors and a stable deterministic sort with identifier tie-breakers.
- [ ] Return match_evidence and scoring components; never present ranking as legal relevance.
- [ ] Keep caller-supplied SPARQL prohibited.

## Verification

- [ ] GDPR appears for a data-protection concept query.
- [ ] AI Act appears for artificial-intelligence concept queries across at least English and Swedish labels.
- [ ] Two pages contain no duplicates and remain stable during a fixture run.
- [ ] Unsupported filters return INVALID_ARGUMENT.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

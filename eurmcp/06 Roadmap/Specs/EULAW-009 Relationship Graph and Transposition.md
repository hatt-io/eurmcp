---
title: EULAW-009 Relationship Graph and Transposition
spec_id: EULAW-009
type: improvement-spec
priority: P1
area: relationships
status: proposed
milestone: 2
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-009 — Relationship Graph and Transposition

## Requirement

The server MUST expose authoritative document relationships as a typed, directed, paginated graph.

## Acceptance criteria

- [ ] Add get_document_relationships with amends, amended_by, corrects, corrected_by, implements, implemented_by, repeals, repealed_by, consolidates, legal_basis, cites, cited_by, related_case, and national_transposition_measure.
- [ ] Return the exact CDM predicate or official relationship field behind every edge.
- [ ] Add list_national_transposition_measures for directives with country and measure identifiers.
- [ ] Separate absence of metadata from a claim that no relationship exists.
- [ ] Deduplicate edges only when canonical target identifier and source predicate match.

## Verification

- [ ] Known amendment and consolidation chains match live CELLAR metadata.
- [ ] A directive returns official NIM records where present.
- [ ] Synthetic opposite-direction edges remain distinct.
- [ ] Pagination traverses all fixture edges without duplication.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

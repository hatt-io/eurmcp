---
title: EULAW-007 Evidence Semantics
spec_id: EULAW-007
type: improvement-spec
priority: P0
area: legal-evidence
status: proposed
milestone: 1
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-007 — Evidence Semantics

## Requirement

The API MUST distinguish metadata relationships, textual mentions, formal citations, and legal-treatment claims.

## Acceptance criteria

- [ ] Define evidence_type values metadata_relation, textual_mention, formal_citation, operative_reference, and authoritative_classification.
- [ ] Do not expose interprets, applies, follows, distinguishes, or overrules unless an authoritative field or explicit, deterministic source rule supports it.
- [ ] Return exact paragraph evidence for text-derived citations.
- [ ] Name the extraction methodology and confidence class without probabilistic legal conclusions.
- [ ] Rename ambiguous search fields so provision keyword matches say mentions.

## Verification

- [ ] An Article 82 keyword match is textual_mention, never interpretation.
- [ ] Document-level CELLAR citation metadata is metadata_relation.
- [ ] A case-name co-occurrence without a citation pattern is excluded.
- [ ] Every relationship includes direction and provenance.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

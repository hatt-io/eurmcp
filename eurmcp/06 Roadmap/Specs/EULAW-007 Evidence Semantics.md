---
title: EULAW-007 Evidence Semantics
spec_id: EULAW-007
type: improvement-spec
priority: P0
area: legal-evidence
status: verified
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

- [x] Define evidence_type values metadata_relation, textual_mention, formal_citation, operative_reference, and authoritative_classification.
- [x] Do not expose interprets, applies, follows, distinguishes, or overrules unless an authoritative field or explicit, deterministic source rule supports it.
- [x] Return exact paragraph evidence for text-derived citations.
- [x] Name the extraction methodology and confidence class without probabilistic legal conclusions.
- [x] Rename ambiguous search fields so provision keyword matches say mentions.

## Verification

- [x] An Article 82 keyword match is textual_mention, never interpretation.
- [x] Document-level CELLAR citation metadata is metadata_relation.
- [x] A case-name co-occurrence without a citation pattern is excluded.
- [x] Every relationship includes direction and provenance.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Verified in eu-law-mcp 0.2.0 after all release gates passed.

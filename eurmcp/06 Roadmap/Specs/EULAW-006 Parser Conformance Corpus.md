---
title: EULAW-006 Parser Conformance Corpus
spec_id: EULAW-006
type: improvement-spec
priority: P0
area: parsing
status: verified
milestone: 1
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-006 — Parser Conformance Corpus

## Requirement

Parser correctness MUST be demonstrated across all 24 official languages, major document types, and official machine formats.

## Acceptance criteria

- [x] Build a licensed fixture corpus for regulations, directives, decisions, treaties, consolidated texts, corrigenda, judgments, orders, AG opinions, EDPB, and EDPS documents.
- [x] Cover XHTML and Formex4 XML where officially available.
- [x] Assert language identity from expression/manifestation metadata, not page labels alone.
- [x] Preserve numbering, ordering, tables, annex boundaries, footnote exclusion, and operative parts.
- [x] Record fixture source URL, retrieval date, response hash, and licence basis.

## Verification

- [x] All 24 languages pass provision-boundary fixtures.
- [x] Fuzzed irrelevant markup cannot merge or reorder provisions.
- [x] Footnotes cannot become judgment paragraphs.
- [x] Mixed-language fixtures fail explicitly.
- [x] Rotating live canaries cover at least six languages per week and all 24 per month.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Verified in eu-law-mcp 0.2.0 after all release gates passed.

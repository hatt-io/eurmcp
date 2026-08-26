---
title: EULAW-006 Parser Conformance Corpus
spec_id: EULAW-006
type: improvement-spec
priority: P0
area: parsing
status: proposed
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

- [ ] Build a licensed fixture corpus for regulations, directives, decisions, treaties, consolidated texts, corrigenda, judgments, orders, AG opinions, EDPB, and EDPS documents.
- [ ] Cover XHTML and Formex4 XML where officially available.
- [ ] Assert language identity from expression/manifestation metadata, not page labels alone.
- [ ] Preserve numbering, ordering, tables, annex boundaries, footnote exclusion, and operative parts.
- [ ] Record fixture source URL, retrieval date, response hash, and licence basis.

## Verification

- [ ] All 24 languages pass provision-boundary fixtures.
- [ ] Fuzzed irrelevant markup cannot merge or reorder provisions.
- [ ] Footnotes cannot become judgment paragraphs.
- [ ] Mixed-language fixtures fail explicitly.
- [ ] Rotating live canaries cover at least six languages per week and all 24 per month.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

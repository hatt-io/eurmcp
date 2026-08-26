---
title: EULAW-004 Temporal Law Model
spec_id: EULAW-004
type: improvement-spec
priority: P0
area: versions
status: proposed
milestone: 1
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-004 — Temporal Law Model

## Requirement

The server MUST model original acts, corrigenda, amending acts, and consolidated texts as distinct official resources with explicit temporal relationships.

## Acceptance criteria

- [ ] Add list_document_versions and get_document_timeline tools.
- [ ] Add get_provision_at_date using only an official version or official consolidation that covers the requested date.
- [ ] Return consolidation_date, publication date, validity metadata, and source CELEX for each version.
- [ ] Never describe a consolidation as an amending act or infer legal effect from text diffs.
- [ ] Return VERSION_NOT_FOUND when no official version supports the requested date.

## Verification

- [ ] GDPR original and latest consolidation remain distinct.
- [ ] Two consolidation dates resolve deterministically.
- [ ] A date without a supported official version returns VERSION_NOT_FOUND.
- [ ] Corrigenda and amending relationships preserve their source predicates.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

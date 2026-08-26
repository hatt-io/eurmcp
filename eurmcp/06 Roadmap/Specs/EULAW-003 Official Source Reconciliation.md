---
title: EULAW-003 Official Source Reconciliation
spec_id: EULAW-003
type: improvement-spec
priority: P0
area: provenance
status: proposed
milestone: 1
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-003 — Official Source Reconciliation

## Requirement

Core identifiers and dates MUST be reconciled across at least two official systems when both are available, without silently selecting a winner.

## Acceptance criteria

- [ ] Create adapters for CELLAR metadata plus official EUR-Lex SOAP or CURIA metadata where stable.
- [ ] Compare CELEX, ECLI, case number, document date, document type, and language at field level.
- [ ] Return source_values and discrepancies with both provenance records.
- [ ] Use deterministic precedence only for canonical routing, never to erase conflicting source data.
- [ ] Cache reconciliation independently from legal text.

## Verification

- [ ] C-300/21 agrees across two official paths for CELEX, ECLI, case number, date, and language.
- [ ] A synthetic disagreement fixture returns both values and a discrepancy.
- [ ] An unavailable secondary source leaves verified_primary_only status rather than failing exact retrieval.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

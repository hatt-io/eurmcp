---
title: EULAW-018 Batch and Citation Export
spec_id: EULAW-018
type: improvement-spec
priority: P2
area: workflow
status: proposed
milestone: 4
effort: M
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-018 — Batch and Citation Export

## Requirement

The server SHOULD reduce safe research round trips through bounded exact batch retrieval and deterministic citation formatting.

## Acceptance criteria

- [ ] Add batch_get_legal_material for at most 20 exact articles, recitals, or case paragraphs with bounded concurrency.
- [ ] Preserve one result or typed error per request item without partial identity substitution.
- [ ] Add format_eu_citation for CELEX, ELI, ECLI, Official Journal, and documented EU/OSCOLA forms.
- [ ] Make formatting template-based and deterministic; do not create legal conclusions.
- [ ] Return provenance with each batch item, not only at the batch envelope.

## Verification

- [ ] Mixed valid and invalid batch items preserve order and individual errors.
- [ ] Duplicate requests are deduplicated internally but returned in caller order.
- [ ] Citation formatting round-trips canonical identifiers.
- [ ] Batch limits and payload-size limits fail with INVALID_ARGUMENT.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

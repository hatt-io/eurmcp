---
title: EULAW-011 Case Citation Evidence
spec_id: EULAW-011
type: improvement-spec
priority: P1
area: case-law
status: proposed
milestone: 2
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-011 — Case Citation Evidence

## Requirement

Case citation and provision-reference discovery MUST return paragraph-level proof when derived from judgment text.

## Acceptance criteria

- [ ] Index only official judgment text with canonical CELEX/ECLI identities.
- [ ] Add find_cases_mentioning_provision and preserve find_cases_citing for formal case citations.
- [ ] Return cited identifier, citing case, exact paragraph number, excerpt, method, and evidence envelope.
- [ ] Recognize formal ECLI, CELEX, and case-number citation forms without semantic treatment classification.
- [ ] Support judgments, orders, and AG opinions as distinct document types.

## Verification

- [ ] C-300/21 citations resolve through all canonical identifier forms.
- [ ] A keyword mention without a formal target identifier is not proof of case citation.
- [ ] Paragraph evidence maps back to the source anchor.
- [ ] AG opinion text cannot be returned as judgment text.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

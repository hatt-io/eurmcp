---
title: EULAW-012 Regulator Source Hardening
spec_id: EULAW-012
type: improvement-spec
priority: P1
area: regulators
status: proposed
milestone: 2
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-012 — Regulator Source Hardening

## Requirement

EDPB and EDPS adapters MUST provide reliable catalogs, versions, languages, and numbered PDF structure from official infrastructure.

## Acceptance criteria

- [ ] Prefer official feeds, sitemaps, structured metadata, or document repositories over page search HTML.
- [ ] Model adopted, consultation, superseded, corrected, and versioned documents explicitly.
- [ ] Preserve official numbered paragraphs and section boundaries from PDF layout when reliably detectable.
- [ ] Return UPSTREAM_FORMAT_CHANGED rather than partial text when required page structure changes.
- [ ] Expose source capability status when an official site blocks automated retrieval.

## Verification

- [ ] Known EDPB guidelines resolve page, PDF, status, version, and language.
- [ ] Consultation and final documents never collapse into one identity.
- [ ] EDPS search returns official links and provenance.
- [ ] A changed HTML fixture fails explicitly.
- [ ] English and Swedish availability are labeled from official evidence.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

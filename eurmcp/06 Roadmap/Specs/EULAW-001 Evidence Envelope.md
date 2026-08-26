---
title: EULAW-001 Evidence Envelope
spec_id: EULAW-001
type: improvement-spec
priority: P0
area: provenance
status: verified
milestone: 1
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-001 — Evidence Envelope

## Requirement

Every substantive result MUST include an evidence object that binds normalized output to the exact authoritative response used to create it.

## Acceptance criteria

- [x] Add evidence_id, retrieved_at, source_url, publisher, source_system, source_identifier, language, media_type, response_sha256, normalized_text_sha256, parser_name, and parser_version.
- [x] Record ETag, Last-Modified, HTTP status, CELLAR work/expression/manifestation/item URIs, and source content length when supplied.
- [x] Expose an extraction anchor for every article, recital, case paragraph, and numbered regulator paragraph.
- [x] Hash raw bytes before parsing and normalized text after parsing; document canonicalization.
- [x] Never return authentication data, cache paths, or response bodies inside provenance.

## Verification

- [x] Fixture hashes are stable across runs.
- [x] A one-byte fixture mutation changes response_sha256.
- [x] Whitespace-only normalized markup changes do not change normalized_text_sha256.
- [x] Every substantive tool result satisfies the evidence schema.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Verified in eu-law-mcp 0.2.0 after all release gates passed.

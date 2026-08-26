---
title: EULAW-010 Context-Efficient Retrieval
spec_id: EULAW-010
type: improvement-spec
priority: P1
area: mcp-ux
status: proposed
milestone: 2
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-010 — Context-Efficient Retrieval

## Requirement

Clients MUST be able to inspect and navigate large documents without retrieving full text or losing structural integrity.

## Acceptance criteria

- [ ] Add get_eu_document_metadata, get_eu_case_metadata, get_document_outline, list_available_languages, and list_document_versions.
- [ ] Expose MCP resource templates for immutable legal texts and case documents.
- [ ] Use structural cursors or complete bounded units; never cut through a requested provision or numbered paragraph.
- [ ] Return explicit has_more and next_cursor for lists and whole-document windows.
- [ ] Offer metadata_only and selected-locations modes while keeping exact tools unchanged.

## Verification

- [ ] AI Act outline lists official articles and annexes without body text.
- [ ] A paged whole-document read reconstructs normalized text exactly.
- [ ] A cursor cannot switch language, version, or identifier.
- [ ] Resource and tool retrieval return matching evidence hashes.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

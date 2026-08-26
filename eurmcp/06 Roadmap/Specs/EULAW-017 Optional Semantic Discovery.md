---
title: EULAW-017 Optional Semantic Discovery
spec_id: EULAW-017
type: improvement-spec
priority: P2
area: search
status: proposed
milestone: 4
effort: XL
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-017 — Optional Semantic Discovery

## Requirement

Semantic retrieval MAY improve discovery, but MUST remain optional and isolated from exact legal-source retrieval.

## Acceptance criteria

- [ ] Index only authoritative metadata and text snapshots already covered by evidence envelopes.
- [ ] Mark match_method as semantic, lexical, metadata, or combined.
- [ ] Return canonical identifiers and exact-source handoff; never return generated legal text.
- [ ] Keep lexical and identifier search available without embeddings, accounts, databases, or cloud services.
- [ ] Version the embedding model and index snapshot in provenance.

## Verification

- [ ] Disabling semantic search leaves all exact tools functional.
- [ ] A semantic hit can be retrieved by canonical ID and verified independently.
- [ ] Changing the embedding model cannot change exact retrieval output.
- [ ] Search output never labels semantic similarity as a citation or interpretation.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

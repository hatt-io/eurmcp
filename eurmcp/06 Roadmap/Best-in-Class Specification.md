---
title: Best-in-Class Specification
type: specification
status: proposed
reviewed: 2026-08-26
tags:
  - eurmcp
  - roadmap
  - specification
aliases:
  - Improvement specification
---

# Best-in-Class Specification

## Product objective

Make eu-law-mcp the most trustworthy open-source MCP for EU legal-source research.

"Best" means the highest verifiable accuracy for exact EU legal material, followed by complete temporal metadata, evidence-aware research, useful discovery, and production-grade delivery.

## Non-negotiable rules

- Official sources only for legal assertions and source text.
- No semantic model may create, repair, translate, number, or complete legal text.
- No silent language fallback.
- No raw caller-supplied URL, SPARQL, filesystem, or proxy surface.
- No relationship or legal-treatment label without explicit evidence and provenance.
- No truncation that can be mistaken for a complete requested provision or paragraph.
- Missing material remains a typed error.
- Existing tool contracts stay backward-compatible within a major version.

## Definition of best-in-class

A release qualifies only when:

- every returned passage has a field-level authoritative evidence trail;
- every exact quote can be machine-verified from a source snapshot;
- all 24 official EU languages pass strict availability and language-identity tests;
- legislation can be retrieved at an explicit official version or official consolidation date;
- search ranking is stable, paginated, evidence-explained, and benchmarked;
- cases can be linked to cited provisions and judgments at exact source paragraphs when the document text proves the reference;
- CELLAR metadata can be reconciled with a second official system without hiding conflicts;
- large documents can be navigated without flooding context;
- local stdio and secured Streamable HTTP pass the same MCP conformance suite;
- npm and MCP Registry artifacts are reproducible, signed, and subject to the three-day dependency cooldown.

## Prioritized specifications

| ID | Priority | Requirement | Result |
|---|---|---|---|
| [[06 Roadmap/Specs/EULAW-001 Evidence Envelope]] | P0 | Evidence envelope and source fingerprints | Every excerpt is independently verifiable. |
| [[06 Roadmap/Specs/EULAW-002 Versioned Output Schemas]] | P0 | Strict versioned output schemas | Clients get stable machine contracts. |
| [[06 Roadmap/Specs/EULAW-003 Official Source Reconciliation]] | P0 | Field-level official-source reconciliation | Source conflicts are visible, never hidden. |
| [[06 Roadmap/Specs/EULAW-004 Temporal Law Model]] | P0 | Complete official version timeline | Point-in-time retrieval becomes deterministic. |
| [[06 Roadmap/Specs/EULAW-005 Pinpoint Anchors and Quote Verification]] | P0 | Source anchors and quote verification | A quote can be checked without trusting the MCP. |
| [[06 Roadmap/Specs/EULAW-006 Parser Conformance Corpus]] | P0 | 24-language parser conformance corpus | Structure extraction survives language and format variation. |
| [[06 Roadmap/Specs/EULAW-007 Evidence Semantics]] | P0 | Formal evidence taxonomy | "Mentions" never becomes "interprets." |
| [[06 Roadmap/Specs/EULAW-008 EuroVoc and Advanced Search]] | P1 | EuroVoc and advanced authoritative search | Discovery matches the strongest EU competitors. |
| [[06 Roadmap/Specs/EULAW-009 Relationship Graph and Transposition]] | P1 | Complete relationship graph and NIM | Amendment and implementation research becomes navigable. |
| [[06 Roadmap/Specs/EULAW-010 Context-Efficient Retrieval]] | P1 | Metadata, outlines, cursors, and resources | Large acts stop flooding model context. |
| [[06 Roadmap/Specs/EULAW-011 Case Citation Evidence]] | P1 | Paragraph-level case citation evidence | Citation searches return exact proof. |
| [[06 Roadmap/Specs/EULAW-012 Regulator Source Hardening]] | P1 | EDPB and EDPS reliability | Current differentiator becomes production-grade. |
| [[06 Roadmap/Specs/EULAW-013 HTTP and Distribution]] | P1 | Secured HTTP, npm, and MCP Registry | Installation and remote use become first-class. |
| [[06 Roadmap/Specs/EULAW-014 Resilience and Source Health]] | P1 | Circuit breakers, revalidation, and health | Upstream failures are explicit and contained. |
| [[06 Roadmap/Specs/EULAW-015 Public Quality Benchmarks]] | P1 | Public accuracy and search benchmark | Quality claims become reproducible. |
| [[06 Roadmap/Specs/EULAW-016 Supply-Chain Assurance]] | P1 | Reproducible and signed releases | Users can trust what they install. |
| [[06 Roadmap/Specs/EULAW-017 Optional Semantic Discovery]] | P2 | Optional semantic discovery layer | Recall improves without contaminating exact retrieval. |
| [[06 Roadmap/Specs/EULAW-018 Batch and Citation Export]] | P2 | Bounded batch retrieval and citation export | Research workflows require fewer round trips. |

## Release sequence

### Milestone 1 — Verifiability

Implement EULAW-001 through EULAW-007. Do not add semantic search or broad sources before these pass.

### Milestone 2 — Research depth

Implement EULAW-008 through EULAW-012. Preserve strict evidence labels and official-source boundaries.

### Milestone 3 — Production distribution

Implement EULAW-013 through EULAW-016. Publish only after protocol, security, and live-source gates pass.

### Milestone 4 — Optional workflow acceleration

Implement EULAW-017 and EULAW-018 behind explicit capability flags.

## Global acceptance gates

- Existing 12 MCP tools retain passing fixture, live, smoke, and Inspector tests.
- Every new tool is called once validly and once with a representative invalid request through a real MCP client.
- Every new network path uses the shared allowlisted HTTP client.
- Every source parser has a fixture captured from its authoritative origin.
- All output schemas reject extra or mistyped legal identity fields.
- English and Swedish remain mandatory live tests; all 24 languages receive fixture coverage and rotating live canaries.
- No test labels keyword co-occurrence as interpretation.
- No release uses a dependency version published less than three days earlier.
- README, vault, MCP tool descriptions, schemas, and code are checked for drift.

Use [[06 Roadmap/Improvement Specs.base|Improvement Specs]] to track the requirements.

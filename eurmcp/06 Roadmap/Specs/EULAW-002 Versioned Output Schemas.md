---
title: EULAW-002 Versioned Output Schemas
spec_id: EULAW-002
type: improvement-spec
priority: P0
area: api-contracts
status: verified
milestone: 1
effort: M
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-002 — Versioned Output Schemas

## Requirement

Every tool MUST publish a precise MCP outputSchema and return structuredContent conforming to a versioned legal data contract.

## Acceptance criteria

- [x] Replace permissive record schemas with named strict Zod schemas and generated JSON Schema.
- [x] Add api_version to successful results and structured errors.
- [x] Reject unknown legal identity fields at adapter boundaries.
- [x] Document additive versus breaking changes and support one prior minor contract during migration.
- [x] Snapshot all input and output schemas and fail CI on undocumented drift.

## Verification

- [x] MCP Inspector validates every output schema.
- [x] Property-based invalid payloads are rejected.
- [x] Tool text and structuredContent represent the same object.
- [x] Schema snapshots match the documented contract version.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Verified in eu-law-mcp 0.2.0 after all release gates passed.

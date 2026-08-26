---
title: EULAW-002 Versioned Output Schemas
spec_id: EULAW-002
type: improvement-spec
priority: P0
area: api-contracts
status: proposed
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

- [ ] Replace permissive record schemas with named strict Zod schemas and generated JSON Schema.
- [ ] Add api_version to successful results and structured errors.
- [ ] Reject unknown legal identity fields at adapter boundaries.
- [ ] Document additive versus breaking changes and support one prior minor contract during migration.
- [ ] Snapshot all input and output schemas and fail CI on undocumented drift.

## Verification

- [ ] MCP Inspector validates every output schema.
- [ ] Property-based invalid payloads are rejected.
- [ ] Tool text and structuredContent represent the same object.
- [ ] Schema snapshots match the documented contract version.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

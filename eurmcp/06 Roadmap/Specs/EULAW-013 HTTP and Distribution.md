---
title: EULAW-013 HTTP and Distribution
spec_id: EULAW-013
type: improvement-spec
priority: P1
area: delivery
status: proposed
milestone: 3
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-013 — HTTP and Distribution

## Requirement

The same read-only server MUST be distributable through npm, the MCP Registry, local stdio, and secured Streamable HTTP.

## Acceptance criteria

- [ ] Add a stateless Streamable HTTP entry point with origin and Host validation, request limits, and no session data leakage.
- [ ] Publish an exact-pinned npm package with a working executable.
- [ ] Publish server metadata to the official MCP Registry.
- [ ] Provide health and readiness endpoints that do not expose legal data or secrets.
- [ ] Run one shared conformance suite against stdio and HTTP transports.

## Verification

- [ ] Codex, Claude Code, and MCP Inspector connect through both transports.
- [ ] DNS rebinding and disallowed Origin tests fail closed.
- [ ] npm pack installs and starts in a clean Node 20 environment.
- [ ] Registry metadata matches package and tool versions.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

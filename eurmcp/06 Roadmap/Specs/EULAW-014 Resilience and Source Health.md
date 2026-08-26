---
title: EULAW-014 Resilience and Source Health
spec_id: EULAW-014
type: improvement-spec
priority: P1
area: operations
status: proposed
milestone: 3
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-014 — Resilience and Source Health

## Requirement

Upstream degradation MUST be observable, bounded, and represented honestly to callers.

## Acceptance criteria

- [ ] Add per-source circuit breakers, bounded concurrency, Retry-After handling, exponential backoff with jitter, and response-size limits.
- [ ] Add ETag and Last-Modified cache revalidation plus source-specific positive and negative TTLs.
- [ ] Add get_source_status reporting capability, last success, last failure class, and cache state without leaking local paths.
- [ ] Emit structured diagnostics only to stderr and optional OpenTelemetry metrics.
- [ ] Never return stale cached current-law data without a stale flag and original retrieval time.

## Verification

- [ ] Timeout, 429, 500, redirect, oversized body, wrong content type, and circuit-open paths return typed outcomes.
- [ ] Immutable judgment cache remains usable during a transient outage and is labeled.
- [ ] Current-consolidation metadata revalidates before its shorter TTL expires when configured.
- [ ] stdout stays protocol-only.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

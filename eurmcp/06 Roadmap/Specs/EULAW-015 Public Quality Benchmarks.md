---
title: EULAW-015 Public Quality Benchmarks
spec_id: EULAW-015
type: improvement-spec
priority: P1
area: quality
status: proposed
milestone: 3
effort: L
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-015 — Public Quality Benchmarks

## Requirement

Accuracy, search utility, and upstream compatibility claims MUST be reproducible through a public benchmark.

## Acceptance criteria

- [ ] Publish a golden corpus of exact article, recital, paragraph, language, identifier, and version checks.
- [ ] Publish search-quality queries with expected-known-document recall instead of brittle total ranking.
- [ ] Run nightly live canaries with rate limits and weekly cross-source reconciliation.
- [ ] Publish machine-readable results by source, language, parser, tool, latency, and failure type.
- [ ] Block release on exactness regressions; report upstream outages separately.

## Verification

- [ ] Benchmark reruns from a clean checkout.
- [ ] Known-document recall thresholds are explicit.
- [ ] A deliberately renumbered paragraph fails the benchmark.
- [ ] Live outage classification cannot be counted as a parser pass.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

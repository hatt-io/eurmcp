---
title: EULAW-016 Supply-Chain Assurance
spec_id: EULAW-016
type: improvement-spec
priority: P1
area: security
status: proposed
milestone: 3
effort: M
tags:
  - eurmcp
  - improvement-spec
---

# EULAW-016 — Supply-Chain Assurance

## Requirement

Releases MUST be reproducible, reviewable, and protected from newly published dependency risk.

## Acceptance criteria

- [ ] Keep exact dependency pins and package-lock integrity.
- [ ] Enforce the three-day minimum release-age cooldown for dependency updates.
- [ ] Generate SBOM, npm provenance, signed tags or attestations, and checksums.
- [ ] Run dependency review, CodeQL, secret scanning, licence checks, and minimal package-content checks.
- [ ] Document security reporting and supported release lines.

## Verification

- [ ] A dependency younger than 72 hours is rejected.
- [ ] npm pack contains only required runtime and documentation files.
- [ ] A clean build reproduces the same bundled artifact hash where platform permits.
- [ ] SBOM components match the lockfile.

## Governing constraints

This specification inherits the anti-hallucination, strict-language, official-source, SSRF, bounded-response, and typed-error rules in [[06 Roadmap/Best-in-Class Specification]].

## Status

Proposed. Change to specified only after public input/output contracts and authoritative source paths are documented.

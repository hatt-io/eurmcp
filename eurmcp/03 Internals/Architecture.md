---
title: Architecture
type: architecture
status: maintained
tags:
  - eurmcp
  - internals
---

# Architecture

## Request flow

```mermaid
flowchart LR
  C[MCP client] --> T[Tool handler]
  T --> V[Zod validation]
  V --> I[Identifier, language, version resolution]
  I --> S[LegalResearchService]
  S --> A[Source adapter]
  A --> H[Restricted HTTP client]
  H --> U[Official EU source]
  U --> P[Dedicated parser]
  P --> N[Normalized result]
  N --> R[Provenance]
  R --> C
```

## Boundaries

### MCP layer

`src/tools` defines schemas, read-only annotations, structured success, and structured failure. Handlers validate, delegate, and return. They do not contain source queries or parsing rules.

### Service layer

`src/server/services.ts` coordinates deterministic identifier resolution, versions, adapters, parsing, normalization, provenance, and structural diffs.

### Source adapters

`src/sources` isolates CELLAR, EUR-Lex, CURIA, EDPB, and EDPS behavior. See [[03 Internals/Source Adapters]].

### Legal layer

`src/legal` owns identifiers, citations, language codes, document types, provision selection, and version requests.

### Infrastructure

- `src/http/client.ts`: allowlist, redirects, retries, backoff, timeout, content type, streaming size cap.
- `src/cache/cache.ts`: cache abstraction, null cache, atomic filesystem cache.
- `src/errors/errors.ts`: stable typed error model.

## Source model

CELLAR follows work → expression → manifestation → item. The server resolves the legal work, selects the exact official language expression, selects an XHTML manifestation, then downloads the item. It never labels one language as another.

## Design invariants

- Missing is safer than invented.
- Legal identifiers are deterministic.
- Source numbering is never generated.
- Consolidated text is not an amending act.
- Search evidence does not imply interpretation.
- Every substantive result has provenance.
- stdout remains an MCP-only channel.

Related: [[03 Internals/Data Contracts]] and [[04 Operations/Security and Caching]].
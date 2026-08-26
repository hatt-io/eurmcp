---
title: search_eu_law
type: mcp-tool
tool: search_eu_law
category: legislation
source: CELLAR SPARQL
scope: metadata search
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# search_eu_law

Search authoritative EU legislation metadata.

## Input

```ts
{
  query: string;
  language?: string;
  document_type?: string;
  date_from?: string;
  date_to?: string;
  in_force?: boolean;
  limit?: number;
}
```

## Output

An array of matching works with title, available CELEX and ELI, document type, official dates, explicit in-force value when supplied by CELLAR, language, official links, CELLAR URI, and provenance.

## Deterministic behavior

- Uses CELLAR expression-title full-text metadata.
- Supports regulation, directive, decision, recommendation, opinion, delegated regulation, implementing regulation, and treaty.
- Omits `in_force` when CELLAR cannot establish it.
- Ranking is authoritative full-text ranking, not semantic inference.
- A broad query may need a larger limit.

## Errors

`INVALID_ARGUMENT`, `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_FORMAT_CHANGED`.

## Implementation

Registration: `src/tools/searchEuLaw.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

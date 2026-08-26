---
title: search_edps_documents
type: mcp-tool
tool: search_edps_documents
category: regulatory
source: CELLAR SPARQL
scope: limited EDPS metadata search
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# search_edps_documents

Search official EDPS publication metadata deposited in CELLAR.

## Input

```ts
{
  query: string;
  document_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}
```

## Output

Normalized title, available document type, date, CELEX, official CELLAR link, provenance, and methodology.

## Implementation

Registration: `src/tools/searchEdpsDocuments.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

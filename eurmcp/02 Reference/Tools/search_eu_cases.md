---
title: search_eu_cases
type: mcp-tool
tool: search_eu_cases
category: case-law
source: CELLAR SPARQL
scope: case metadata search
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# search_eu_cases

Search Court of Justice and General Court metadata.

## Input

```ts
{
  query?: string;
  case_number?: string;
  ecli?: string;
  celex?: string;
  provision?: string;
  date_from?: string;
  date_to?: string;
  court?: "court_of_justice" | "general_court";
  document_type?: "judgment" | "order" | "opinion";
  language?: string;
  limit?: number;
}
```

At least one search criterion is required.

## Output

Case number, name, ECLI, CELEX, court, chamber, document type, date, official links, match evidence, and provenance.

## Implementation

Registration: `src/tools/searchEuCases.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

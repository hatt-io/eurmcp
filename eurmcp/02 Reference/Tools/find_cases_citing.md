---
title: find_cases_citing
type: mcp-tool
tool: find_cases_citing
category: case-law
source: CELLAR SPARQL
scope: citation graph
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# find_cases_citing

Find EU court documents that cite a target judgment.

## Input

```ts
{
  case: string;
  court?: "court_of_justice" | "general_court";
  date_from?: string;
  date_to?: string;
  language?: string;
  limit?: number;
}
```

## Output

Canonical target case identifiers and citing case metadata with provenance.

## Evidence

The methodology uses the authoritative CELLAR `cdm:work_cites_work` relationship. Ordinary keyword co-occurrence is never accepted as proof of citation. Result provenance records the methodology. The relationship proves citation, not the legal treatment of the cited case.

## Implementation

Registration: `src/tools/findCasesCiting.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

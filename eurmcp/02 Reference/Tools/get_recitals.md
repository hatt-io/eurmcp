---
title: get_recitals
type: mcp-tool
tool: get_recitals
category: legislation
source: CELLAR XHTML
scope: exact recitals
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_recitals

Retrieve exact source-numbered recitals.

## Input

```ts
{
  document: string;
  recitals: number[] | { from: number; to: number };
  language?: string;
  version?: "original" | "current_consolidated" | string;
}
```

## Output

Document identity, requested recitals in request order, language, and provenance.

## Exactness

Each number resolves to the matching `rct_N` source subdivision. A missing recital fails the request. The parser never substitutes, renumbers, or reconstructs recital text.

## Errors

`RECITAL_NOT_FOUND`, `INVALID_ARGUMENT`, document, language, version, format, and upstream errors.

## Implementation

Registration: `src/tools/getRecitals.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

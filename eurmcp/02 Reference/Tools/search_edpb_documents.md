---
title: search_edpb_documents
type: mcp-tool
tool: search_edpb_documents
category: regulatory
source: EDPB official website
scope: guidance metadata search
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# search_edpb_documents

Search the official EDPB document catalogue.

## Input

```ts
{
  query: string;
  document_type?: "guideline" | "recommendation" | "opinion" | "statement" | "decision" | "other";
  status?: "adopted" | "consultation" | "all";
  date_from?: string;
  date_to?: string;
  limit?: number;
}
```

## Output

Title, document number, type, adoption date, version, status, topics, official page/file links, and provenance.

## Access method

The official EDPB catalogue has no documented stable public search API used here. A dedicated adapter parses official HTML selectors. Missing selectors or challenge pages fail explicitly. No general search engine is used.

## Implementation

Registration: `src/tools/searchEdpbDocuments.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

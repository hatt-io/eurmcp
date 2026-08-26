---
title: get_edpb_document
type: mcp-tool
tool: get_edpb_document
category: regulatory
source: EDPB official PDF
scope: guidance text
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_edpb_document

Retrieve an EDPB document and official PDF text.

## Input

```ts
{
  identifier_or_url: string;
  language?: string;
}
```

An URL must belong to the official EDPB domain. A textual identifier must resolve exactly; non-exact result sets return candidates rather than silently selecting the first hit.

## Output

Document metadata, requested official language, extracted PDF text, heading/paragraph sections where reliable, and provenance pointing to the official PDF.

## Exactness

- Selects an official language option from the EDPB page.
- Returns `LANGUAGE_NOT_AVAILABLE` when absent.
- Preserves visible numbered paragraphs where PDF extraction exposes them.
- Never machine-translates or completes PDF text.

## Implementation

Registration: `src/tools/getEdpbDocument.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

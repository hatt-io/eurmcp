---
title: get_case_paragraphs
type: mcp-tool
tool: get_case_paragraphs
category: case-law
source: CELLAR XHTML
scope: exact paragraphs
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_case_paragraphs

Retrieve only requested judgment paragraphs.

## Input

```ts
{
  case: string;
  paragraphs: number[] | { from: number; to: number };
  language?: string;
}
```

## Output

Canonical case identity, requested official language, exact numbered paragraphs, and provenance.

## Exactness

- Source numbers are never generated or renumbered.
- Requested order is preserved.
- Two numbered paragraphs are never merged.
- A missing number returns `PARAGRAPH_NOT_FOUND`.
- The error includes the requested number and available range.
- A nearby paragraph is never substituted.

## Implementation

Registration: `src/tools/getCaseParagraphs.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

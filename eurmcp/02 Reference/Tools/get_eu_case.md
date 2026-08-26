---
title: get_eu_case
type: mcp-tool
tool: get_eu_case
category: case-law
source: CELLAR XHTML
scope: whole court document
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_eu_case

Retrieve a specific official EU court document with source numbering.

## Input

```ts
{
  identifier: string;
  language?: string;
  document_type?: "judgment" | "order" | "opinion";
}
```

Recognizes case numbers, case CELEX, and ECLI.

## Output

Canonical case number, identifiers, court, chamber, date, document type, language, every source-numbered paragraph, operative part when structurally available, consistency checks, official links, and provenance.

## Exactness

- All equivalent identifiers resolve to one CELLAR work.
- Visible paragraph number must match the source element ID.
- Duplicate, missing, or inconsistent numbering fails closed.
- Footnotes are excluded.
- Advocate General documents are selected only by explicit document type.

## Implementation

Registration: `src/tools/getEuCase.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

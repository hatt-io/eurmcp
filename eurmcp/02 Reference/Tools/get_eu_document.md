---
title: get_eu_document
type: mcp-tool
tool: get_eu_document
category: legislation
source: CELLAR XHTML
scope: whole document
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_eu_document

Retrieve one official legal act by deterministic identifier, language, and version.

## Input

```ts
{
  identifier: string;
  language?: string;
  version?: "original" | "current_consolidated" | string;
}
```

Recognized identifiers include CELEX, ELI, formal citations, and explicit aliases such as GDPR.

## Output

Title, identifiers, document type, language, version metadata, complete official text, legal metadata, relationships, official link, and provenance.

## Exactness

- Resolves a work before selecting its language expression.
- Resolves an XHTML manifestation and item through CELLAR WEMI.
- Never substitutes an original act for a requested consolidation.
- Never returns English while labeling it Swedish.
- Ambiguity returns candidates.

## Errors

`DOCUMENT_NOT_FOUND`, `LANGUAGE_NOT_AVAILABLE`, `AMBIGUOUS_IDENTIFIER`, `VERSION_NOT_FOUND`, `INVALID_IDENTIFIER`, and upstream errors.

## Implementation

Registration: `src/tools/getEuDocument.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

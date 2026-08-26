---
title: list_document_versions
type: mcp-tool
tool: list_document_versions
category: legislation
source: CELLAR metadata
scope: official versions
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# list_document_versions

List the original act and every official consolidation.

## Input

```ts
{
  document: string;
  language?: string;
}
```

## Output

Canonical document identity, requested language, original and consolidated version records, language availability for each version, and provenance.

## Rules

- Original and consolidated resources remain distinct.
- Consolidation snapshot dates are official consolidation dates.
- Missing requested-language content is reported and never replaced with another language.

## Implementation

Registration: `src/tools/listDocumentVersions.ts`. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

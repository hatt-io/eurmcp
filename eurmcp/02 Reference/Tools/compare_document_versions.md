---
title: compare_document_versions
type: mcp-tool
tool: compare_document_versions
category: legislation
source: CELLAR XHTML
scope: structural diff
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# compare_document_versions

Compare two official versions of the same instrument.

## Input

```ts
{
  document: string;
  version_a: string;
  version_b: string;
  language?: string;
  article?: string;
}
```

## Output

Canonical document identity, both version records, deterministic changes, and independent provenance for both source manifestations.

Each change has a stable article, paragraph, point, or subpoint location; `added`, `removed`, or `modified`; and available before/after text.

## Method

- Parse both official structures.
- Flatten source hierarchy into stable locations.
- Normalize irrelevant whitespace and markup.
- Compare exact normalized strings.
- Return no LLM summary and no conclusion about legal effect.

Formatting-only changes are not described as amendments.

## Implementation

Registration: `src/tools/compareDocumentVersions.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

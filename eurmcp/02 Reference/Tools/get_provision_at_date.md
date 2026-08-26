---
title: get_provision_at_date
type: mcp-tool
tool: get_provision_at_date
category: legislation
source: CELLAR XHTML
scope: point-in-time provision
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_provision_at_date

Retrieve one exact article from the latest safe official snapshot on or before a date.

## Input

```ts
{
  document: string;
  article: string;
  date: string;
  language?: string;
}
```

## Output

Canonical identity, requested date, selected official snapshot, exact article structure and source anchors, `legal_effect_not_inferred: true`, and provenance.

## Safety rule

A known amendment or corrigendum after the selected snapshot and no later than the requested date returns `VERSION_NOT_FOUND` with the blocking events. Dates before publication and missing-language snapshots also return `VERSION_NOT_FOUND`.

## Implementation

Registration: `src/tools/getProvisionAtDate.ts`. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

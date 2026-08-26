---
title: get_document_timeline
type: mcp-tool
tool: get_document_timeline
category: legislation
source: CELLAR metadata
scope: official timeline
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_document_timeline

Return the official event timeline for an instrument.

## Input

```ts
{
  document: string;
  language?: string;
}
```

## Output

Original, corrigendum, amending-act, and consolidation events with event dates, authoritative predicates, identifiers, resource URIs, and provenance.

## Rules

- Each event remains a distinct official resource.
- Publication dates date originals; official consolidation dates date consolidated snapshots.
- Text differences never create amendment claims.

## Implementation

Registration: `src/tools/getDocumentTimeline.ts`. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

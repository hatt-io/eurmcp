---
title: get_article
type: mcp-tool
tool: get_article
category: legislation
source: CELLAR XHTML
scope: exact provision
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# get_article

Retrieve one structurally exact numbered article.

## Input

```ts
{
  document: string;
  article: string;
  language?: string;
  version?: "original" | "current_consolidated" | string;
}
```

## Output

Document identifiers, exact article number, source heading, numbered paragraphs, lettered points, nested subpoints, language, version, and provenance.

## Exactness

- Article boundaries come from CELLAR XHTML subdivision IDs.
- Original and consolidated XHTML structures have separate parser paths.
- Paragraph and point labels remain source labels.
- No semantic boundary inference occurs.
- Only the requested article is returned.

## Errors

`ARTICLE_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `LANGUAGE_NOT_AVAILABLE`, `VERSION_NOT_FOUND`, and format/upstream errors.

## Implementation

Registration: `src/tools/getArticle.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

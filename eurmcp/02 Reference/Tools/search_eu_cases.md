---
title: search_eu_cases
type: mcp-tool
tool: search_eu_cases
category: case-law
source: CELLAR SPARQL
scope: case metadata search
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# search_eu_cases

Search Court of Justice and General Court metadata.

## Input

```ts
{
  query?: string;
  case_number?: string;
  ecli?: string;
  celex?: string;
  interpreted_celex?: string;
  provision?: string;
  date_from?: string;
  date_to?: string;
  court?: "court_of_justice" | "general_court";
  document_type?: "judgment" | "order" | "opinion";
  language?: string;
  limit?: number;
}
```

At least one search criterion is required.

`celex` accepts only an exact case-law CELEX. Use `interpreted_celex` for a legislation CELEX whose instrument-level CELLAR relationship should be searched.

`query` applies AND semantics to searchable tokens and matches only the official case title. Title matches are relevance-ranked.

`provision` must contain one article and a recognized instrument, such as `Article 82 GDPR` or `Article 82 of Regulation (EU) 2016/679`. CELLAR instrument metadata identifies bounded candidates. Each candidate is then checked against its official numbered case paragraphs. A result is returned only when a numbered paragraph directly links that article citation to that instrument. Match evidence includes the paragraph text and source anchor. This establishes a textual citation, not a legal interpretation claim.

`interpreted_celex` performs only the broader instrument-level metadata search and does not claim article-level relevance.

## Output

Case number, name, ECLI, CELEX, court, chamber, document type, date, official links, match evidence, and provenance.

## Implementation

Registration: `src/tools/searchEuCases.ts` is represented by a dedicated camel-case registration module. Orchestration is in `src/server/services.ts`.

Back to [[02 Reference/MCP Tools]].

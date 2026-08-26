---
title: Data Contracts
type: reference
status: maintained
tags:
  - eurmcp
  - data-model
---

# Data Contracts

## Provenance

Every substantive result uses the shared `Provenance` contract:

```ts
type Provenance = {
  publisher: string;
  source_system: string;
  source_url: string;
  retrieved_at: string;
  identifier?: string;
  language?: string;
  celex?: string;
  eli?: string;
  ecli?: string;
  cellar_uri?: string;
};
```

The caller can identify the publisher, source system, exact retrieval URL, retrieval time, document, and language.

## Provision hierarchy

`LegalParagraph` stores an optional source number, exact text, and nested `LegalPoint` entries. Points recursively preserve labels and subpoints. Article boundaries come only from source structural identifiers.

## Judgment paragraphs

A case paragraph is `{ number, text }`. The parser requires the visible source number to match the source element identifier, rejects duplicates, excludes footnote markers, and never renumbers.

## Versions

- Original: `{ type: "original" }`.
- Consolidated: `{ type: "consolidated", date, consolidation_date }`.

`current_consolidated` selects the newest official dated CELLAR consolidation. Missing official consolidation returns `VERSION_NOT_FOUND`.

## Relationships

Metadata-backed values are:

- `amends`
- `amended_by`
- `corrects`
- `corrected_by`
- `implements`
- `implemented_by`
- `repeals`
- `repealed_by`
- `consolidates`
- `related_case`

Relationships are never inferred from textual similarity.

## Errors

Stable codes:

`DOCUMENT_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `RECITAL_NOT_FOUND`, `CASE_NOT_FOUND`, `PARAGRAPH_NOT_FOUND`, `LANGUAGE_NOT_AVAILABLE`, `AMBIGUOUS_IDENTIFIER`, `VERSION_NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_TIMEOUT`, `UPSTREAM_FORMAT_CHANGED`, `INVALID_IDENTIFIER`, and `INVALID_ARGUMENT`.

Tool errors set MCP `isError: true` and return structured context.


Related: [[03 Internals/Architecture]] and [[Home]].
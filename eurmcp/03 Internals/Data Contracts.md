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

Every success and structured error includes `api_version: "1.0"`. Every substantive result uses the shared `Provenance` evidence envelope. In addition to the source identity fields below, it records evidence and snapshot identifiers, raw and normalized SHA-256 values, parser identity, HTTP receipt data, and available CELLAR work/expression/manifestation/item URIs.

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
  evidence_id?: string;
  snapshot_available?: boolean;
  media_type?: string;
  response_sha256?: string;
  normalized_text_sha256?: string;
  parser_name?: string;
  parser_version?: string;
  normalization?: string;
  http_status?: number;
  byte_count?: number;
  etag?: string;
  last_modified?: string;
  cache_status?: "hit" | "miss";
  cellar_work_uri?: string;
  cellar_expression_uri?: string;
  cellar_manifestation_uri?: string;
  cellar_item_uri?: string;
};
```

Cache hits preserve the original retrieval receipt. Parsed exact text uses `legal-text-nfc-whitespace-v1`: Unicode NFC, NBSP and line-ending normalization, whitespace collapse, and trim. Case, punctuation, numbering, and diacritics remain significant.

## Source anchors

Exact articles, recitals, article paragraphs and points, case paragraphs, and numbered regulator paragraphs carry:

```ts
type SourceAnchor = {
  anchor_id: string;
  kind: string;
  location: string;
  source_element_id?: string;
  structural_path: string;
  text_sha256: string;
};
```

Anchor IDs bind the evidence ID, parser version, and canonical legal location. Quote verification returns `exact_match`, `normalized_match`, or `no_match` without repairing or relocating the quote.

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

Evidence is classified as `textual_mention`, `metadata_relation`, `formal_citation`, `operative_reference`, or `authoritative_classification`. Instrument-level CELLAR classifications are never promoted to provision-level interpretation claims.

## Source consistency

Official metadata reconciliation reports `verified_cross_system`, `verified_same_system`, `primary_only`, or `conflict`. Field checks and discrepancies preserve all official values. A secondary-source failure does not block exact primary retrieval.

## Errors

Stable codes:

`DOCUMENT_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `RECITAL_NOT_FOUND`, `CASE_NOT_FOUND`, `PARAGRAPH_NOT_FOUND`, `LANGUAGE_NOT_AVAILABLE`, `AMBIGUOUS_IDENTIFIER`, `VERSION_NOT_FOUND`, `EVIDENCE_NOT_FOUND`, `SOURCE_ANCHOR_NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_TIMEOUT`, `UPSTREAM_FORMAT_CHANGED`, `INVALID_IDENTIFIER`, and `INVALID_ARGUMENT`.

Tool errors set MCP `isError: true` and return structured context.


Related: [[03 Internals/Architecture]] and [[Home]].

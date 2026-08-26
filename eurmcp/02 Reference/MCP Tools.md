---
title: MCP Tools
type: reference
status: maintained
tags:
  - eurmcp
  - mcp-tools
---

# MCP Tools

All tools are read-only and return MCP structured output. Substantive results include provenance.

## Legislation

- [[02 Reference/Tools/search_eu_law]]
- [[02 Reference/Tools/get_eu_document]]
- [[02 Reference/Tools/get_article]]
- [[02 Reference/Tools/get_recitals]]
- [[02 Reference/Tools/compare_document_versions]]

## Case law

- [[02 Reference/Tools/search_eu_cases]]
- [[02 Reference/Tools/get_eu_case]]
- [[02 Reference/Tools/get_case_paragraphs]]
- [[02 Reference/Tools/find_cases_citing]]

## Regulatory material

- [[02 Reference/Tools/search_edpb_documents]]
- [[02 Reference/Tools/get_edpb_document]]
- [[02 Reference/Tools/search_edps_documents]]

## Shared argument rules

- Languages accept normalized official EU language codes. English and Swedish live retrieval are tested.
- Dates use `YYYY-MM-DD`.
- Limits range from 1 to 100.
- Paragraph and recital selections accept a positive integer array or a `from` and `to` object.
- Versions accept `original`, `current_consolidated`, or an official consolidation date.
- Missing material returns a structured error and never a neighboring provision.

Query the interactive [[Tool Catalog.base|Tool Catalog]] for a property-driven view.
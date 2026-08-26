---
title: CELLAR Predicate Registry
type: reference
status: maintained
tags:
  - eurmcp
  - cellar
  - sparql
---

# CELLAR Predicate Registry

Predicates used by named query builders. Every addition requires official documentation review and a live endpoint test.

## Identity

- `cdm:resource_legal_id_celex`
- `cdm:resource_legal_eli`
- `cdm:case-law_ecli`

## WEMI traversal

- `cdm:expression_belongs_to_work`
- `cdm:expression_uses_language`
- `cdm:expression_title`
- `cdm:manifestation_manifests_expression`
- `cdm:manifestation_type`
- `cdm:item_belongs_to_manifestation`

## Dates and status

- `cdm:work_date_document`
- `cdm:date_creation_legacy`
- `cdm:resource_legal_date_entry-into-force`
- `cdm:resource_legal_date_end-of-validity`
- `cdm:resource_legal_in-force`
- `cdm:work_has_resource-type`

## Case law

- `cdm:case-law_delivered_by_court-formation`
- `cdm:case-law_interpretes_resource_legal`
- `cdm:work_cites_work`

## Versions and relationships

- `cdm:act_consolidated_consolidates_resource_legal`
- `cdm:resource_legal_amends_resource_legal`
- `cdm:resource_legal_repeals_resource_legal`
- `cdm:resource_legal_corrects_resource_legal`
- `cdm:resource_legal_implements_resource_legal`

## Safety

- Raw strings are escaped by `sparqlString`.
- Internal IRIs pass `sparqlIri`.
- Search terms are tokenized by `fullTextExpression`.
- Callers cannot submit SPARQL.
- Query limits are bounded.

Implementation: `src/sources/cellar/queries.ts` and `src/sources/cellar/sparql.ts`.


Related: [[03 Internals/Source Adapters]] and [[Home]].

---
title: Source Adapters
type: architecture
status: maintained
tags:
  - eurmcp
  - sources
---

# Source Adapters

## CELLAR

Files: `src/sources/cellar`.

Access:

- Official SPARQL endpoint: `https://publications.europa.eu/webapi/rdf/sparql`.
- Official item dissemination under `https://publications.europa.eu/resource/cellar/...`.

Responsibilities:

- Resolve CELEX, ELI, and ECLI to works.
- Resolve official language expressions.
- Resolve XHTML manifestations and items.
- Search legislation and case-law metadata.
- Find consolidations, relationships, and citations.
- Retrieve legal XHTML and judgment XHTML.

All raw SPARQL lives in named builders in `queries.ts`. Callers cannot supply SPARQL.

## EUR-Lex

Files: `src/sources/eurlex`.

Provides deterministic official links for CELEX, ELI, and ECLI. Browser-facing content retrieval is not a core dependency because EUR-Lex may return WAF challenges. Exact legal text uses CELLAR.

## CURIA

Files: `src/sources/curia`.

Provides deterministic official case-file links. Exact numbered judgment content uses CELLAR XHTML, avoiding brittle search-result scraping.

## EDPB

Files: `src/sources/edpb`.

The official site has no documented stable public search API used by this project. The adapter parses official catalogue and document pages, selects the requested official PDF language, and extracts PDF text.

Failure controls:

- Dedicated selectors.
- Fixture coverage.
- WAF/challenge detection.
- Official-domain URL validation.
- `LANGUAGE_NOT_AVAILABLE` for absent language files.
- Explicit format errors when expected structure changes.

## EDPS

Files: `src/sources/edps`.

Search uses official Publications Office CELLAR records whose titles identify the European Data Protection Supervisor.

## Adding a source

Use [[05 Development/Contributing]] and [[Templates/Source Adapter Review]].

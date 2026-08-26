---
title: Contributing
type: development
status: maintained
tags:
  - eurmcp
  - contributing
---

# Contributing

## Rules

- Keep network retrieval, parsing, identifiers, normalization, and MCP registration separate.
- Centralize CDM/SPARQL in named query builders.
- Verify predicates against official CDM documentation and live responses.
- Add authoritative fixtures for parser changes.
- Add live coverage for new upstream behavior.
- Preserve exact source numbering and language.
- Fail closed on format changes.
- Omit unsupported metadata instead of inferring it.
- Keep stdout protocol-only.
- Keep external access read-only and allowlisted.

Never add:

- Fuzzy legal identifier selection.
- Machine translation of source material.
- LLM reconstruction of legal text.
- General search engines as the core search path.
- Unofficial legal databases as substitutes.
- Arbitrary URL retrieval.
- Caller-supplied SPARQL.
- Keyword co-occurrence presented as citation or interpretation.

## Adding an MCP tool

1. Define the Zod input schema in a dedicated file under `src/tools`.
2. Use read-only annotations.
3. Delegate to `LegalResearchService`.
4. Return structured success or a typed structured error.
5. Register the tool in `createServer.ts`.
6. Add unit or fixture tests.
7. Add a live test if it uses upstream behavior.
8. Add the tool to `scripts/mcp-smoke.mjs`.
9. Document it under [[02 Reference/MCP Tools]].

## Adding a parser

Use structural source identifiers, never semantic similarity. Reject missing expected roots, duplicate identifiers, malformed numbering, and challenge pages.

## Definition of done

See [[05 Development/Release Checklist]].
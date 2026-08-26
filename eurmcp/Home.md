---
title: eu-law-mcp Documentation
type: map-of-content
status: maintained
tags:
  - eurmcp
  - documentation
aliases:
  - eu-law-mcp docs
---

# eu-law-mcp

Production documentation for the source-grounded EU law MCP server.

> [!important] System boundary
> This server retrieves authoritative legal material. It does not provide legal advice, invent missing text, translate legal text, or infer legal conclusions.

## Start here

- [[01 User Guide/Getting Started|Getting Started]]
- [[01 User Guide/Client Setup|Client Setup]]
- [[02 Reference/MCP Tools|MCP Tool Reference]]
- [[02 Reference/Function Index|TypeScript Function Index]]
- [[02 Reference/Configuration|Configuration]]
- [[03 Internals/Architecture|Architecture]]
- [[03 Internals/Source Adapters|Authoritative Source Adapters]]
- [[03 Internals/Data Contracts|Data Contracts]]
- [[04 Operations/Security and Caching|Security and Caching]]
- [[04 Operations/Testing and Verification|Testing and Verification]]
- [[05 Development/Contributing|Contributing]]
- [[05 Development/Release Checklist|Release Checklist]]

## Core guarantee

Authoritative source → exact legal material → structured metadata → provenance.

## Current implementation

- Runtime: Node.js 20+, TypeScript, ESM.
- Protocol: MCP TypeScript SDK v2 over stdio.
- Validation: Zod 4.
- Core source: Publications Office CELLAR SPARQL and XHTML dissemination.
- Regulatory guidance: official EDPB website and PDFs.
- Cache: local filesystem, no external service.
- Security: read-only tools and authoritative-domain allowlist.

## Quick commands

```bash
npm ci
npm run build
npm start
```

Full verification:

```bash
npm run build
npm run lint
npm run format:check
npm test
npm run test:live
npm run smoke:mcp
```

## Repository

The application repository is the parent directory of this vault. The canonical public overview remains at `../README.md`. This vault provides navigable operational and developer documentation.

## Deep reference

- [[02 Reference/Identifiers and Languages|Identifiers and Languages]]
- [[03 Internals/CELLAR Predicate Registry|CELLAR Predicate Registry]]


## Product roadmap

- [[06 Roadmap/Roadmap|Roadmap]]
- [[06 Roadmap/Competitive Benchmark|Competitive Benchmark]]
- [[06 Roadmap/Best-in-Class Specification|Best-in-Class Specification]]
- [[06 Roadmap/Improvement Specs.base|Improvement Specs database]]

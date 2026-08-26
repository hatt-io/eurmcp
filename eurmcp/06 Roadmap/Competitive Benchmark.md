---
title: Competitive Benchmark
type: benchmark
status: maintained
reviewed: 2026-08-26
tags:
  - eurmcp
  - roadmap
  - competition
aliases:
  - EU law MCP comparison
---

# Competitive Benchmark

## Method

Research date: 2026-08-26.

This is a capability comparison based on each project's published repository documentation and the verified behavior of eu-law-mcp. Competitor rows are documentation claims, not independent accuracy audits. A check means the project documents the capability. It does not prove extraction accuracy.

The benchmark rewards the server's actual mission: authoritative source → exact legal material → structured metadata → provenance. Breadth alone does not win.

## Current position

eu-law-mcp has the strongest documented combination of:

- exact legislation articles with nested source structure;
- exact numbered recitals;
- exact numbered CJEU judgment paragraphs;
- deterministic original/consolidated structural comparison;
- deterministic CELEX, ELI, ECLI, case-number, formal-citation, and explicit-alias resolution;
- strict language handling without silent fallback or machine translation;
- typed failures for missing articles, recitals, paragraphs, versions, and languages;
- EDPB and EDPS coverage in the same server;
- a strict upstream allowlist with no caller-supplied URL or SPARQL surface.

Its biggest gaps are discovery depth, temporal navigation, context-efficient retrieval, remote deployment, and independently verifiable source snapshots.

## Direct EU-law competitors

| Project | Documented strengths | Gap relative to eu-law-mcp | What to learn |
|---|---|---|---|
| [Honeyfield eurlex-mcp-server](https://github.com/Honeyfield-Org/eurlex-mcp-server) | 11 tools; EuroVoc; national transposition measures; metadata-only and outline retrieval; LEGISSUM; pagination; published output schemas; stdio and HTTP; 24 languages | No documented EDPB/EDPS tools; no dedicated typed exact-recital API; no structural version diff; exposes raw SPARQL | Add EuroVoc, transposition, outlines, pagination, precise output schemas, and HTTP. Keep raw SPARQL prohibited. |
| [cyanheads eur-lex-mcp-server](https://github.com/cyanheads/eur-lex-mcp-server) | 7 tools, 2 resources, 1 prompt; EuroVoc; relationship graph; metadata-only and selective retrieval; Formex4 XML; stdio and hosted Streamable HTTP | No EDPB/EDPS; no documented exact recital or version-diff tool; documented automatic language fallback conflicts with eu-law-mcp strict-language policy; exposes raw SPARQL | Add resources, Formex4 ingestion, remote transport, relationship filters, and subject browsing. Preserve strict language errors. |
| [scimorph eur-lex-mcp](https://github.com/scimorph/eur-lex-mcp) | Official EUR-Lex SOAP search; native expert-search syntax; document resource template; stdio and HTTP | Credentials required; narrower tool surface; no documented paragraph/recital/version-diff/regulator support | Use the SOAP service as an optional reconciliation/search source, never as the only retrieval path. |
| [matematicsolutions mcp-eu-sparql](https://github.com/matematicsolutions/mcp-eu-sparql) | Published to npm and MCP Registry; small CELEX/ECLI citation contract; CJEU/AG search; live smoke tests | Five broad tools; no exact full-text provision/paragraph APIs; includes unofficial GDPRhub; README documents the older monolithic SDK | Match its install and registry convenience. Do not weaken the official-source boundary. |
| [OpenLaw MCP](https://github.com/damankaur-dev/openlaw-mcp) | Official-source UK/EU/ECHR/regulator breadth; hosted HTTP, stdio, and self-hosted HTTP; provenance and licence attribution | EU support is one part of a broad cross-jurisdiction server; less specialized EU identifier and structure surface | Add deployment modes, health checks, source licences, and operational controls. |
| [Moonlit Legal Research MCP](https://github.com/moonlit-ai/legal-research-mcp) | Remote service; hybrid search; cross-jurisdiction reach; large citation graph; provision-level references | Hosted data layer and account model; backend is not an auditable open-source EU-source adapter; broader commercial goal | Build a transparent, official-source-only provision citation graph and optional semantic discovery with exact-source handoff. |

## Adjacent benchmark

[uk-legal-mcp](https://github.com/paulieb89/uk-legal-mcp) is not an EU competitor, but it is a useful product benchmark. It documents point-in-time legislation, paragraph reads, in-document search, large-document resources, parliamentary chains, hosted HTTP, and citation parsing. eu-law-mcp should match its context-efficient workflows while retaining stricter EU-source semantics.

## Capability matrix

Legend: yes = implemented or documented; partial = adjacent capability; no = not documented. Competitor values remain documentation claims.

| Capability | eu-law-mcp | Honeyfield | cyanheads | scimorph | mcp-eu-sparql |
|---|---:|---:|---:|---:|---:|
| Official CELLAR metadata | yes | yes | yes | partial | yes |
| Exact article API | yes | partial | partial | no | no |
| Exact recital API | yes | no | partial | no | no |
| Exact judgment paragraph API | yes | partial | no | no | no |
| Strict not-found errors | yes | unknown | unknown | unknown | unknown |
| Original/consolidated structural diff | yes | no | no | no | no |
| Strict no-language-fallback rule | yes | unknown | no | unknown | unknown |
| EuroVoc discovery | no | yes | yes | no | no |
| National transposition measures | no | yes | yes | no | no |
| Document outline/metadata-only mode | no | yes | yes | no | no |
| MCP resources | no | no | yes | yes | no |
| Streamable HTTP | no | yes | yes | yes | no |
| npm + MCP Registry distribution | no | yes/unknown registry | yes | no | yes |
| EDPB and EDPS | yes | no | no | no | no |
| Caller-supplied SPARQL prohibited | yes | no | no | yes | yes |
| Detailed per-result provenance | yes | partial | partial | partial | citation contract |

## Defensible product strategy

Do not compete by adding every possible source or a raw query escape hatch. Win on five properties:

1. Exactness: source numbering and boundaries are never synthesized.
2. Verifiability: every excerpt can be rechecked against a stable authoritative URL and source fingerprint.
3. Temporal correctness: original, amended, consolidated, corrected, and point-in-time states remain distinct.
4. Honest evidence: mention, citation, relationship, and interpretation are different evidence classes.
5. Production usability: fast discovery, bounded retrieval, stable schemas, simple install, remote transport, and visible source health.

## Conclusion

eu-law-mcp is already stronger for pinpoint EU legal retrieval. It is not yet the strongest general EU-law research MCP because competitors expose better EuroVoc search, transposition metadata, outlines, resources, pagination, HTTP access, and package distribution. The linked [[06 Roadmap/Best-in-Class Specification|Best-in-Class Specification]] closes those gaps without sacrificing the stricter source rules.

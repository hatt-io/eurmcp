---
title: TypeScript Function Index
type: reference
status: maintained
tags:
  - eurmcp
  - functions
---

# TypeScript Function Index

Public exports grouped by responsibility. File links are repository-relative.

## Server composition

| Export | File | Responsibility |
| --- | --- | --- |
| `createServer` | `src/server/createServer.ts` | Construct MCP v2 server and register every tool |
| `createService` | `src/server/createServer.ts` | Construct adapters and orchestration service |
| `LegalResearchService` | `src/server/services.ts` | Coordinate resolution, retrieval, parsing, normalization, provenance, diffing |

## Identifiers

| Export | Responsibility |
| --- | --- |
| `normalizeCelex` | Validate and canonicalize CELEX |
| `normalizeEcli` | Validate and canonicalize ECLI |
| `normalizeEli` | Validate official ELI URI and canonicalize host |
| `normalizeCaseNumber` | Canonicalize C/T/F case number |
| `caseNumberToCelex` | Deterministically form court-document CELEX |
| `celexToCaseNumber` | Derive canonical case number from supported case CELEX |
| `parseIdentifier` | Resolve supported identifier kind and explicit alias |
| `parseIdentifierWithAliases` | Resolve with an injected deterministic alias registry |
| `instrumentAliases` | Maintained explicit alias registry |

File: `src/legal/identifiers.ts`.

## Legal normalization

- `normalizeCitationText`: stable citation whitespace.
- `normalizeForDiff`: ignore irrelevant diff whitespace and markup.
- `normalizeLanguage`: resolve ISO, CELLAR, and ELI language forms.
- `officialEuLanguageCodes`: supported official language codes.
- `normalizeDocumentType`: validate supported legal act filter.
- `resourceTypeName`: map CELLAR authority URI to normalized name.
- `normalizeArticleNumber`: validate exact article syntax.
- `expandNumberSelection`: validate and expand arrays or inclusive ranges.
- `normalizeVersion`: validate original, current consolidation, or date.

Files: `src/legal`.

## CELLAR query builders

| Export | Query purpose |
| --- | --- |
| `findWorkByCelex` | Work plus requested language by CELEX |
| `findWorkByCelexAnyLanguage` | Language-neutral existence check |
| `findWorkByEli` | Work plus requested language by ELI |
| `findWorkByEliAnyLanguage` | Language-neutral ELI existence check |
| `findWorkByEcli` | Work plus requested language by ECLI |
| `findWorkByEcliAnyLanguage` | Language-neutral ECLI existence check |
| `findExpressions` | Expressions, manifestations, and items |
| `findManifestations` | Named alias for manifestation traversal |
| `searchLegislation` | Authoritative legislation metadata search |
| `searchCaseLaw` | Authoritative court metadata search |
| `findConsolidations` | Official consolidation works and dates |
| `findAmendingActs` | Metadata-backed relationships |
| `findCorrigenda` | Official corrigendum relationships and dates |
| `findCitations` | Inbound `work_cites_work` relationships |
| `searchEdpsPublications` | Limited official EDPS metadata |

File: `src/sources/cellar/queries.ts`.

SPARQL safety helpers:

- `sparqlString`
- `sparqlIri`
- `fullTextExpression`
- `dateFilter`
- `prefixes`

## Source parsers

| Export | Responsibility |
| --- | --- |
| `parseLegislationXhtml` | Parse official legislation title, articles, recitals, language |
| `parseFormex4` | Parse supported official Formex4 article and recital structures |
| `parseOfficialDocument` | Dispatch through the strict official parser registry |
| `extractArticle` | Extract one exact article |
| `extractRecitals` | Extract requested exact recitals |
| `parseCaseXhtml` | Parse identifiers, date, numbered paragraphs, operative part |
| `extractCaseParagraphs` | Select exact numbered case paragraphs |
| `parseEdpbSearchPage` | Parse official EDPB catalogue cards |
| `parseEdpbDocumentPage` | Resolve official metadata and requested PDF language |
| `sectionsFromPdfText` | Preserve reliable headings and visible paragraph numbers |
| `parseEdpsSearchPage` | Detect direct-site result structure or WAF failure |
| `rejectEurLexChallenge` | Detect EUR-Lex challenge content |
| `requireCuriaCaseResult` | Validate expected CURIA response structure |

## Infrastructure

| Export | Responsibility |
| --- | --- |
| `HttpClient` | Restricted official-source HTTP client |
| `FileCache` | Atomic local cache |
| `NullCache` | Disabled-cache implementation |
| `FileEvidenceStore` | Content-addressed durable source evidence |
| `NullEvidenceStore` | Hash-only behavior when durable evidence is disabled |
| `normalizeLegalText` | Versioned NFC and whitespace normalization |
| `verifyStoredQuote` | Exact or normalized comparison against one stored anchor |
| `cacheTtl` | Material-specific TTL policy |
| `EuLawError` | Typed API error |
| `asEuLawError` | Normalize unknown failure |
| `loadConfig` | Validate runtime environment |
| `success` / `failure` | MCP structured result helpers |

## MCP registration functions

Each tool has one dedicated `register...` export:

- `registerSearchEuLaw`
- `registerGetEuDocument`
- `registerGetArticle`
- `registerGetRecitals`
- `registerCompareDocumentVersions`
- `registerSearchEuCases`
- `registerGetEuCase`
- `registerGetCaseParagraphs`
- `registerFindCasesCiting`
- `registerSearchEdpbDocuments`
- `registerGetEdpbDocument`
- `registerSearchEdpsDocuments`
- `registerListDocumentVersions`
- `registerGetDocumentTimeline`
- `registerGetProvisionAtDate`
- `registerVerifyLegalQuote`

See [[02 Reference/MCP Tools]] for external contracts.

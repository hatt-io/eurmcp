# eu-law-mcp

`eu-law-mcp` 0.2.0 is a read-only MCP server for deterministic retrieval of authoritative EU legal material. It returns source text, exact structural identifiers, versioned schemas, durable evidence, source anchors, normalized metadata, and provenance. It is a legal-source and legal-research server, not a legal chatbot. It never supplies legal conclusions or reconstructs missing text.

[Read the documentation](https://hatt-io.github.io/eurmcp/)

## Status and design

The server uses TypeScript, Node.js 20+, ESM, Zod 4, the split MCP TypeScript SDK v2 packages, and stdio transport. Network retrieval, source parsing, identifier resolution, legal normalization, caching, and MCP registration are separate modules.

The retrieval flow is:

```text
validated MCP input
  -> deterministic identifier/language/version resolution
  -> authoritative source adapter
  -> source-structure parser
  -> normalized structured result
  -> content-addressed evidence and anchors
  -> strict versioned result and provenance
```

No general web search engine, commercial database, unofficial legal database, caller-supplied URL proxy, caller-supplied SPARQL, machine translation, or LLM-generated source text is used.

## Authoritative sources

| Source                     | Access                                                    | Use                                                                                                                                |
| -------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Publications Office CELLAR | Official SPARQL endpoint and REST item dissemination      | Core legislation and case metadata, WEMI resolution, official XHTML, versions, relationships, citations, EDPS publication metadata |
| EUR-Lex                    | Deterministic official CELEX/ELI/ECLI links               | Stable provenance and user-facing document links; exact text comes from CELLAR manifestations                                      |
| CURIA                      | Public official case pages and deterministic links        | Field-level case reconciliation; exact numbered judgment text comes from CELLAR manifestations                                     |
| EDPB                       | Official Drupal catalogue/document HTML and official PDFs | Guidance search, language-specific files, exact PDF text                                                                           |
| EDPS                       | Official records published through CELLAR                 | Limited EDPS metadata search                                                                                                       |

CELLAR queries use documented CDM work/expression/manifestation/item relationships and are centralized in `src/sources/cellar/queries.ts`. Tool handlers contain no raw SPARQL.

HTML parsing remains necessary only for the official EDPB catalogue and document pages because no stable documented public search API was found. Parsing is isolated in `src/sources/edpb/parser.ts`, preserves the official page/PDF URL, has fixtures, checks expected selectors, detects challenge pages, and fails with `UPSTREAM_FORMAT_CHANGED` or `UPSTREAM_UNAVAILABLE` when structure is not trustworthy. CELLAR legal text is parsed from official XHTML, not search-result HTML.

The public EDPS website currently blocks reliable non-browser retrieval. `search_edps_documents` therefore searches official CELLAR publication metadata restricted to titles identifying the EDPS. It does not scrape EDPS search HTML and does not claim complete EDPS-site coverage.

## Install and run

Requirements: Node.js 20 or newer and npm 11.18 or newer.

```bash
git clone https://github.com/hatt-io/eurmcp.git eu-law-mcp
cd eu-law-mcp
npm ci
npm run build
npm start
```

`npm start` uses stdout only for MCP protocol messages. Diagnostics go to stderr.

The committed `.npmrc` applies a three-day supply-chain cooldown (`min-release-age=3`), disables dependency lifecycle scripts, and disables funding notices. Dependencies are exact-pinned and the lockfile is committed. A newly updated dependency is unavailable to `npm install` until it has aged three days.

Development:

```bash
npm run dev
npm run build
npm run lint
npm run format
```

## Configuration

No keys, accounts, database, Redis, Docker, or cloud service are required.

| Variable                  | Default         | Meaning                                       |
| ------------------------- | --------------- | --------------------------------------------- |
| `EU_LAW_CACHE_DIR`        | `.eu-law-cache` | Filesystem cache directory                    |
| `EU_LAW_CACHE_ENABLED`    | `true`          | Enable local cache                            |
| `EU_LAW_EVIDENCE_ENABLED` | `true`          | Persist authoritative source evidence         |
| `EU_LAW_HTTP_TIMEOUT_MS`  | `30000`         | Per-request timeout, 1000–120000 ms           |
| `EU_LAW_LOG_LEVEL`        | `warn`          | `silent`, `error`, `warn`, `info`, or `debug` |

## MCP tools

All tools are read-only, return `structuredContent`, and publish strict output schemas. Successes and structured errors include `api_version: "1.0"`. Substantive results include provenance.

| Tool                        | Required arguments                   | Optional arguments                                                                                         |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `search_eu_law`             | `query`                              | `language`, `document_type`, `date_from`, `date_to`, `in_force`, `limit`                                   |
| `get_eu_document`           | `identifier`                         | `language`, `version`                                                                                      |
| `get_article`               | `document`, `article`                | `language`, `version`                                                                                      |
| `get_recitals`              | `document`, `recitals`               | `language`, `version`                                                                                      |
| `compare_document_versions` | `document`, `version_a`, `version_b` | `language`, `article`                                                                                      |
| `search_eu_cases`           | at least one search criterion        | `query`, `case_number`, `ecli`, `celex`, `provision`, dates, `court`, `document_type`, `language`, `limit` |
| `get_eu_case`               | `identifier`                         | `language`, `document_type`                                                                                |
| `get_case_paragraphs`       | `case`, `paragraphs`                 | `language`                                                                                                 |
| `find_cases_citing`         | `case`                               | `court`, dates, `language`, `limit`                                                                        |
| `search_edpb_documents`     | `query`                              | `document_type`, `status`, dates, `limit`                                                                  |
| `get_edpb_document`         | `identifier_or_url`                  | `language`                                                                                                 |
| `search_edps_documents`     | `query`                              | `document_type`, dates, `limit`                                                                            |
| `list_document_versions`    | `document`                           | `language`                                                                                                 |
| `get_document_timeline`     | `document`                           | `language`                                                                                                 |
| `get_provision_at_date`     | `document`, `article`, `date`        | `language`                                                                                                 |
| `verify_legal_quote`        | `evidence_id`, `anchor_id`, `quote`  | —                                                                                                          |

Dates use `YYYY-MM-DD`. `recitals` and `paragraphs` accept either an array such as `[42, 43]` or `{ "from": 42, "to": 50 }`. `version` accepts `original`, `current_consolidated`, or an official consolidation date. Search limits are 1–100.

Supported legislation filters are `regulation`, `directive`, `decision`, `recommendation`, `opinion`, `delegated regulation`, `implementing regulation`, and `treaty`. Case courts are `court_of_justice` and `general_court`; case document types are `judgment`, `order`, and `opinion`.

Examples:

```json
{ "document": "32016R0679", "article": "22", "language": "en" }
```

```json
{ "case": "C-300/21", "paragraphs": { "from": 42, "to": 50 }, "language": "sv" }
```

```json
{
  "document": "GDPR",
  "version_a": "original",
  "version_b": "current_consolidated",
  "article": "22",
  "language": "en"
}
```

Whole documents are returned only by `get_eu_document` and `get_eu_case`. Narrow tools return only requested articles, recitals, or judgment paragraphs.

## Identifiers and languages

Deterministic resolution supports CELEX (`32016R0679`), ELI, formal citations (`Regulation (EU) 2016/679`), case numbers (`C-300/21`), case CELEX (`62021CJ0300`), and ECLI (`ECLI:EU:C:2023:370`). Explicit maintained aliases include GDPR, AI Act, DSA, and DMA. Fuzzy selection is never used. Ambiguous maintained mappings return `AMBIGUOUS_IDENTIFIER` with candidates.

All 24 official EU languages are normalized. Tested official retrieval covers English and Swedish. The requested official expression is resolved before content download. No machine translation or language substitution occurs. If a known work lacks the requested expression, the result is `LANGUAGE_NOT_AVAILABLE`.

Original acts and consolidated texts remain distinct. `current_consolidated` queries official CELLAR relationships and picks the latest dated consolidation deterministically. Consolidated output includes its consolidation date. Missing consolidation returns `VERSION_NOT_FOUND`; the original is never silently substituted.

`list_document_versions` reports original and consolidated resources plus language availability; it never substitutes a language. `get_document_timeline` keeps originals, corrigenda, amending acts, and consolidations distinct. `get_provision_at_date` selects the greatest safe official snapshot date not later than the request. A known intervening modification returns `VERSION_NOT_FOUND`, and successful results state `legal_effect_not_inferred: true`.

## Provenance and relationships

Every substantive record identifies publisher, source system, exact source URL, original retrieval timestamp, response hash and byte count, parser identity, snapshot availability, and available CELEX/ELI/ECLI/CELLAR WEMI/language identifiers. Parsed text also includes its normalized-document SHA-256. Example shape:

```json
{
  "publisher": "Publications Office of the European Union",
  "source_system": "CELLAR",
  "source_url": "https://publications.europa.eu/resource/cellar/.../DOC_1",
  "retrieved_at": "2026-08-26T00:00:00.000Z",
  "celex": "62021CJ0300",
  "ecli": "ECLI:EU:C:2023:370",
  "language": "en",
  "evidence_id": "sha256:...",
  "snapshot_available": true,
  "media_type": "application/xhtml+xml",
  "response_sha256": "...",
  "normalized_text_sha256": "...",
  "parser_name": "cellar-official-xhtml",
  "parser_version": "2.0.0",
  "http_status": 200,
  "byte_count": 123456
}
```

Articles, recitals, article paragraphs and points, case paragraphs, and regulator paragraphs carry deterministic `source_anchor` objects. `verify_legal_quote` compares only against the stored anchored text and returns `exact_match`, `normalized_match`, or `no_match`; it never repairs a quote or searches nearby text. Normalized matching uses `legal-text-nfc-whitespace-v1`: Unicode NFC, NBSP and line-ending normalization, whitespace collapse, and trim. Case, punctuation, numbering, and diacritics remain significant.

Case metadata reconciliation reports `verified_cross_system`, `verified_same_system`, `primary_only`, or `conflict`, with field checks and every discrepancy preserved. CURIA failure never blocks exact primary CELLAR retrieval.

Metadata-backed relationships are normalized as `amends`, `amended_by`, `corrects`, `corrected_by`, `implements`, `implemented_by`, `repeals`, `repealed_by`, `consolidates`, and `related_case`. Evidence uses the explicit taxonomy `textual_mention`, `metadata_relation`, `formal_citation`, `operative_reference`, and `authoritative_classification`. Citation lookup uses CELLAR `cdm:work_cites_work`, not word co-occurrence. `case-law_interpretes_resource_legal` is instrument-level classification only; an Article 82 request never becomes an Article 82 interpretation claim.

Version comparison flattens source hierarchy into stable article/paragraph/point locations, normalizes markup and whitespace, then reports deterministic `added`, `removed`, or `modified` entries. It does not generate a legal summary or call formatting-only changes amendments.

## Cache

The filesystem cache implements a small `Cache` abstraction and uses atomic writes. Cache keys include the full query or authoritative item URI, which includes identifier, language, version, manifestation, and format dimensions. Default TTL classes are:

- searches: 15 minutes;
- latest consolidation metadata: 6 hours;
- mutable documents/guidance: 24 hours;
- historical legislation: 30 days;
- immutable judgments: 180 days.

HTTP caches are namespaced under `cache/v2`; cache hits preserve the original receipt timestamp and source headers. Authoritative legal text, judgment XHTML, and regulator source files are stored indefinitely and atomically under `evidence/v1`, content-addressed by SHA-256 with mode `0600`. Search and SPARQL responses remain TTL-cached rather than durably snapshotted. Set `EU_LAW_EVIDENCE_ENABLED=false` to emit hashes with `snapshot_available: false`. Delete `.eu-law-cache` to clear both caches and evidence knowingly. It is not committed.

## Errors

Tool errors set MCP `isError: true` and return a structured object. Codes are:

`DOCUMENT_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `RECITAL_NOT_FOUND`, `CASE_NOT_FOUND`, `PARAGRAPH_NOT_FOUND`, `LANGUAGE_NOT_AVAILABLE`, `AMBIGUOUS_IDENTIFIER`, `VERSION_NOT_FOUND`, `EVIDENCE_NOT_FOUND`, `SOURCE_ANCHOR_NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `UPSTREAM_TIMEOUT`, `UPSTREAM_FORMAT_CHANGED`, `INVALID_IDENTIFIER`, and `INVALID_ARGUMENT`.

Missing provisions are never replaced with nearby source text. Truncated or structurally unexpected material fails explicitly.

## Security

The server exposes no write tool, shell, filesystem browser, arbitrary fetch, or arbitrary SPARQL. Upstream URLs and every redirect must use HTTPS and match an exact authoritative-domain allowlist. IP literals, localhost, embedded credentials, and unlisted domains are rejected. Responses have content-type checks, redirect limits, timeouts, transient retries with exponential backoff, declared and streaming size limits, and a project user-agent. Retrieved HTML/XML is treated as untrusted and parsed without script execution.

## Client setup

Build first with `npm ci && npm run build`. Replace the path below if the repository is elsewhere.

### Codex

CLI:

```bash
codex mcp add eu-law -- node ./dist/index.js
```

Equivalent `~/.codex/config.toml`:

```toml
[mcp_servers.eu-law]
command = "node"
args = ["./dist/index.js"]
cwd = "."
startup_timeout_sec = 20
tool_timeout_sec = 120
```

### Claude Code

Project-scoped CLI configuration:

```bash
claude mcp add --transport stdio --scope project eu-law -- node ./dist/index.js
```

Equivalent `.mcp.json`:

```json
{
  "mcpServers": {
    "eu-law": {
      "type": "stdio",
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "."
    }
  }
}
```

### MCP Inspector

Inspector v2 currently requires Node.js 22.19 or newer even though the server itself supports Node.js 20+.

```bash
npx @modelcontextprotocol/inspector node ./dist/index.js
```

CLI discovery check:

```bash
npx @modelcontextprotocol/inspector --cli node ./dist/index.js --method tools/list
```

## Testing

```bash
npm test
npm run test:live
npm run smoke:mcp
```

`npm test` runs deterministic unit, fixture, evidence-store, parser-registry, normalization, HTTP-receipt, and generated-schema contract tests. `npm run test:live` verifies GDPR exact retrieval and quote checks in English and Swedish, its version timeline and point-in-time retrieval, C-300/21 paragraph 50 evidence, reconciliation, searches, citations, EDPB PDF retrieval, and EDPS metadata. `npm run smoke:mcp` starts the built stdio server through the MCP v2 client and calls all 16 tools, quote mismatch, both evidence errors, and representative existing errors.

Full local verification:

```bash
npm run build
npm run lint
npm run format:check
npm test
npm run test:live
npm run smoke:mcp
```

Live tests depend on official infrastructure and may fail explicitly during upstream outages or format changes. They are intentionally sequential and cached to avoid excessive traffic.

## Known limitations

- CELLAR title full-text search is authoritative but not a semantic search engine. Broad terms can require a larger limit and ranking can change as official records are added.
- CELLAR metadata coverage varies by document type. Fields such as `in_force` are omitted when not supplied.
- CELLAR's currently available GDPR consolidation is dated 2016-05-04; the server reports that source fact without assuming later amendments.
- CURIA and EUR-Lex may deploy browser-facing anti-automation controls. Exact core text therefore uses official CELLAR XHTML manifestations.
- EDPB requires isolated HTML catalogue/page parsing before official PDF retrieval. Selector changes fail closed.
- Direct EDPS site automation is currently unreliable; EDPS search is limited to official CELLAR metadata and may not cover every item on the EDPS website.
- PDF text order follows the EDPB's published PDF encoding. Numbered paragraphs are preserved only when the PDF text itself exposes them reliably.
- A citation relationship proves an official metadata citation link, not the citing court's legal treatment of the cited judgment.

## Contributing

Keep source adapters isolated, centralize new CDM predicates in named query builders, add authoritative fixtures for parser changes, and add a live check for new source behavior. Never add fuzzy legal-identifier selection, machine translation, source-text reconstruction, general web search, arbitrary URL retrieval, or caller-supplied SPARQL. Run the full verification commands before opening a change. See `LICENSE` for the MIT terms.

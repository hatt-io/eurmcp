---
title: Identifiers and Languages
type: reference
status: maintained
tags:
  - eurmcp
  - identifiers
  - languages
---

# Identifiers and Languages

## Recognized identifiers

| Form | Example | Canonical target |
| --- | --- | --- |
| CELEX | `32016R0679` | Same uppercase CELEX |
| ELI | `https://eur-lex.europa.eu/eli/reg/2016/679/oj/` | `http://data.europa.eu/eli/reg/2016/679/oj` |
| Formal citation | `Regulation (EU) 2016/679` | `32016R0679` |
| Explicit alias | `GDPR` | `32016R0679` |
| Case number | `C-300/21` | Canonical case and judgment CELEX |
| Case CELEX | `62021CJ0300` | `C-300/21` |
| ECLI | `ECLI:EU:C:2023:370` | Matching official case work |

Maintained aliases: GDPR, General Data Protection Regulation, AI Act, Digital Services Act, DSA, Digital Markets Act, DMA.

No fuzzy matching silently chooses an instrument. Ambiguous explicit mappings return candidates.

## Language handling

The language registry covers all 24 official EU languages and maps:

- ISO two-letter code.
- CELLAR three-letter authority code.
- ELI language form.
- Common language-name aliases.

Examples:

- `en` → `ENG`.
- `sv` or `sv-SE` → `SWE`.

The requested official expression is resolved before content retrieval. If the work exists but the expression does not, the server returns `LANGUAGE_NOT_AVAILABLE`. It never machine-translates or relabels another language.

## Case century rule

Two-digit case years 00–49 map to 2000–2049. Years 50–99 map to 1950–1999. Court and document-type codes determine the CELEX sector code.

Related: [[03 Internals/Data Contracts]].
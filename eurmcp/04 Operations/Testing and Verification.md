---
title: Testing and Verification
type: operations
status: maintained
tags:
  - eurmcp
  - testing
---

# Testing and Verification

## Deterministic suite

```bash
npm test
```

Covers identifier normalization, aliases, ambiguity, language selection, validation, HTTP security, legislation structure, consolidated structure, recitals, judgment numbering, operative parts, footnote exclusion, EDPB HTML, and upstream format failures.

## Live suite

```bash
npm run test:live
```

Live coverage:

- GDPR Articles 5, 6, 22, 25, and 82 in English.
- GDPR Articles 22 and 82 in Swedish.
- GDPR recital 71.
- Original and current official consolidated metadata.
- Structural version comparison.
- C-300/21 resolution through case number, CELEX, and ECLI.
- Exact English and Swedish judgment paragraphs.
- Paragraph ranges and `PARAGRAPH_NOT_FOUND`.
- Metadata searches for data protection, AI, and GDPR Article 82 cases.
- Official citation relationships.
- EDPB catalogue and official PDF retrieval.
- EDPS official CELLAR metadata.

Tests are sequential and cached to respect upstream services.

## MCP end-to-end suite

```bash
npm run smoke:mcp
```

Starts `dist/index.js` through the MCP v2 stdio client, discovers all tools, calls every valid tool, validates structured output, checks two structured errors, and ensures server diagnostics do not pollute stdout.

## Inspector

```bash
npx @modelcontextprotocol/inspector --cli node ./dist/index.js --method tools/list
```

## Release verification

```bash
npm run build
npm run lint
npm run format:check
npm test
npm run test:live
npm run smoke:mcp
```

Record releases with [[Templates/Verification Record]] and follow [[05 Development/Release Checklist]].
---
title: verify_legal_quote
type: mcp-tool
tool: verify_legal_quote
category: evidence
source: stored authoritative snapshot
scope: anchored quote verification
status: implemented
tags:
  - mcp-tool
  - eurmcp
---

# verify_legal_quote

Compare a quote with one stored source anchor.

## Input

```ts
{
  evidence_id: string;
  anchor_id: string;
  quote: string;
}
```

## Output

The evidence ID, anchor ID, source anchor, normalization identifier, and one result: `exact_match`, `normalized_match`, or `no_match`.

## Rules

- Exact mode compares with the returned normalized source text.
- Normalized mode uses `legal-text-nfc-whitespace-v1`.
- The tool never repairs a quote or searches a nearby provision.
- Unknown evidence and anchors return `EVIDENCE_NOT_FOUND` and `SOURCE_ANCHOR_NOT_FOUND`.
- Caller-supplied URLs, selectors, XPath, and filesystem paths are not accepted.

## Implementation

Registration: `src/tools/verifyLegalQuote.ts`. Verification and storage are in `src/evidence/store.ts`.

Back to [[02 Reference/MCP Tools]].

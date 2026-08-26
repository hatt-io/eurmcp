---
title: Getting Started
type: guide
status: maintained
tags:
  - eurmcp
  - user-guide
---

# Getting Started

## Purpose

Use eu-law-mcp when an MCP client needs exact, source-grounded EU legislation, provisions, recitals, court paragraphs, citation relationships, official versions, EDPB guidance, or EDPS publication metadata.

## Requirements

- Node.js 20 or newer.
- npm 11.18 or newer.
- Network access to official EU domains.
- No API keys, accounts, Redis, database, Docker, or cloud service.

## Install

```bash
git clone https://github.com/hatt-io/eurmcp.git eu-law-mcp
cd eu-law-mcp
npm ci
npm run build
```

The committed `.npmrc` enforces a three-day package release cooldown, exact lockfile installation, and disabled dependency lifecycle scripts.

## Run

```bash
npm start
```

The server speaks MCP on stdout. Diagnostics belong on stderr.

## First retrievals

Retrieve GDPR Article 22:

```json
{"document":"32016R0679","article":"22","language":"en"}
```

Retrieve Swedish judgment paragraphs:

```json
{"case":"C-300/21","paragraphs":{"from":42,"to":50},"language":"sv"}
```

Compare official versions:

```json
{"document":"GDPR","version_a":"original","version_b":"current_consolidated","article":"22","language":"en"}
```

## Retrieval discipline

1. Search with a search tool.
2. Resolve the exact CELEX, ELI, ECLI, or case number.
3. Use a narrow retrieval tool where possible.
4. Cite returned identifiers and provenance.
5. Treat missing material as missing. Never substitute nearby text.

See [[02 Reference/MCP Tools]] and [[03 Internals/Data Contracts]].


Back to [[Home]].

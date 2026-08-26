# eu-law-mcp

Read-only MCP server for exact retrieval of authoritative EU legislation, case law, and regulator material. Results include official identifiers, provenance, durable evidence, and source anchors.

[Documentation](https://hatt-io.github.io/eurmcp/)

## Install

Requires Node.js 20+ and npm 11.18+.

```bash
git clone https://github.com/hatt-io/eurmcp.git eu-law-mcp
cd eu-law-mcp
npm ci
npm run build
```

## Launch

From the cloned repository root, configure a stdio MCP client to run:

```bash
node dist/index.js
```

The server provides 16 read-only tools for:

- legislation search and exact document, article, and recital retrieval;
- official versions, timelines, point-in-time provisions, and structural diffs;
- case search, exact judgments and paragraphs, and citation relationships;
- EDPB and EDPS material;
- anchored quote verification against stored official evidence.

See the [MCP tool reference](https://hatt-io.github.io/eurmcp/02%20Reference/MCP%20Tools.html) for inputs, outputs, and client setup.

## Verify

```bash
npm run verify
```

Live official-source tests are opt-in:

```bash
npm run test:live
```

## License

MIT

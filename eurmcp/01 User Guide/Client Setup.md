---
title: Client Setup
type: guide
status: maintained
tags:
  - eurmcp
  - mcp
  - configuration
---

# Client Setup

Build the server before configuring a client:

```bash
cd .
npm ci
npm run build
```

## Codex

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

## Claude Code

```bash
claude mcp add --transport stdio --scope project eu-law -- node ./dist/index.js
```

Equivalent project `.mcp.json`:

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

## MCP Inspector

Inspector v2 requires Node.js 22.19 or newer.

```bash
npx @modelcontextprotocol/inspector node ./dist/index.js
```

CLI discovery:

```bash
npx @modelcontextprotocol/inspector --cli node ./dist/index.js --method tools/list
```

## Troubleshooting

- No response: run `npm run build` and confirm `dist/index.js` exists.
- Protocol parse errors: ensure nothing writes logs to stdout.
- Timeout: increase the client tool timeout or `EU_LAW_HTTP_TIMEOUT_MS`.
- Official source outage: inspect the structured upstream error. Do not retry aggressively.
- Stale data: remove `.eu-law-cache` or disable cache temporarily.

See [[02 Reference/Configuration]] and [[04 Operations/Testing and Verification]].
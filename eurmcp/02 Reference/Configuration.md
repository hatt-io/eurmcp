---
title: Configuration
type: reference
status: maintained
tags:
  - eurmcp
  - configuration
---

# Configuration

The basic server needs no secrets or external infrastructure.

| Variable | Default | Constraint | Purpose |
| --- | --- | --- | --- |
| `EU_LAW_CACHE_DIR` | `.eu-law-cache` | Writable directory | Local filesystem cache |
| `EU_LAW_CACHE_ENABLED` | `true` | Boolean | Enable or disable cache |
| `EU_LAW_HTTP_TIMEOUT_MS` | `30000` | 1000–120000 | Per-request timeout |
| `EU_LAW_LOG_LEVEL` | `warn` | silent, error, warn, info, debug | Diagnostic verbosity |

## Example

```bash
EU_LAW_CACHE_DIR=.eu-law-cache EU_LAW_HTTP_TIMEOUT_MS=60000 npm start
```

## Package security policy

The root `.npmrc` contains:

```ini
min-release-age=3
ignore-scripts=true
fund=false
```

The release-age gate is measured in days. Exact dependency versions and `package-lock.json` make installation deterministic.

## Configuration implementation

- `src/config.ts` validates environment values.
- Invalid values throw `INVALID_ARGUMENT`.
- Cache paths are resolved before use.
- No configuration option expands the upstream domain allowlist.

Related: [[04 Operations/Security and Caching]].
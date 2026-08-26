---
title: Security and Caching
type: operations
status: maintained
tags:
  - eurmcp
  - security
  - caching
---

# Security and Caching

## Read-only boundary

The server exposes no shell, write operation, arbitrary filesystem operation, arbitrary URL fetch, HTTP proxy, or caller-supplied SPARQL.

## HTTP controls

The shared HTTP client enforces:

- HTTPS only.
- Exact official-domain allowlist.
- Redirect validation on every hop.
- Rejection of localhost, IP literals, and embedded credentials.
- Per-request timeout.
- Retry only for transient failures.
- Exponential backoff.
- Content-type validation.
- Declared and streaming response-size limits.
- Maximum redirect count.
- Project user-agent.

Remote HTML and XML are parsed as untrusted content without script execution.

## Cache interface

```ts
type Cache = {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
};
```

Implementations:

- `NullCache`: disabled cache behavior.
- `FileCache`: SHA-256 keys, private file permissions, atomic staging and rename.

## TTL classes

| Material | TTL |
| --- | --- |
| Search | 15 minutes |
| Latest consolidation metadata | 6 hours |
| Mutable document or guidance | 24 hours |
| Historical legislation | 30 days |
| Immutable judgment | 180 days |

Cache keys contain full queries or authoritative item URIs, preserving identifier, language, version, manifestation, format, and filters.

## Operations

Force fresh data:

```bash
rm -r .eu-law-cache
```

Or disable cache for one run:

```bash
EU_LAW_CACHE_ENABLED=false npm start
```

Do not disable upstream protections or add unofficial fallback sources to conceal an official outage.


Related: [[03 Internals/Architecture]] and [[Home]].
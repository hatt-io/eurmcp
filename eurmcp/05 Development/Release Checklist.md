---
title: Release Checklist
type: checklist
status: maintained
tags:
  - eurmcp
  - release
---

# Release Checklist

## Source integrity

- [ ] CDM predicates are verified against official documentation and live responses.
- [ ] New legal text comes from an official language manifestation.
- [ ] Article, recital, and paragraph boundaries use source structure.
- [ ] Missing material produces typed errors.
- [ ] Search evidence does not overclaim interpretation.
- [ ] Provenance is present on every substantive result.

## Engineering

- [ ] Dependencies are exact-pinned and outside the three-day cooldown.
- [ ] `package-lock.json` is synchronized.
- [ ] TypeScript compilation passes.
- [ ] ESLint passes.
- [ ] Prettier check passes.
- [ ] Unit and fixture tests pass.
- [ ] Live integration tests pass.
- [ ] MCP smoke calls every tool successfully.
- [ ] Representative structured errors pass.
- [ ] MCP Inspector lists the expected tools.
- [ ] stdout contains only MCP protocol traffic.

## Documentation

- [ ] README matches runtime behavior.
- [ ] [[02 Reference/MCP Tools]] includes every tool.
- [ ] [[02 Reference/Function Index]] matches exported code.
- [ ] [[03 Internals/Source Adapters]] records parsing.
- [ ] Client configurations are current.

## Release record

Create a note from [[Templates/Verification Record]] and link it from the relevant release or change note.


## Verification records

- [[05 Development/Verification Records/eu-law-mcp 0.2.0]]
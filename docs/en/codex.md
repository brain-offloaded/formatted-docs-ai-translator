# Codex Configuration Guide

This document explains where Codex-related configuration belongs in this repository, what is committed to the repo, and what remains a user-level concern.

## Why this repo uses both `.codex` and `AGENTS.md`

Based on the official Codex documentation, each surface has a separate role:

- `AGENTS.md`: durable repository rules such as verification order, review expectations, and project conventions
- `.codex/config.toml`: project-local execution defaults such as sandbox and approval behavior
- `hooks`: mechanical enforcement only when repeated mistakes justify extra friction
- `.agents/skills`: repeatable repository-specific workflows

This repository already keeps most project conventions in `AGENTS.md`, so `.codex/config.toml` is intentionally minimal.

## Current project-local Codex settings

`.codex/config.toml`

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
```

Why these defaults:

- `on-request`: pauses only for actions that are genuinely worth a review, such as branch creation, commits, pushes, packaging, or GUI runs
- `workspace-write`: allows normal code and doc edits while still keeping broader access constrained
- `network_access = false`: the default repo verification loop is local (`yarn lint`, `yarn test`, `yarn build`), so outbound network access stays opt-in

## Operating rules Codex should follow in this repository

These rules live in `AGENTS.md`.

- Preferred verification order is `yarn lint` -> `yarn test` -> `yarn build`
- `yarn dev`, `yarn dev:watch`, and direct Electron runs are reserved for tasks that explicitly need GUI verification
- The local execution baseline is `volta.node` in `package.json`, currently `22.14.0`
- `translation-cache.db` should not be created, deleted, or reset unless the task explicitly requires data-flow work
- Prisma schema work should make an explicit decision about `yarn exec prisma db pull` and `yarn exec prisma generate`

Because this repo mixes Electron, Prisma, and native modules, Codex should avoid widening routine maintenance tasks into GUI or database work without a clear reason.

## Settings intentionally kept out of the repo

These are better treated as user-level or stronger automation concerns and are not committed here:

- model choice, reasoning effort, provider, and auth settings
- OpenAI base URLs, tokens, or MCP credentials
- personal notification, telemetry, or TUI preferences
- repo-local hook scripts

Hooks in particular add trust-review overhead, so they should only be introduced after repeated failures justify mechanical enforcement.

## Repo-specific maintainer workflow

The repository keeps a Codex maintainer workflow in `.agents/skills/oss-maintainer-codex`.

That skill is meant to show that Codex is part of real OSS maintenance work here, including:

- PR and issue writeups
- verification and release checks
- Codex documentation updates
- narrow, conservative handling around Electron, Prisma, and translation cache behavior

## Expansion guidelines

1. If repository rules need to become clearer, update `AGENTS.md` first.
2. If project-wide execution defaults need to change, update `.codex/config.toml`.
3. If repeated mistakes need mechanical enforcement, add `.codex/hooks.json` or hook scripts.
4. If repeatable repo workflows grow, add or extend `.agents/skills`.

## References

- Codex manual: project `.codex/config.toml`
- Codex manual: `AGENTS.md`
- Codex manual: customization
- Codex manual: hooks

# Electron Packaging Optimization Guide

## Overview

This project uses an optimized build and packaging setup to reduce Electron packaging time dramatically.

**Measured improvements**
- Before: about 2 minutes 20 seconds
- After optimization, first run: 33 seconds (76% reduction)
- After optimization, cached run: 20 seconds (86% reduction)

## Commands

### Fast local packaging

```bash
yarn package:linux
yarn package:win
```

### Distribution packaging

```bash
yarn package:linux:dist
yarn package:win:dist
```

## Optimization Techniques

### 1. Automatic dependency sync

**Problem:** in a Yarn workspace, `electron-builder` only recognizes dependencies declared in the root `package.json`.

**Solution:** automatically sync runtime dependencies from `apps/backend/package.json` into the root packaging context through `scripts/prepare-package-optimized.mjs`.

That means new runtime packages only need to be added in `apps/backend/package.json`.

### 2. Selective `node_modules` copying

Optimizations include:

- fast copying with `rsync`
- excluding dev dependencies such as ESLint, Prettier, and TypeScript
- copying only the required production footprint

Excluded package groups include:

- `.cache`, `.bin`
- `turbo`, `electron`, `electron-builder`
- `eslint*`, `prettier`, `typescript`
- `jest`, `@jest`, `nodemon`, `concurrently`
- `@nestjs/cli`, `@nestjs/testing`
- `webpack*`, `@babel`

### 3. Timestamp-based caching

How it works:

- if staging `node_modules` is newer than the root copy, the copy step is skipped
- first run performs the copy
- later runs reuse the cache

Cache invalidation happens when:

- `yarn install` runs
- `node_modules` changes

### 4. Build setting optimization

```json
{
  "npmRebuild": false,
  "nodeGypRebuild": false,
  "buildDependenciesFromSource": false,
  "asar": {
    "smartUnpack": false
  }
}
```

### 5. Separate local and distribution packaging

**Local (`--dir`)**
- skips ZIP compression
- can run directly from `release/linux-unpacked/`

**Distribution**
- creates ZIP or installer outputs
- intended for CI/CD and releases

## Directory Layout

```text
apps/
  backend/
    app/
      dist/
      node_modules/
      package.json
      index.html
release/
  linux-unpacked/
  formatted-docs-ai-translator-0.1.1.zip
```

## Troubleshooting

### If the `node_modules` cache is the problem

```bash
rm -rf apps/backend/app
yarn package:linux
```

### If dependencies do not appear correctly

```bash
cat apps/backend/package.json | grep "new-package"
rm -rf apps/backend/app
yarn package:linux
```

### If packaging fails

```bash
yarn clean
rm -rf apps/backend/app release
yarn build
yarn package:linux
```

## Recommended CI/CD Setup

```yaml
- name: Package Application
  run: yarn package:linux:dist

- name: Cache Staging
  uses: actions/cache@v3
  with:
    path: apps/backend/app/node_modules
    key: staging-node-modules-${{ hashFiles('yarn.lock') }}
```

## Possible Future Improvements

1. **pnpm**: use `nodeLinker: pnpm` to reduce disk usage through symlinks
2. **esbuild bundling**: reduce `dist/` size further
3. **Prebuilt native modules**: reduce rebuild time for packages such as `better-sqlite3`

## References

- Electron Builder: https://www.electron.build/
- Yarn Workspaces: https://yarnpkg.com/features/workspaces

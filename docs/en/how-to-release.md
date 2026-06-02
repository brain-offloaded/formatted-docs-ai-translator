# Release Process Guide

This document explains the GitHub Flow based release process for Formatted Docs AI Translator.

## Branch Strategy

The project uses the following strategy:

- `main`: the deployable default branch
- `feature/*`, `fix/*`, and similar branches: short-lived working branches

Long-lived release branches such as `develop` or `release/*` are not used.

## Release Procedure

### 1. Prepare release changes and merge them into `main`

Create a working branch from `main`, update the version and changelog, and merge the result back through a pull request.

```bash
# Sync main
git checkout main
git pull origin main

# Create a working branch
git checkout -b chore/release-v1.2.3

# Update the version
yarn version:set 1.2.3

# Update CHANGELOG.md, then commit
git add package.json CHANGELOG.md
git commit -m "chore: release v1.2.3"
git push origin chore/release-v1.2.3
```

Once the PR is created and CI passes, merge it into `main`.

### 2. Publish the release tag

Tags are created manually from the release commit on `main`.

```bash
git checkout main
git pull origin main

# Check whether the tag already exists
git tag -l "v1.2.3"

# Create and push the tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

### 3. Trigger GitHub Actions manually

1. Open the repository's **Actions** tab
2. Select the **Package (Windows ZIP)** workflow
3. Click **Run workflow**
4. Enter `v1.2.3` in the `release_tag` input and run it

The workflow:

- validates the tag format (`vX.Y.Z`)
- verifies that the remote tag exists
- builds the Windows ZIP from the tagged commit
- creates a Draft Release automatically if one does not already exist
- uploads the artifact to the release assets with `--clobber`

### 4. Review the draft release and publish it

1. Open **Releases** in the repository
2. Find the draft release for `v1.2.3`
3. Review the notes and attached files
4. Click **Publish release**

## Re-run Guide

- Re-running the workflow with the same tag overwrites the assets because `--clobber` is used.
- If the tag does not exist, the workflow fails. Run `git push origin vX.Y.Z` first.

## Versioning Rules

The project follows [Semantic Versioning](https://semver.org/):

- **Major**: incompatible API changes
- **Minor**: backward-compatible feature additions
- **Patch**: backward-compatible bug fixes

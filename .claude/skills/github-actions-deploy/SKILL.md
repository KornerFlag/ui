---
name: github-actions-deploy
description: Use when deploying to GitHub Pages, writing GitHub Actions workflows, setting up CI/CD pipelines, asking about gh-pages branch, deploy-pages action, peaceiris, workflow triggers, artifact caching, Pages 403 errors, .nojekyll, or planning any static site deployment. Also use when planning Phase 3 (Site Scaffold) or any frontend hosting step.
---

# GitHub Actions Deploy — GitHub Pages CI/CD Skill

## Overview

Two deployment models (peaceiris push-to-branch vs official deploy-pages API), correct permissions block, static-site-specific gotchas (.nojekyll, large files to Releases), and ready-to-use workflow template in `references/pages-deploy.yml`.

---

## Two Deployment Approaches

### Option A — `peaceiris/actions-gh-pages` (simpler, battle-tested)
Pushes build output to a `gh-pages` branch. Works everywhere, no extra repo settings needed.

```yaml
- uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist          # or ./docs, ./site, ./public
    publish_branch: gh-pages
```

**Use when:** simple push-to-branch model, no PR previews needed, fastest setup.

### Option B — `actions/deploy-pages` (GitHub-native, newer)
Uses the official Pages API. Requires `environment: github-pages` and the permissions block.

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist
- uses: actions/deploy-pages@v4
  id: deployment
```

**Use when:** you want the official Pages environment badge, deployment URL in PR, or org policy requires it.

---

## CRITICAL: Permissions Block (Option B only)

**The #1 Pages deployment gotcha.** Without this block, `deploy-pages` fails with a cryptic 403.

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

# Must also set concurrency to prevent race conditions:
concurrency:
  group: pages
  cancel-in-progress: false
```

Place `permissions` at the **job level**, not workflow level, when you have other jobs that need write access to contents.

---

## Standard Trigger Patterns

### Push to main (most common)
```yaml
on:
  push:
    branches: [main]
```

### Push to main + manual dispatch
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:       # allows manual "Run workflow" button in GitHub UI
```

### Only when specific paths change (recommended for data-driven sites)
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'data/**'          # rebuild when manifest.json or data files change
      - 'site/**'          # rebuild when site source changes
      - '.github/workflows/deploy.yml'
  workflow_dispatch:
```

### PR previews (advanced — needs separate cleanup workflow)
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

---

## Artifact Caching Patterns

### Cache pip dependencies
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

### Cache node_modules
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### Pass build artifacts between jobs (Option B pattern)
```yaml
jobs:
  build:
    steps:
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist        # upload build output as artifact

  deploy:
    needs: build             # deploy job waits for build job
    steps:
      - uses: actions/deploy-pages@v4
```

---

## Static Site (No Framework) Specifics

### .nojekyll — MANDATORY for underscored paths
GitHub Pages runs Jekyll by default and **ignores files/folders starting with `_`**. Always add `.nojekyll`:

```yaml
- name: Disable Jekyll
  run: touch dist/.nojekyll   # or your publish_dir
```

Or create the file at repo root if deploying from `docs/` or `/`.

### No build step needed — just copy files
```yaml
- name: Prepare site
  run: |
    mkdir -p dist
    cp -r site/* dist/         # copy HTML/CSS/JS
    cp data/manifest.json dist/data/manifest.json
    touch dist/.nojekyll
```

### Assets from GitHub Releases (large files pattern)
Never bundle large files (videos, large images) into the Pages deploy — the 1 GB repo size limit applies. Instead:
- Upload large files to GitHub Releases: `gh release upload tag file.mp4`
- Reference them via CDN URL in manifest.json: `https://github.com/{owner}/{repo}/releases/download/{tag}/{file}`
- Keep only small data files (JSON, small PNGs < 5 MB) in the repo/Pages deploy

---

## Common YAML Pitfalls

| Pitfall | Fix |
|---------|-----|
| `pages: write` missing → 403 on deploy | Add full permissions block (see above) |
| Jekyll stripping `_` folders | Add `.nojekyll` to publish dir |
| Workflow runs but Pages URL still shows old content | Check repo Settings → Pages → Source is set to `gh-pages` branch (or `GitHub Actions`) |
| `upload-pages-artifact` and `deploy-pages` in same job | Must be separate jobs — upload in `build`, deploy in `deploy` with `needs: build` |
| Token expired during long builds | Use `GITHUB_TOKEN` not a PAT for Pages; it auto-refreshes |
| Concurrent deploys clobber each other | Add `concurrency: group: pages, cancel-in-progress: false` |
| `workflow_dispatch` not showing in UI | Workflow file must be on the default branch (main) |
| `peaceiris` v3 → v4 breaking change | v4 requires Node 20; update `actions/checkout` to v4 too |

---

## Repository Settings Checklist

Before the workflow runs, confirm in repo **Settings → Pages**:
- [ ] Source: **GitHub Actions** (for Option B) OR **Deploy from branch: gh-pages** (for Option A)
- [ ] For Option A: branch `gh-pages` must exist (first deploy creates it)
- [ ] Custom domain (optional): set CNAME file in publish dir

---

## References

- `references/pages-deploy.yml` — ready-to-use workflow for this project (Option A, vanilla static site)
- [GitHub Pages docs](https://docs.github.com/en/pages)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)

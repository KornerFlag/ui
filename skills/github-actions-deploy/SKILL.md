---
name: github-actions-deploy
description: Use when the user mentions deployment, GitHub Pages, CI/CD, GitHub Actions, workflows, publish to Pages, deploy static site, or asks about peaceiris/actions-gh-pages, actions/deploy-pages, workflow triggers, artifact caching, or YAML workflow configuration.
version: 1.0.0
---

# GitHub Actions Deploy

## Overview

Covers GitHub Pages deployment via Actions — both the legacy `peaceiris/actions-gh-pages` action and the modern `actions/deploy-pages` approach — plus caching, triggers, and common YAML pitfalls.

---

## Approach A: Modern (actions/deploy-pages) — Recommended

Requires three jobs: `build`, `upload-artifact`, `deploy`. Used by GitHub's own starter workflows since 2023.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build site
        run: |
          mkdir -p _site
          cp -r . _site   # or your actual build command
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**REQUIRED: permissions block** (see Permissions Gotcha below).

---

## Approach B: Legacy (peaceiris/actions-gh-pages)

Simpler — pushes built output directly to `gh-pages` branch. Still widely used and works fine.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist   # or wherever your built files are
```

No separate permissions block needed (uses `GITHUB_TOKEN` implicitly), but the repo must have GitHub Pages enabled and pointing to the `gh-pages` branch.

---

## Permissions Gotcha (actions/deploy-pages only)

**This is the #1 cause of deploy failures.** The `actions/deploy-pages` action requires explicit permissions at the workflow level:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write   # REQUIRED — without this, deployment silently fails or 403s
```

Place this **at the top level** of the workflow file (not inside a job). If you put it inside the `deploy` job only, the `build` job may lack `contents: read` and fail to checkout.

Also enable Pages in repo Settings → Pages → Source: **GitHub Actions** (not a branch).

---

## Workflow Triggers

```yaml
on:
  push:
    branches: [main]          # Deploy on merge to main

  workflow_dispatch:           # Manual deploy button in Actions UI
    inputs:
      reason:
        description: "Why are you deploying manually?"
        required: false

  pull_request:                # PR preview (combine with env-based URLs)
    branches: [main]
```

**PR preview pattern:** Deploy to a unique path per PR using `${{ github.event.pull_request.number }}`:

```yaml
# Combine with a comment-bot to post the preview URL back to the PR
publish_dir: ./dist
destination_dir: pr-${{ github.event.pull_request.number }}
```

Only works cleanly with `peaceiris/actions-gh-pages` (supports `destination_dir`). The modern `actions/deploy-pages` deploys to root only.

---

## Caching Build Outputs

For vanilla HTML/JS/CSS with no build tool, caching is usually unnecessary. For sites with npm/bundlers:

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-

- run: npm ci
- run: npm run build
```

**Key insight:** Use `hashFiles('**/package-lock.json')` not `package.json` — lockfile changes mean dependency changes. Cache miss is safe; cache hit skips `npm ci` entirely.

---

## Static Site (Vanilla HTML/JS/CSS) — No Build Step

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # No build step needed — serve the repo root directly
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .            # or ./public, ./docs, etc.
      - id: deployment
        uses: actions/deploy-pages@v4
```

Ensure `.gitignore` doesn't exclude files needed in production (e.g., don't ignore `*.js` if you have no bundler).

---

## Common YAML Pitfalls

| Pitfall | Fix |
|---------|-----|
| Tabs instead of spaces | YAML requires spaces only — use 2-space indent |
| `on:` parsed as `true` by some YAML parsers | Quote it: `"on":` or just be aware it works in Actions |
| `needs: build` job name mismatch | Job name in `needs:` must exactly match the job key |
| `pages: write` permission missing | Add to top-level `permissions:` block |
| Pages source set to branch, not Actions | Settings → Pages → Source → **GitHub Actions** |
| `upload-pages-artifact` path has trailing slash | Use `path: _site` not `path: _site/` |
| Concurrency not set, parallel deploys race | Add concurrency group (see template) |
| `workflow_dispatch` without `push` trigger | Manual deploys won't happen automatically |

---

## Quick Reference

| Task | Action to use |
|------|---------------|
| Deploy to Pages (modern) | `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` |
| Deploy to Pages (simple) | `peaceiris/actions-gh-pages@v4` |
| Cache npm | `actions/cache@v4` with `hashFiles('**/package-lock.json')` |
| Manual trigger | `workflow_dispatch` in `on:` |
| PR preview | `peaceiris` with `destination_dir: pr-${{ github.event.pull_request.number }}` |

---

## See Also

- `references/pages-workflow.yml` — complete copy-paste workflow template (modern approach)

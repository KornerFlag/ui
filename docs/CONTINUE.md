# Continue Here — UI / Site Lane

> Living handoff note. Update the date and the "Next up" list whenever you stop
> mid-thread. Scope: Achyuta's UI / site / storage work. Last updated **2026-07-18**.

## TL;DR

The Cloudflare R2 media migration is **done and live in production**. The landing
site's heavy media (2 demo clips + 4 landing WebPs) now serves from R2, not the
git repo. Nothing is broken or half-finished. Pick the next thread from
"Next up" below.

## What's live right now

- **Site:** https://kornerflag.github.io/ui/ — auto-deploys from `main` via
  `.github/workflows/deploy.yml` (GitHub Pages, `withastro/action`).
- **Hero:** `EditorialHero.astro` (coded animated match-sim hero). This is the
  current hero — see the note on `bg-video` below.
- **R2:** public bucket `kornerflag-site-assets` on its `r2.dev` URL. The 4
  landing images + 2 demo clips resolve from R2 and return `200` in prod
  (verified 2026-07-17). Two private buckets (`kornerflag-footage`,
  `kornerflag-outputs`) are provisioned but empty.
- **Last merged:** PR #3 (`feat/bg-video` → `main`, merge commit `e9510fd`).

## How the R2 wiring works (so you don't re-learn it)

- `r2Asset(path)` in `site/src/lib/site.ts` prefixes `PUBLIC_R2_ASSETS_URL`.
- That env var is set in **two** places and both must stay in sync:
  1. `site/.env` (local dev — gitignored, not committed).
  2. GitHub repo **Variable** `PUBLIC_R2_ASSETS_URL` (CI/prod), consumed by
     `deploy.yml`. Set/update with `gh variable set PUBLIC_R2_ASSETS_URL --body <url> --repo KornerFlag/ui`.
- **Gotcha:** if the var is missing at build time, `r2Asset()` silently emits
  broken root-relative paths — the build stays green but assets 404. This bit us
  once; the CI wiring in `deploy.yml` is the fix. Don't remove it.
- Upload new public assets with:
  `npx wrangler r2 object put kornerflag-site-assets/<key> --file <path>`
  (key layout: `/video/hero/`, `/video/demo/`, `/images/landing/`).
- Demo video URLs are hardcoded (absolute) in `site/public/data/manifest.json` —
  they bypass `r2Asset()`. If the bucket URL ever changes, update manifest.json
  **and** both env locations.

## First thing after checking this out

Your local `main` was stale during the R2 work. Sync it:

```bash
git checkout main && git pull origin main
```

## Cleanup owed (small, do first)

- **`site/public/video/README.md` is stale.** It documents a `BgVideo.astro`
  component and a `/proto/bg-video/` page that were **deleted** in the editorial
  redesign (`cd038d3`). Either delete the README or rewrite it if bg-video is
  revived (see below). Right now it points readers at files that don't exist.
- **Branch naming:** `feat/bg-video` is named for the abandoned background-video
  feature but has been reused as an integration branch (PRs #2 and #3 both came
  off it). Consider cutting fresh `feat/<thing>` branches per task instead of
  reusing this one, per the CLAUDE.md branch convention.

## Next up (pick one)

1. **Background-video hero (the branch's original idea, currently un-built).**
   - Status: `EditorialHero` replaced it. `/video/hero/` in R2 is empty; no
     Higgsfield clip has been generated.
   - To revive: generate a seamless 8–20s loop (Higgsfield), upload to
     `kornerflag-site-assets/video/hero/hero-bg.mp4`, rebuild a `BgVideo.astro`
     component that pulls it via `r2Asset("video/hero/hero-bg.mp4")`, and decide
     whether it replaces or layers behind `EditorialHero`. **This needs a demo-
     flow decision first** (does the investor demo lead with a cinematic bg video
     or the live match-sim hero?) — that's a Krish/team call, currently a blocker.

2. **R2 production hardening.**
   - `r2.dev` URLs are rate-limited and Cloudflare doesn't recommend them for
     sustained traffic. If the investor demo will get real traffic, onboard a
     custom domain to Cloudflare and repoint `PUBLIC_R2_ASSETS_URL`. See
     `docs/decisions/0001-cloudflare-r2-storage.md`.

3. **Investor-demo UI polish** (Achyuta's stated priority). Match room
   (`site/src/pages/room.astro`) and clip pages are the demo surface — audit
   them against `WEBSITE-DESIGN-RULES.md` and `docs/UI-GUIDELINES.md`.

4. **Outreach / payments** — outreach is active (NC State follow-up, Krish
   driving); payment setup is deferred until post-demo per CLAUDE.md.

## Cross-lane (not UI, but tracked here so it's not lost)

- Private buckets `kornerflag-footage` / `kornerflag-outputs` are provisioned but
  **not wired to the CV pipeline**. That's Krish/Osman's lane — the decision doc
  (`docs/decisions/0001-cloudflare-r2-storage.md`) documents exactly how to mint
  the scoped API token when they're ready.

## Key files

| Path | What |
|---|---|
| `site/src/lib/site.ts` | `r2Asset()` + other URL/format helpers |
| `.github/workflows/deploy.yml` | Pages deploy; injects `PUBLIC_R2_ASSETS_URL` |
| `site/src/components/landing/EditorialHero.astro` | Current hero |
| `site/public/data/manifest.json` | Demo clip metadata (absolute R2 video URLs) |
| `docs/decisions/0001-cloudflare-r2-storage.md` | R2 decision + token instructions |
| `docs/superpowers/plans/2026-07-16-cloudflare-r2-storage.md` | R2 plan (complete) |

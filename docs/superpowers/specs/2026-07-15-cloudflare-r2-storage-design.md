# Cloudflare R2 storage for Korner Flag

Date: 2026-07-15
Status: Approved

## Problem

Heavy media (hero/background video, demo match-preview clips, landing WebP
images) is currently committed to git under `site/public/` and shipped through
the GitHub Pages build. This bloats the repo and the Pages deploy, and there's
no storage plan yet for the raw match footage the CV pipeline ingests or the
JSON/heatmap outputs it produces (per CLAUDE.md, Osman's formation-detection
work consumes that pipeline JSON, and video storage on Cloudflare R2 is
already earmarked in the work split).

## Buckets

| Bucket | Access | Contents |
|---|---|---|
| `kornerflag-site-assets` | Public (r2.dev URL) | Hero/background video, demo preview clips, landing images |
| `kornerflag-footage` | Private | Raw match footage the CV pipeline ingests |
| `kornerflag-outputs` | Private | Pipeline JSON/heatmap outputs |

No custom domain yet — the site has no domain beyond `kornerflag.github.io/ui`,
so the public bucket uses its `r2.dev` URL. Revisit if/when a custom domain is
onboarded to Cloudflare (would give proper cache/rate-limit control).

## Video format spec (site-assets)

| Use case | Codec/container | Resolution | Size cap | Notes |
|---|---|---|---|---|
| Hero background loop | MP4 (H.264, yuv420p) primary, WebM (VP9) optional | 1920×1080 (2560×1440 for large screens) | ≤6MB | Seamless loop (first/last frame match), no audio, muted autoplay |
| Poster frame | JPG or WebP | matches video | ≤150KB | Shown pre-load and for `prefers-reduced-motion` |
| Demo/match preview clips | MP4 (H.264) | source resolution, capped 1920×1080 | ≤15MB | Covers `08fd33_4_preview.mp4`, `nc_state_stats_preview.mp4` |

Naming: kebab-case, descriptive — `hero-bg.mp4`, `hero-bg-poster.jpg`,
`match-preview-<slug>.mp4`.

Bucket key layout:
```
/video/hero/
/video/demo/
/images/landing/
```

## Image format spec (site-assets)

- WebP for all landing/photography assets (already the site convention) —
  quality ~80, longest edge ≤2400px, target ≤500KB per file.
- SVG for icons/logos; raster PNG only when SVG isn't viable.
- No JPG fallback — WebP has universal modern browser support, skip the extra
  asset per YAGNI.

## Access & credentials

- Two scoped R2 API tokens (S3-compatible):
  - `kornerflag-site-assets-deploy` — Object Read & Write, `kornerflag-site-assets` only.
  - `kornerflag-pipeline` — Object Read & Write, `kornerflag-footage` + `kornerflag-outputs`.
- Credentials live in `.env` (already gitignored). A `.env.example` template is
  committed with the variable names, no values.
- CORS on `kornerflag-site-assets`: `GET` only, allowed origins
  `https://kornerflag.github.io` and `http://localhost:*`.

## Site integration

- New env var `PUBLIC_R2_ASSETS_URL` (the bucket's public r2.dev base URL).
- `EditorialHero.astro`, `VideoPlayer.astro`, and any other component
  referencing `site/public/video/*`, `site/public/data/*.mp4`, or
  `site/public/images/landing/*.webp` build their asset URLs from
  `PUBLIC_R2_ASSETS_URL` instead of local relative paths.
- Heavy files move out of `site/public/` into the bucket:
  - `site/public/data/08fd33_4_preview.mp4` → `/video/demo/08fd33_4_preview.mp4`
  - `site/public/data/nc_state_stats_preview.mp4` → `/video/demo/nc_state_stats_preview.mp4`
  - `site/public/images/landing/*.webp` → `/images/landing/*.webp`
- Small/critical assets (favicon, tiny UI icons) stay local — only heavy media
  moves.

## Explicitly out of scope

- Migrating actual raw match footage or pipeline outputs — `data/` is
  currently empty locally (raw footage/output_videos are already gitignored,
  kept off-repo). `kornerflag-footage` and `kornerflag-outputs` are
  provisioned and documented, not populated. Wiring the CV pipeline to read
  from / write to them is Krish's lane per the CLAUDE.md work split — a
  short `docs/decisions/` note documents the convention so that work can
  plug in without guessing.
- Cloudflare Workers / API gateway in front of the private buckets. The
  pipeline can use the R2 S3-compatible API directly (boto3) with the scoped
  token; no gateway needed at this scale.
- Custom domain / Cloudflare Stream for video — not justified yet at this
  traffic/team size.

## Verification

- Public bucket: fetch a migrated asset's r2.dev URL directly, confirm 200 +
  correct content-type.
- Site: `npm run dev --prefix site`, load the pages that use hero video /
  landing images, confirm they render from the R2 URL (network tab) instead
  of `site/public`.
- Private buckets: confirm they reject unauthenticated access (no public
  flag set).

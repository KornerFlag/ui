# Cloudflare R2 Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. (This plan is a poor fit for subagent-driven-development: Task 1 requires a live interactive browser OAuth step from the human operator, and every later task depends on URLs/values Task 1 produces — there is no independent parallel work to hand off.)

**Goal:** Provision 3 Cloudflare R2 buckets (public site-assets CDN + 2 private buckets for pipeline data), migrate the heavy video/image assets currently committed to the Astro site's git repo into the public bucket, and document the storage conventions.

**Architecture:** Buckets and their public/CORS configuration are provisioned with the `wrangler` CLI (OAuth login, no long-lived secret needed for this session). The public bucket is read directly over plain HTTPS from its `r2.dev` URL — no Worker, no API token, no gateway. The Astro site resolves asset URLs through one small helper (`r2Asset()`) driven by a `PUBLIC_R2_ASSETS_URL` env var, mirroring the existing `withBase()` pattern in `site/src/lib/site.ts`.

**Tech Stack:** Cloudflare R2, Wrangler CLI (`npx wrangler`, v4.111.0 confirmed available — no global install needed), Astro 6 (`import.meta.env`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-cloudflare-r2-storage-design.md` — every requirement below traces back to it.
- Bucket names are exact and fixed: `kornerflag-site-assets` (public), `kornerflag-footage` (private), `kornerflag-outputs` (private).
- Public bucket key layout: `/video/hero/`, `/video/demo/`, `/images/landing/`.
- CORS on `kornerflag-site-assets`: `GET` only, origins `https://kornerflag.github.io` and `http://localhost:4321` (Astro's default dev port — confirmed no `server.port` override in `site/astro.config.mjs`).
- No custom domain — use the `r2.dev` public development URL (per user decision; revisit if a domain is ever onboarded to Cloudflare).
- Only heavy media migrates out of `site/public/`: the 2 preview `.mp4` files and the 4 landing `.webp` files. JSON stats, position data, heatmap PNGs, and JPG thumbnails stay local (they're build-time JSON imports and out of the approved spec's scope — do not touch them).
- **Deviation from the spec, flagged here rather than silently applied:** the spec's "Access & credentials" section calls for creating 2 scoped R2 API tokens now. Task 1 provisions buckets via `wrangler login` (OAuth), and object uploads in Tasks 3–4 also go through that same authenticated wrangler session — so no S3-compatible API token is actually consumed by anything in this plan. Minting tokens nobody uses yet just creates unused secrets to rotate/revoke later. This plan provisions the buckets only; Task 5's decision doc documents exactly how to mint each token (dashboard steps, permission scope) for whoever wires up the next consumer (Krish's pipeline, or a future CI job that uploads site-assets automatically).

---

### Task 1: Authenticate wrangler and provision the 3 R2 buckets

**Files:** None (infrastructure only — no repo files change in this task).

**Interfaces:**
- Produces: 3 R2 buckets in the Cloudflare account (`kornerflag-site-assets`, `kornerflag-footage`, `kornerflag-outputs`); a public `r2.dev` URL for `kornerflag-site-assets` (captured for Task 2); a CORS policy applied to `kornerflag-site-assets`.

- [ ] **Step 1: Log in to Cloudflare via wrangler**

Run (from repo root):
```bash
npx wrangler login
```
This opens a browser OAuth flow. Complete the authorization in the browser, then return to the terminal.

- [ ] **Step 2: Verify authentication**

Run: `npx wrangler whoami`
Expected: prints an authenticated account email/name, not "You are not authenticated."

- [ ] **Step 3: Create the 3 buckets**

```bash
npx wrangler r2 bucket create kornerflag-site-assets
npx wrangler r2 bucket create kornerflag-footage
npx wrangler r2 bucket create kornerflag-outputs
```
Expected: each prints a success message (`Created bucket 'kornerflag-...'`).

- [ ] **Step 4: Verify all 3 buckets exist**

Run: `npx wrangler r2 bucket list`
Expected: output includes all three bucket names.

- [ ] **Step 5: Enable the public development URL on the site-assets bucket only**

```bash
npx wrangler r2 bucket dev-url enable kornerflag-site-assets
```
This prompts for confirmation (type `y` / follow the prompt) since it's a public-exposure action — confirm it.

- [ ] **Step 6: Capture the public URL**

Run: `npx wrangler r2 bucket dev-url get kornerflag-site-assets`
Expected: prints a URL of the form `https://pub-<hash>.r2.dev` with status "Enabled". **Write this URL down** — it's `PUBLIC_R2_ASSETS_URL` for Task 2.

- [ ] **Step 7: Confirm the private buckets have no public dev URL**

```bash
npx wrangler r2 bucket dev-url get kornerflag-footage
npx wrangler r2 bucket dev-url get kornerflag-outputs
```
Expected: both show disabled/not-enabled status. This is the default — no action needed, just confirming nothing was accidentally exposed.

- [ ] **Step 8: Write and apply the CORS policy for site-assets**

Create `infra/cloudflare/r2-cors-site-assets.json`:
```json
[
  {
    "AllowedOrigins": ["https://kornerflag.github.io", "http://localhost:4321"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Apply it:
```bash
npx wrangler r2 bucket cors set kornerflag-site-assets --file infra/cloudflare/r2-cors-site-assets.json
```
Expected: success message. If it errors on field names, run `npx wrangler r2 bucket cors set --help` and `npx wrangler r2 bucket cors list kornerflag-site-assets` after adjusting to confirm the applied schema — the AWS S3-style `AllowedOrigins`/`AllowedMethods`/`AllowedHeaders`/`MaxAgeSeconds` casing is what R2 expects, but fix inline against the actual error if it differs.

- [ ] **Step 9: Verify CORS applied**

Run: `npx wrangler r2 bucket cors list kornerflag-site-assets`
Expected: shows the rule with `https://kornerflag.github.io` and `http://localhost:4321` as allowed origins.

- [ ] **Step 10: Commit the CORS config file**

```bash
git add infra/cloudflare/r2-cors-site-assets.json
git commit -m "chore(storage): apply R2 CORS policy for site-assets bucket"
```

---

### Task 2: Add the `r2Asset()` helper and env scaffolding

**Files:**
- Modify: `site/src/lib/site.ts` (add function after `withBase`, ~line 13)
- Create: `site/.env.example`
- Modify: `site/.gitignore` if it doesn't already inherit the root `.env` ignore rule (verify first — see Step 1)

**Interfaces:**
- Produces: `r2Asset(path: string): string` — exported from `site/src/lib/site.ts`, same module as `withBase`. Given a bucket-relative path (with or without leading `/`), returns the full public R2 URL. Consumed by Task 3.

- [ ] **Step 1: Confirm `.env` is already gitignored for the `site/` subdirectory**

Run: `git check-ignore -v site/.env || echo "NOT IGNORED"`
Expected: prints a match against the root `.gitignore`'s `.env` line (confirms `site/.env` won't be committed). If `NOT IGNORED` prints instead, add a `.env` line to `site/.gitignore` (create the file if it doesn't exist) before proceeding.

- [ ] **Step 2: Add the `r2Asset` helper**

In `site/src/lib/site.ts`, immediately after the `withBase` function (currently lines 1–12), add:

```ts
export function r2Asset(path: string): string {
  const base = (import.meta.env.PUBLIC_R2_ASSETS_URL || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
```

- [ ] **Step 3: Create `site/.env.example`**

```
# Public base URL of the kornerflag-site-assets R2 bucket (r2.dev dev URL).
# Get the value with: npx wrangler r2 bucket dev-url get kornerflag-site-assets
PUBLIC_R2_ASSETS_URL=
```

- [ ] **Step 4: Create your local `site/.env` with the real value**

Using the URL captured in Task 1 Step 6:
```bash
echo "PUBLIC_R2_ASSETS_URL=https://pub-<hash>.r2.dev" > site/.env
```
(Replace `https://pub-<hash>.r2.dev` with the actual URL — no trailing slash.)

- [ ] **Step 5: Verify the helper compiles**

Run: `cd site && npx astro check 2>&1 | grep -i "site.ts" || echo "no errors in site.ts"`
Expected: `no errors in site.ts` (or no output referencing that file).

- [ ] **Step 6: Commit**

```bash
git add site/src/lib/site.ts site/.env.example
git commit -m "feat(storage): add r2Asset() helper and R2 env scaffolding"
```
(`site/.env` is gitignored — do not add it.)

---

### Task 3: Migrate landing images to R2

**Files:**
- Modify: `site/src/components/landing/FeatureGrid.astro`
- Modify: `site/src/components/landing/GearBand.astro`
- Delete: `site/public/images/landing/grid-passing.webp`, `grid-tactics.webp`, `grid-movement.webp`, `band-wide.webp`

**Interfaces:**
- Consumes: `r2Asset(path: string): string` from `site/src/lib/site.ts` (Task 2).

- [ ] **Step 1: Upload the 4 images to the bucket**

From repo root:
```bash
npx wrangler r2 object put kornerflag-site-assets/images/landing/grid-passing.webp --file site/public/images/landing/grid-passing.webp
npx wrangler r2 object put kornerflag-site-assets/images/landing/grid-tactics.webp --file site/public/images/landing/grid-tactics.webp
npx wrangler r2 object put kornerflag-site-assets/images/landing/grid-movement.webp --file site/public/images/landing/grid-movement.webp
npx wrangler r2 object put kornerflag-site-assets/images/landing/band-wide.webp --file site/public/images/landing/band-wide.webp
```
Expected: each prints a success message.

- [ ] **Step 2: Verify each is publicly fetchable**

Run (substitute your actual `PUBLIC_R2_ASSETS_URL`):
```bash
curl -sI "$PUBLIC_R2_ASSETS_URL/images/landing/grid-passing.webp" | head -1
curl -sI "$PUBLIC_R2_ASSETS_URL/images/landing/band-wide.webp" | head -1
```
Expected: `HTTP/2 200` (or `HTTP/1.1 200`) for both.

- [ ] **Step 3: Update `FeatureGrid.astro`**

Current (top of file):
```astro
---
/** FeatureGrid — big heading + three tall photo cards (Baseline "Training Paths"). */
import ScrollNext from "./ScrollNext.astro";
const base = import.meta.env.BASE_URL;
const cards = [
  { img: `${base}images/landing/grid-passing.webp`, label: "Passing & possession",
    body: "How the ball was circulated, which players linked phases, and where possession broke down." },
  { img: `${base}images/landing/grid-tactics.webp`, label: "Formation & shape",
    body: "Team shape and spacing across the match, from build-up to the final third." },
  { img: `${base}images/landing/grid-movement.webp`, label: "Movement & distance",
    body: "Distance covered and movement load by player — see who carried the work." },
];
---
```

Replace with:
```astro
---
/** FeatureGrid — big heading + three tall photo cards (Baseline "Training Paths"). */
import ScrollNext from "./ScrollNext.astro";
import { r2Asset } from "../../lib/site";
const cards = [
  { img: r2Asset("images/landing/grid-passing.webp"), label: "Passing & possession",
    body: "How the ball was circulated, which players linked phases, and where possession broke down." },
  { img: r2Asset("images/landing/grid-tactics.webp"), label: "Formation & shape",
    body: "Team shape and spacing across the match, from build-up to the final third." },
  { img: r2Asset("images/landing/grid-movement.webp"), label: "Movement & distance",
    body: "Distance covered and movement load by player — see who carried the work." },
];
---
```
(`base` is dropped — nothing else in this file uses it.)

- [ ] **Step 4: Update `GearBand.astro`**

Current (top of file):
```astro
---
import Heatmap from "./Heatmap.astro";
import ScrollNext from "./ScrollNext.astro";
const base = import.meta.env.BASE_URL;
const cards = [
  { kind: "img", src: `${base}data/nc_state_stats_thumbnail.jpg`, name: "Match room", tag: "Video + stats" },
  { kind: "heat", name: "Team heatmaps", tag: "Positioning" },
  { kind: "img", src: `${base}data/08fd33_4_thumbnail.jpg`, name: "Review clips", tag: "Shareable" },
];
---
```

Replace with (only the import and the `<img class="gear-bg">` src line below change — `base` stays, it's still used for the two local JPG thumbnails and the `room/` links):
```astro
---
import Heatmap from "./Heatmap.astro";
import ScrollNext from "./ScrollNext.astro";
import { r2Asset } from "../../lib/site";
const base = import.meta.env.BASE_URL;
const cards = [
  { kind: "img", src: `${base}data/nc_state_stats_thumbnail.jpg`, name: "Match room", tag: "Video + stats" },
  { kind: "heat", name: "Team heatmaps", tag: "Positioning" },
  { kind: "img", src: `${base}data/08fd33_4_thumbnail.jpg`, name: "Review clips", tag: "Shareable" },
];
---
```

Then find this line further down in the template (currently in the `<div class="gear-band bleed">` block):
```astro
<img class="gear-bg" src={`${base}images/landing/band-wide.webp`} alt="" aria-hidden="true" loading="lazy" />
```
Replace with:
```astro
<img class="gear-bg" src={r2Asset("images/landing/band-wide.webp")} alt="" aria-hidden="true" loading="lazy" />
```

- [ ] **Step 5: Run the dev server and visually verify**

```bash
cd site && npm run dev
```
Open `http://localhost:4321/ui/` in a browser. Scroll to the "Insight designed for every match" section (FeatureGrid) and the "Everything lands in one calm match room" section (GearBand). Open browser devtools → Network tab, reload, and confirm the `grid-*.webp` and `band-wide.webp` requests go to `pub-<hash>.r2.dev`, not `localhost`/`/ui/images/...`, and render correctly (no broken images).

- [ ] **Step 6: Delete the migrated local files**

```bash
rm site/public/images/landing/grid-passing.webp site/public/images/landing/grid-tactics.webp site/public/images/landing/grid-movement.webp site/public/images/landing/band-wide.webp
```

- [ ] **Step 7: Re-run dev server to confirm nothing else references the deleted files**

```bash
cd site && npm run build
```
Expected: build succeeds with no missing-asset errors (Astro's build doesn't statically resolve string-built `img.src` URLs, but this confirms nothing else in the build pipeline touches those paths, e.g. an `astro:assets` import).

- [ ] **Step 8: Commit**

```bash
git add site/src/components/landing/FeatureGrid.astro site/src/components/landing/GearBand.astro
git rm site/public/images/landing/grid-passing.webp site/public/images/landing/grid-tactics.webp site/public/images/landing/grid-movement.webp site/public/images/landing/band-wide.webp
git commit -m "feat(storage): serve landing images from R2 instead of the repo"
```

---

### Task 4: Migrate demo preview clips to R2

**Files:**
- Modify: `site/public/data/manifest.json`
- Delete: `site/public/data/08fd33_4_preview.mp4`, `site/public/data/nc_state_stats_preview.mp4`

**Interfaces:**
- Consumes: `clipVideo(clip)` in `site/src/lib/site.ts` (unchanged — already checks `clip.local_video_url` first, and `withBase()` already passes absolute `http(s)://` URLs through unmodified, so no code change is needed here, only data).

- [ ] **Step 1: Upload both clips**

```bash
npx wrangler r2 object put kornerflag-site-assets/video/demo/08fd33_4_preview.mp4 --file site/public/data/08fd33_4_preview.mp4
npx wrangler r2 object put kornerflag-site-assets/video/demo/nc_state_stats_preview.mp4 --file site/public/data/nc_state_stats_preview.mp4
```
Expected: success messages. (These are 1.5MB and 848KB — outside the ≤6MB hero-loop cap but within the ≤15MB demo-clip cap from the spec, so no re-encode needed.)

- [ ] **Step 2: Verify both are publicly fetchable**

```bash
curl -sI "$PUBLIC_R2_ASSETS_URL/video/demo/08fd33_4_preview.mp4" | head -1
curl -sI "$PUBLIC_R2_ASSETS_URL/video/demo/nc_state_stats_preview.mp4" | head -1
```
Expected: `200` for both.

- [ ] **Step 3: Update `manifest.json`**

In `site/public/data/manifest.json`, change:
```json
"local_video_url": "/data/08fd33_4_preview.mp4",
```
to (using your actual `PUBLIC_R2_ASSETS_URL`):
```json
"local_video_url": "https://pub-<hash>.r2.dev/video/demo/08fd33_4_preview.mp4",
```
and:
```json
"local_video_url": "/data/nc_state_stats_preview.mp4",
```
to:
```json
"local_video_url": "https://pub-<hash>.r2.dev/video/demo/nc_state_stats_preview.mp4",
```
Leave every other field (`thumbnail_url`, `stats_url`, `heatmap_team*_url`, `positions_url`, `video_url`) untouched — they're out of this migration's scope.

- [ ] **Step 4: Verify in the match room and clip pages**

```bash
cd site && npm run dev
```
Visit `http://localhost:4321/ui/room/` and `http://localhost:4321/ui/clips/08fd33_4/`. Confirm the video players load and play, and devtools Network tab shows the `<video>` `src` request going to `pub-<hash>.r2.dev`.

- [ ] **Step 5: Delete the migrated local files**

```bash
rm site/public/data/08fd33_4_preview.mp4 site/public/data/nc_state_stats_preview.mp4
```

- [ ] **Step 6: Rebuild to confirm nothing breaks**

```bash
cd site && npm run build
```
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add site/public/data/manifest.json
git rm site/public/data/08fd33_4_preview.mp4 site/public/data/nc_state_stats_preview.mp4
git commit -m "feat(storage): serve demo preview clips from R2 instead of the repo"
```

---

### Task 5: Document the storage decision and footage/outputs convention

**Files:**
- Create: `docs/decisions/0001-cloudflare-r2-storage.md`

**Interfaces:** None (documentation only).

- [ ] **Step 1: Write the decision doc**

Create `docs/decisions/0001-cloudflare-r2-storage.md`:

```markdown
# 0001 — Cloudflare R2 for media storage

Date: 2026-07-16
Status: Accepted

## Decision

Heavy media moves out of git into 3 Cloudflare R2 buckets:

- `kornerflag-site-assets` (public, r2.dev URL) — hero/background video, demo
  preview clips, landing images for the Astro site. Key layout:
  `/video/hero/`, `/video/demo/`, `/images/landing/`.
- `kornerflag-footage` (private) — raw match footage the CV pipeline
  ingests. **Not yet populated** — provisioned only, ready for the pipeline
  to adopt.
- `kornerflag-outputs` (private) — pipeline JSON/heatmap outputs. **Not yet
  populated** — same as above.

## Why

`site/public/` was committing multi-hundred-KB to multi-MB video/image files
to git, bloating the repo and the GitHub Pages build. See
`docs/superpowers/specs/2026-07-15-cloudflare-r2-storage-design.md` for the
full format/access spec.

## Accessing the buckets

**Public site-assets bucket:** plain HTTPS GET, no auth. Base URL is in each
developer's local `site/.env` as `PUBLIC_R2_ASSETS_URL` (get it with
`npx wrangler r2 bucket dev-url get kornerflag-site-assets`). Uploads go
through `npx wrangler r2 object put kornerflag-site-assets/<key> --file <path>`
under your own `wrangler login` session — no API token needed for manual
uploads.

**Private footage/outputs buckets — creating a scoped API token (when the
pipeline is ready to use them):**

1. Cloudflare dashboard → R2 → Manage R2 API Tokens.
2. Create User API token (or Account token if it needs to run outside any
   one person's account access) → permission **Object Read & Write**.
3. Scope it to `kornerflag-footage` and `kornerflag-outputs` only (not
   site-assets, not account-wide).
4. Copy the Access Key ID and Secret Access Key immediately (the secret is
   shown once). Set `endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   in whatever S3-compatible client reads/writes them (e.g. `boto3`).
5. Store the credentials in a local, gitignored env file — never commit them.

Repeat with a **site-assets-only** token, scoped to `kornerflag-site-assets`,
only if/when a CI job needs to upload new assets automatically (manual
`wrangler r2 object put` is sufficient until then).

## Consequences

- No Worker or API gateway in front of any bucket at this scale.
- No custom domain yet — `kornerflag-site-assets` uses its r2.dev URL, which
  Cloudflare rate-limits and doesn't recommend for sustained production
  traffic. Revisit if/when a domain is onboarded to Cloudflare.
- Wiring the CV pipeline to `kornerflag-footage`/`kornerflag-outputs` is not
  done by this decision — it's the next step for whoever owns that lane.
```

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/0001-cloudflare-r2-storage.md
git commit -m "docs(storage): record R2 storage decision and bucket conventions"
```

---

### Task 6: Final end-to-end verification

**Files:** None.

**Interfaces:** None.

- [ ] **Step 1: Full clean build**

```bash
cd site && rm -rf dist .astro && npm run build
```
Expected: succeeds with no errors.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```
Visit the printed local URL, check the landing page (FeatureGrid, GearBand sections) and `/room/` and a `/clips/<slug>/` page. Confirm all migrated images/video load from `pub-<hash>.r2.dev` with no broken assets or console errors.

- [ ] **Step 3: Confirm the private buckets reject public access**

```bash
curl -sI "https://pub-does-not-exist.r2.dev/anything" | head -1   # sanity: r2.dev requires the bucket's own enabled subdomain
npx wrangler r2 bucket dev-url get kornerflag-footage
npx wrangler r2 bucket dev-url get kornerflag-outputs
```
Expected: both still show disabled — no accidental public exposure.

- [ ] **Step 4: Confirm `site/public/` shrank**

```bash
du -sh site/public
```
Expected: noticeably smaller than the original ~10M (the 2 mp4s + 4 webps totaling ~4MB are gone).

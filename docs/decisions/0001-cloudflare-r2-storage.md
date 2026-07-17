# 0001 — Cloudflare R2 for media storage

Date: 2026-07-16
Status: Accepted

## Decision

Heavy media moves out of git into 3 Cloudflare R2 buckets:

- `kornerflag-site-assets` (public, r2.dev URL:
  `https://pub-0115ebd731ed4ce997fc9d7f6f34803c.r2.dev`) — hero/background
  video, demo preview clips, landing images for the Astro site. Key layout:
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
through `npx wrangler r2 object put kornerflag-site-assets/<key> --file <path> --remote`
under your own `wrangler login` session — no API token needed for manual
uploads.

**Important gotcha:** `wrangler r2 object put` defaults to writing to
wrangler's *local* simulated R2 storage, not the real bucket — it prints
`Resource location: local` when it does this. Always pass `--remote` for any
object you actually want to land in the real bucket. This bit us once during
the initial migration (uploaded 4 images locally, they 404'd on the public
URL until re-uploaded with `--remote`).

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
   Account ID: `4b95310d62089e442fae98d0fd38565f`.
5. Store the credentials in a local, gitignored env file — never commit them.

Repeat with a **site-assets-only** token, scoped to `kornerflag-site-assets`,
only if/when a CI job needs to upload new assets automatically (manual
`wrangler r2 object put --remote` is sufficient until then).

## CORS

`kornerflag-site-assets` has a CORS policy (config committed at
`infra/cloudflare/r2-cors-site-assets.json`, applied via
`wrangler r2 bucket cors set`) allowing `GET` from `https://kornerflag.github.io`
and `http://localhost:4321` (Astro's default dev port). If the dev server
picks a different port (it auto-increments when 4321 is busy), image `<img>`
tags still render fine since browsers don't apply CORS to plain image loads,
but any `fetch()`/XHR access to these assets from a non-listed origin will be
blocked — add the port to the CORS file and re-run `cors set` if that comes up.

## Consequences

- No Worker or API gateway in front of any bucket at this scale.
- No custom domain yet — `kornerflag-site-assets` uses its r2.dev URL, which
  Cloudflare rate-limits and doesn't recommend for sustained production
  traffic. Revisit if/when a domain is onboarded to Cloudflare.
- Wiring the CV pipeline to `kornerflag-footage`/`kornerflag-outputs` is not
  done by this decision — it's the next step for whoever owns that lane.
- A pre-existing, unrelated bucket named `korner` (created 2026-07-05, 1
  stray 43-byte object) was found during provisioning. It's flagged for
  cleanup but not deleted yet — `wrangler r2 bucket delete` refuses to
  remove a non-empty bucket, and the wrangler CLI has no object-listing
  command to find the stray key. Delete the object via the Cloudflare
  dashboard (R2 → `korner` → delete the object → delete the bucket) when
  convenient; it does not conflict with any bucket in this decision.

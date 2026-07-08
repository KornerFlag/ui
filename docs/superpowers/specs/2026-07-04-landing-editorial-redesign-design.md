# Landing Page — Editorial Redesign (design spec)

**Date:** 2026-07-04
**Branch:** `feat/bg-video`
**Owner:** Achyuta (UI / investor-demo priority)
**Supersedes:** the vector/scroll-scrub landing (board hero + `AmbientBallAnalyticsLayer` +
`VideoTrackingHero`).

## Problem

The current landing reads as "AI slop": too many decorative SVG gizmos, competing
animations, a page-long scroll-scrubbed match board, and a fragmented type/color system.
It also carries every finding from `03-UI-REVIEW.md` (18/24). We want an art-directed,
photo-led editorial page in the mold of the "Baseline" tennis reference — big neutral
headlines, green-monochrome palette, real breathing room, almost no motion — that still
keeps the tracking signature and shows real product output.

## Locked decisions

1. **Imagery:** sourced-photography *look*, delivered via **higgsfield-generated**
   photoreal images (one consistent green editorial grade). Real heatmaps/thumbnails from
   `site/public/data/` do the product-proof work.
2. **Pricing:** no tiers. Closing section is a single free-one-match-analysis CTA
   (payment is deferred per project rules).
3. **Tracked ball:** survives as **one restrained hero moment** — a single clean tracking
   ring on a ball in the hero photo (static or one subtle pulse). No spinning gizmo, no
   cycling chips, no page-long ambient scrub.
4. **Motion:** stripped to reveal-on-scroll + the one hero ring + hover states.
5. All `03-UI-REVIEW.md` findings fixed (see UI-review mapping).

## Visual system

- **Editorial green frame** around the viewport (olive margin, like the reference) — the
  signature; it is literally pitch-green, so it's on-brand not decorative.
- **Palette — green-mono + near-black + off-white.** Blue (`#2C6AD4`) and all cyan/teal
  drift are **removed**. Tokens:
  - `--ink: #10140e` (warm near-black text)
  - `--bg: #f4f3ee` (warm off-white page)
  - `--paper: #ffffff` (section surfaces)
  - `--frame: #3b4a2b` (olive editorial frame)
  - `--green: #46703a` (primary accent / buttons)
  - `--green-deep: #2f4a27`
  - `--muted: #5c6154` (secondary text)
  - `--on-photo: #ffffff`
- **Type — one display + one body, tokenized.** Display `Archivo` (600/700, tight
  tracking) for editorial headlines; body `Inter`. No other families anywhere. Loaded via
  a single `<link>` in `KfLayout` (not CSS `@import`), with `preconnect`.
- **Spacing scale** (4px base) replaces magic numbers:
  `--s1:4 --s2:8 --s3:12 --s4:16 --s5:24 --s6:32 --s7:48 --s8:64 --s9:96 --s10:128`.
- **Focus:** one shared `:focus-visible` treatment (2px `--green` ring + offset) on every
  interactive control.

## Page structure

| # | Section | Component | Content |
|---|---|---|---|
| 1 | Nav | `KfLayout` | wordmark+logo left · centered links (How it works · Features · Match room) · `Analyze a match →` right. Over hero, minimal. |
| 2 | Editorial hero | `EditorialHero.astro` | full-bleed generated aerial pitch, low-sun shadow; huge headline bottom-left; social-proof pill ("Built with NC State"); circular scroll button; **one** tracking ring on a ball. |
| 3 | Proof block | `ProofBlock.astro` | left: real heatmap PNG + big stat overlay (54 / 46 possession); right: heading + 3-thumbnail strip of real tracked frames + short paragraph. |
| 4 | What coaches get | `FeatureGrid.astro` | big heading + 3 tall image cards (Passing & Possession · Movement & Distance · Heatmaps), each generated image + label + caption. |
| 5 | Match room band | `MatchRoomBand.astro` | one wide art-directed still (real tracked frame), "One calm room for your review meeting," + 3 feature chips. **Static.** |
| 6 | Closing CTA | `ClosingCta.astro` | "Send one match. Get a coach-ready analysis." + free-analysis button. No tiers. |
| 7 | Footer | `KfLayout` | minimal. |

Each component is single-purpose, takes its copy/image via props, and owns its scoped
styles. Shared tokens live in `kf/styles.css`.

## Files

**New** (`site/src/components/landing/`): `EditorialHero.astro`, `ProofBlock.astro`,
`FeatureGrid.astro`, `MatchRoomBand.astro`, `ClosingCta.astro`.

**Rework:** `site/src/layouts/KfLayout.astro` (frame, nav, footer, font `<link>`,
tokens), `site/public/kf/styles.css` (new token system + shared utilities; delete old
board/hero/float CSS), `site/src/pages/index.astro` (compose the new sections).

**Retire (delete):** `site/src/components/landing/AmbientBallAnalyticsLayer.astro`,
`site/src/components/landing/VideoTrackingHero.astro`, `site/src/pages/proto/tracking-hero.astro`,
`site/src/pages/proto/bg-video.astro`, `site/src/components/BgVideo.astro`,
`site/src/data/heroTrackingSequence.ts`, `site/public/kf/field.js`, and the
`landing-option-a/-b` pages. This leaves exactly **one** hero (fixes the orphaned-hero
finding). GSAP is no longer a dependency of the landing.

**Generated images** (`site/public/images/landing/`, higgsfield, one green editorial
grade): `hero-pitch.jpg` (16:9 aerial pitch, negative space for headline), `grid-passing.jpg`,
`grid-movement.jpg`, `grid-tactics.jpg` (3:4 each), `band-wide.jpg` (wide player action).
Real assets reused: `data/*_heatmap_team{1,2}.png`, `data/*_thumbnail.jpg`.

## Motion budget

- Reveal-on-scroll (existing `IntersectionObserver` in `KfLayout`) — keep, subtle.
- One hero tracking ring: static, or a single low-frequency pulse; respects
  `prefers-reduced-motion` (static when reduced).
- Hover transitions on cards/buttons.
- **No** GSAP, no ScrollTrigger, no scroll-scrub, no always-on infinite timelines.

## UI-review mapping (03-UI-REVIEW.md → this spec)

| Finding | Resolution |
|---|---|
| No focus-visible states | Shared `:focus-visible` on all controls |
| Orphaned/forked hero | Single `EditorialHero`; protos + `VideoTrackingHero` deleted |
| Brand name "KornerFlag" vs "Korner Flag" | "Korner Flag" enforced everywhere; one headline |
| Off-system fonts (Source Serif/Manrope/mono) | Locked to Archivo + Inter, tokenized |
| Off-system color (cyan/teal/blue) | Green-mono token system; blue removed |
| Magic-number spacing | 4px spacing scale tokens |
| Motion overload / always-on timers | Motion stripped; no infinite timelines |
| Render-blocking `@import` font | Fonts via `<link>` + preconnect |

## Success criteria

- `npm run build` (astro) succeeds; no reference to deleted files/GSAP remains.
- Homepage renders the 7 sections above with generated + real imagery.
- Keyboard tab shows a visible focus ring on every link/button.
- No blue/cyan/teal anywhere; one display + one body font in the loaded CSS.
- `prefers-reduced-motion` yields a static hero.
- Only one hero component exists; proto/ambient/board files are gone.

## Out of scope

- Interior pages (room, dashboard, matches, login, contact) beyond nav/footer/token
  inheritance — they keep working but are not redesigned here.
- Real licensed photography (generated stand-ins are the deliverable; swap later).
- Payments/pricing.

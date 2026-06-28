# Landing Page Improvements — Design

**Date:** 2026-06-27
**Owner:** Achyuta (UI lane)
**Status:** Approved structure, pending spec review

## Goal

Elevate the existing Korner Flag landing page (`site/src/pages/index.astro`) without
restructuring what already works. Two focuses, both chosen by the user:

1. **Visual polish & motion** — make the page feel more premium through rhythm,
   hover/active states, and refined motion.
2. **New sections** — add an embedded demo video, pricing, and a team/founders section.

**Audience:** coaches and investors equally. Coaches need product clarity and a free-trial
funnel; investors need traction cues, a credible team, and a clear business model.

**Approach:** A — in-place enhancement. Keep the current structure, components, and design
language (`site/public/kf/styles.css`, Space Grotesk + Inter, navy board surfaces, blue +
field-green accents). No rebuild of the scroll-board or hero.

## Non-goals

- No reorder of the hero or scroll-driven board.
- No new design system / token refactor (YAGNI — the language in `styles.css` is sufficient).
- No changes to the React dashboard artifact (separate, abandoned experiment).
- No backend / payment wiring (pricing section links to existing `contact/` + `checkout/`).

## Existing assets to reuse (verified present)

| Need | Reuse |
|---|---|
| Demo video | `site/public/data/nc_state_stats_preview.mp4` (+ `08fd33_4_preview.mp4`) via existing `VideoPlayer.astro` |
| Pricing tiers | The exact `plans` array already in `site/src/pages/checkout.astro` ($49 / $149 / Talk to us) |
| Layout, nav, footer, reveal/scroll JS | `site/src/layouts/KfLayout.astro` |
| Design tokens & component classes | `site/public/kf/styles.css` (`.section`, `.section-head`, `.btn*`, `.eyebrow`, `.reveal`, `.board*`, `.feature`, `.cta`) |
| Logo mark | `site/public/kf/logo.png` |

## Page structure (improved)

New sections in **bold**. All live in `index.astro`, in document order:

1. Hero — *polish only*
2. Scroll-driven match board — *polish only*
3. **Demo video** — `#demo`
4. How it works (3 steps) — *light polish*
5. What coaches get (features) — *light polish*
6. **Pricing** — `#pricing`
7. Match room preview — existing
8. **Team / founders** — `#team`
9. CTA → Footer

Nav (`KfLayout.astro` `navLinks`) gains **Pricing** (`#pricing`); "How it works" and
"Features" anchors already exist. "Watch demo" is reachable from the hero secondary CTA
(repointed from `room/` to `#demo`).

## New sections — detail

### 3. Demo video (`#demo`)

- Full-bleed `.section`, centered `.section-head`: eyebrow "See it work", h2
  "Watch a match become a review room.", one-line sub.
- Centerpiece: a framed video in the existing dark `board`/`room-video` visual treatment
  (rounded 20px, glow border, 16:9). Uses `VideoPlayer.astro` with
  `src="data/nc_state_stats_preview.mp4"` and a poster frame.
- A thin caption strip under the video: 3 inline stat chips (e.g. "Tracking · Possession ·
  Heatmaps") matching `.room-chip` styling.
- Component: new `site/src/components/DemoVideo.astro` (wraps `VideoPlayer`, owns the frame +
  caption). Keeps `index.astro` lean.

### 6. Pricing (`#pricing`)

- `.section` with centered `.section-head`: eyebrow "Pricing", h2 "Start free. Scale when
  it's working.", sub noting the first match is free.
- 3 cards in a responsive grid reusing `.feature`/card styling. Plans lifted verbatim from
  `checkout.astro` so the two surfaces never drift:
  - **Single match review — $49 / per match**
  - **Team package — $149 / per batch** (marked "Most popular", gradient-border accent)
  - **Custom workflow — Talk to us / enterprise**
- Above the cards, a "Free one-match analysis" highlight row (reuses `.hero-pill` styling)
  so the free entry point is unmissable for coaches.
- Each card CTA: $49/$149 → `checkout/`; Custom → `contact/`.
- Component: new `site/src/components/Pricing.astro`. The `plans` array is extracted to
  `site/src/lib/plans.ts` and imported by BOTH `Pricing.astro` and `checkout.astro` (single
  source of truth — fixes the current duplication risk).

### 8. Team / founders (`#team`)

- `.section` (sits on `--bg-soft` or a hairline-bordered band to break rhythm), centered
  `.section-head`: eyebrow "Who's building it", h2 "A small team shipping fast.", sub.
- 3 member cards (reuse card styling): name, role, one-line focus. Content from the work
  split in `CLAUDE.md`:
  - **Krish — Tracking & pipeline.** Detection/tracking models, stat extraction, demo pipeline.
  - **Achyuta — Product & growth.** UI, coach outreach, go-to-market.
  - **Osman — AI features & infra.** Formation detection, GPU/storage/serving.
- Each card: a monogram avatar (initials on a gradient chip, matching `Crest`/brand gradient).
  No photos required (none exist in repo); photos can drop in later via an optional `avatar` prop.
- Component: new `site/src/components/Team.astro` + a `members` array in
  `site/src/lib/team.ts`.

## Visual polish & motion pass (cross-cutting)

Applied via additions to `site/public/kf/styles.css` and small markup tweaks. No structural
change.

1. **Section rhythm** — audit `.section` padding so every section uses the same vertical
   cadence; ensure each has a `.section-head` with eyebrow + h2 + sub for consistency.
2. **Reveal motion** — keep existing `.reveal` IntersectionObserver; extend stagger to the new
   sections' cards (`data-d` attributes). Confirm `prefers-reduced-motion` disables them
   (rule already present — verify it covers new content).
3. **Hover/active** — standardize card hover (lift + `--sh`) across steps, features, pricing,
   team. Add a gradient-border treatment (reuse `.board-glow` mask technique) on the hero
   board and the "Most popular" pricing card.
4. **Button micro-interaction** — nudge the arrow `svg` on `.btn:hover` (translateX 2px,
   200ms `--ease`); applies everywhere via one CSS rule.
5. **Nav** — active-link state for in-page anchors via scroll-spy (extend the existing nav
   scroll script in `KfLayout.astro`); add `:focus-visible` rings on nav links and buttons.
6. **Accessibility** — visible `:focus-visible` outlines on all interactive elements; `alt`
   text / `aria-label` audit on icon-only buttons; video has a poster and `controls`.

## File-level change list

New:
- `site/src/components/DemoVideo.astro`
- `site/src/components/Pricing.astro`
- `site/src/components/Team.astro`
- `site/src/lib/plans.ts`
- `site/src/lib/team.ts`

Modified:
- `site/src/pages/index.astro` — insert the 3 sections in order; repoint hero secondary CTA to `#demo`.
- `site/src/pages/checkout.astro` — import `plans` from `site/src/lib/plans.ts` (dedupe).
- `site/src/layouts/KfLayout.astro` — add "Pricing" nav link; extend scroll script for active anchor.
- `site/public/kf/styles.css` — polish rules (sections for `.demo`, `.pricing`, `.team`, button arrow nudge, focus rings, gradient-border helper).

## Testing / verification

- `cd site && npx astro build` succeeds with no errors.
- Serve built site at the `/ui` base; screenshot each new section at desktop (1440) and mobile
  (390) widths via headless Chrome; confirm layout, video poster, and card grids.
- Manual: nav anchors scroll correctly; pricing CTAs route to `checkout/` and `contact/`;
  video plays; reduced-motion respected.
- No regression to hero or scroll-board (visual diff against current screenshots).

## Risks / open items

- **Video weight**: `*_preview.mp4` files should be < a few MB; if large, add `preload="none"`
  and a lightweight poster image. Confirm file sizes during implementation.
- **Demo video choice**: assumes `nc_state_stats_preview.mp4` is the best clip; swap trivially
  if Krish prefers another.
- Team bios are derived from `CLAUDE.md`; founders should confirm wording before launch.

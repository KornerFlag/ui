# Korner Flags — UI Integration & Redesign Plan

Owner: Achyuta (UI lane) · Status: **DRAFT — awaiting approval before any merge/build**
Date: 2026-06-09

This plan covers four asks: (1) reconcile the two divergent UI codebases, (2) redesign
the landing page (3 directions → pick one), (3) make the heatmaps elegant via native
data-driven rendering, (4) define how the UI integrates with the other two lanes.

---

## 1. The situation (what's in main vs. what's not)

`main` is the shipped v1.0 site. Two **separate, conflicting** UI rewrites sit on top of it:

| Track | Where | Design language | Unique surfaces |
|---|---|---|---|
| **Local `ui`** (uncommitted working tree) | this checkout | Navy/Steel · **Sora + Plus Jakarta** · soft 22–40px radii | `landing-option-a/b`, chooser `index`, `product`, `dashboard`, `matches`, `KornerLogo`, `lib/site.ts` |
| **Remote** `origin/feat-production-ui-stripe-tracking` | 1 commit | Indigo `#4f7cff` · **Space Grotesk + Manrope** · BEM, `section-card` | `upload` (drag-drop), `checkout` (Stripe), `TrackingBoard` (interactive pitch), `PassTrackingPanel`, `analysis.ts` (typed), `main.py` |

**Both edit the same 8 files** (`BaseLayout`, `index`, `clips/[slug]`, `ClipCard`,
`PlayerStatsTable`, `PossessionBar`, `VideoPlayer`, + components). A plain `git merge`
would conflict heavily and, worse, mash two design systems together.

**Key facts discovered**
- `git log ui..main` is empty → the committed `ui` branch is a clean fast-forward over `main`. The risk is entirely in the **uncommitted** working tree + the remote branch.
- Tracking data (`*_positions.json`) is **real per-second (x,y,team)** in pitch meters. Remote already pinned the coordinate range: `PITCH_WIDTH=23.32`, `PITCH_LENGTH=68` (a cropped attacking-third strip, not a full pitch).
- Known data caveats to **never show raw** in marketing UI: top speed reads **268 km/h** (ghost-speed bug, fixed in Phase 8) and **42 tracked IDs** (ghost IDs, Phase 7 trims to ≤35). Use possession, distance, and live counters instead.

---

## 2. Reconciliation strategy (chosen: full 3-way reconcile, then build)

We do **not** pick a winner branch. We establish **one new unified design system** and port
the best functional pieces from each side into it. Per-file decision table:

| File | Action | Source of truth |
|---|---|---|
| `layouts/BaseLayout.astro` | **Rebuild** on new tokens | New (Fraunces+Inter, Navy/Steel). Keep local nav IA; fold in remote's "book analysis / upload" CTA. |
| `lib/` (`site.ts` + `analysis.ts`) | **Merge → one `lib/`** | Keep `site.ts` helpers; adopt remote's typed interfaces + `PITCH_*` constants + `getTrackingSeconds`. |
| `components/TrackingBoard.astro` | **Adopt + restyle** | Remote. Becomes the productized native pitch (see §4). |
| `components/PassTrackingPanel.astro` | **Adopt + restyle** | Remote. Feeds Phase 10 events; replaces local passing block. |
| `components/PlayerStatsTable`, `PossessionBar`, `ClipCard`, `VideoPlayer` | **Local base**, fold remote data handling | Local (cleaner, on-brand) restyled to new tokens. |
| `pages/clips/[slug].astro` | **Merge** | Local layout + native heatmaps + TrackingBoard + PassTracking. |
| `pages/index.astro` | **Replace** | New landing (chosen sketch). |
| `pages/dashboard`, `matches`, `product` | **Keep + restyle** | Local only. |
| `pages/upload`, `checkout` | **Adopt + restyle** | Remote only (payment deferred per CLAUDE.md, keep scaffold behind a flag). |
| `components/KornerLogo.astro` | **Keep** | Local only. |
| `components/ComingSoonCards.astro` | **Trim** | Removed piecemeal as Phase 11 ships real event/heatmap sections. |
| `main.py`, `tests/` | **Out of UI scope** | Krish's lane — do **not** fold into the UI reconcile; coordinate separately. |

**Mechanics (the part that needs your approval — it touches shared/teammate code):**
1. Create `feat/ui-unified` from current `ui`.
2. Commit the current uncommitted working tree first (so nothing is lost) — *or* stash, your call.
3. Bring in the remote branch's files **selectively** (`git checkout origin/feat-... -- <paths>`) rather than a blind merge, restyling each as it lands.
4. Land the new design tokens, then port surfaces in the order in §6.
5. PR `feat/ui-unified` → `main`. Loop in whoever owns `feat-production-ui-stripe-tracking` so their work isn't orphaned.

---

## 3. New design system

- **Type:** Fraunces (display, serif, opsz) · Inter (body/UI) · IBM Plex Mono (stats, tabular-nums). Replaces both Sora and Space Grotesk and resolves the existing token-vs-site mismatch (`colors_and_type.css` said Source Serif/Manrope; site shipped Sora — both retired).
- **Palette:** keep the documented brand — Navy ink (`--ink-900 #0B1626`), Steel blue accents, Slate neutrals, and the 6-stop heat ramp. Optionally borrow one bright accent from remote for CTAs.
- **Single token file** imported by `BaseLayout` (consolidate `colors_and_type.css` into the live tokens).
- Deliverable: update `BaseLayout` `@import` + `:root` and the `.display`/heading classes; everything else inherits.

---

## 4. Heatmaps + landing field — native, data-driven (chosen)

Replace the flat matplotlib **PNG** heatmaps with a **native renderer** (`KFPitch`,
prototyped in `site/sketches/pitch.js`) drawing from `positions.json`:
- Styled pitch (grass, mowing stripes, markings) on `PITCH_W×PITCH_L`.
- **Density blobs** per team via additive radial gradients (elegant glow, not rainbow vomit).
- Animated player dots + motion trails; optional passing lines once events land.
- Optional scan/detect overlay for the "watch it analyze" story.

Productization: port `KFPitch` into an Astro component (`components/PitchField.astro` +
`lib/pitch-render.ts`), reusing remote's `TrackingBoard` controls (scrub, team filter,
player highlight). One renderer powers **both** the landing hero and the clip-page heatmaps.
Static PNGs stay as a `<noscript>`/fallback only.

---

## 5. Landing redesign — 3 directions (sketches ready)

Throwaway sketches in `site/sketches/` (open `index.html`), all on real data + new type:
1. **Living Pitch** — full-bleed animated field, headline overlay. Cinematic / investor.
2. **Editorial Split** — copy left, heatmap card right with Team1/Team2 toggle. Clean / premium.
3. **Broadcast HUD** — dark scan-and-detect overlay, live counters, possession bar. Techy / "watch it work".

→ **You pick one.** I build it into the real `index.astro` (replacing the chooser +
`landing-option-a/b`, which get deleted).

---

## 6. Execution order

| # | Step | Needs approval? | Notes |
|---|---|---|---|
| A | Pick landing direction (1/2/3) | — | from sketches |
| B | Create `feat/ui-unified`, commit current tree | **yes** | safety first |
| C | Land new design tokens in `BaseLayout` | no | type + palette |
| D | Selective port of remote surfaces (TrackingBoard, PassTracking, upload, checkout, lib types) | **yes** | touches teammate branch |
| E | `PitchField` component (native heatmap + field) | no | from `KFPitch` |
| F | Build chosen landing page | no | |
| G | Rebuild clip page: native heatmaps + TrackingBoard + PassTracking | no | |
| H | Restyle dashboard / matches / product / upload / checkout | no | |
| I | `npm run build` + visual pass + deploy (GitHub Pages) | no | `github-actions-deploy` skill |

---

## 7. Cross-lane integration (you + 2 teammates)

The UI is a **consumer** of the pipeline. The contract is the JSON the pipeline emits.

- **Feature dev (Krish) — pipeline/tracking/passing/events.** Produces `manifest.json`,
  `*_annotated_stats.json` (`possession`, `players`, `pass_tracking`, future `events[]`),
  `*_positions.json`, heatmap assets. **Action:** lock the stats-JSON schema (esp. the
  remote branch's `pass_tracking` shape and the planned `events[]` from Phase 10) so the
  UI types in `lib/analysis.ts` are stable. The remote `main.py` is the seam — reconcile
  it on his lane, not in the UI PR.
- **AI backend (Osman) — formation detection.** Consumes pipeline JSON, emits per-frame
  team shape (4-3-3, etc.). **Action:** agree a `stats.formations` schema now; UI adds a
  `FormationPanel` (clip page) + optional formation overlay on the `PitchField`. Currently
  **no schema exists** → blocker to flag, mirrors the dependency already noted in CLAUDE.md.
- **Shared contract:** `core/types.py::TrackedObject` upstream → JSON downstream. UI never
  touches pixels; everything spatial uses `pitch_xy` meters (already true in `positions.json`).

---

## 8. Open decisions for you
1. **Landing direction:** 1, 2, or 3?
2. **Approval to start the reconcile** (steps B + D — the only steps that touch the teammate branch / rewrite shared files). Everything else is additive.
3. **Who owns `feat-production-ui-stripe-tracking`?** Confirm before I rebase/cherry-pick it so their work isn't orphaned.

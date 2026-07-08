# Korner Flag — UI Guidelines

The design system for the Korner Flag site (`site/`), as built. General
anti-generic standards live in `WEBSITE-DESIGN-RULES.md` (repo root); this doc
is the Korner-Flag-specific layer. When the two conflict, this doc wins for
this site.

**One-line identity:** an editorial, light-surfaced page that behaves like a
live AI tracking system — pitch photography, tracked dots, thin reticles, mint
telemetry, real numbers.

---

## 1. Design tokens

All tokens live in `site/public/kf/styles.css` under `:root`. Never hardcode a
value a token covers. Change tokens there, not per component.

### Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#EDECE9` | Base page surface (neutral warm gray) |
| `--paper` | `#FFFFFF` | Cards, panels on light sections |
| `--ink` | `#191914` | Text, primary buttons, footer bg |
| `--muted` / `--muted-2` | `#6A6A63` / `#97978D` | Secondary / tertiary text |
| `--green` | `#3F6B34` | Brand accent (from the pitch), CTAs, focus rings |
| `--green-deep` | `#294A20` | Dark band fallback bg, hover states |
| `--green-soft` | `#E5EADF` | Soft green fills (avatars, placeholder cards) |
| Mint `#7CF2B0` | (literal) | **Telemetry only** — live dots, reticle satellite, goal flash, tracked chips, timeline markers. Never for copy or large fills |
| `#EAFBE4` | (literal) | Pale mint for HUD text/reticle strokes on photos |
| Red `#C9402F` | (literal) | Home-team tracking dots only |

Section ambience (see §5): each light section carries `data-bg` (surface tint)
and `data-glow-*` (radial glow position + color). Tints stay within the
`#E6–#ED` neutral-green-sand family; glow alphas `.14–.21`.

**Dark boards** (match room, footer): `#161D12`–`#1B2415` panels, hairlines
`rgba(255,255,255,.07–.16)`, text `rgba(255,255,255,.45–.95)`.

### Type

- One family: **Switzer** (Fontshare), loaded in `KfLayout.astro`. Display and
  body are the same face — hierarchy comes from size/weight/tracking, not from
  mixing families.
- Headlines: weight 600, tight tracking (`-.02em` to `-.035em`), line-height
  `.94–1.05`. Hero: `clamp(44px, 8vw, 108px)`. Section h2: `clamp(30–32px,
  ~5vw, 52–68px)`.
- Body: 16–17px, line-height 1.5–1.6, max-width 42–56ch.
- Labels/eyebrows: 10.5–12px, weight 600, uppercase, letter-spacing `.07–.2em`.
- **All numbers that update get `font-variant-numeric: tabular-nums`.** No
  jitter when values tick.

### Spacing & layout

| Token | Value | Use |
|---|---|---|
| `--nav-h` | `78px` | Nav height. Everything nav-relative derives from this |
| `--sect-pad` | `clamp(88px, 12vh, 124px)` | Major-section min padding |
| `--sect-pad-sm` | `clamp(64px, 9vh, 96px)` | Small sections, band interiors, footer top |
| `--s1…--s10` | 4→132px | 4px-base scale for everything inside sections |
| `--container` | `1280px` | Content max-width |
| `--gutter` | `clamp(18px, 4vw, 44px)` | Horizontal page padding |

Rules:
- **Every landing section is exactly one screen**: `min-height: 100svh`,
  content vertically centered (flex). Padding is minimum breathing room, not
  the height driver. Sections may grow past 100svh on small screens — never
  clip content to force fit.
- `.container` must keep `width: 100%` (flex parents otherwise shrink-wrap it
  — this broke the feature grid once; don't remove it).
- Mobile (≤720px): `--sect-pad: 76px`, `--sect-pad-sm: 56px`.
- Card-grid gaps are `--s4` (16px) everywhere. Heading → content gap is
  `--s8` (64px).

### Radii & elevation

- `--r-lg` 16 / `--r-md` 11 / `--r-sm` 8. Full-bleed bands are square; only
  content cards get radius. Pills/buttons: `999px`.
- Shadows: `--sh-sm` (resting card), `--sh` (hover), `--sh-lg` (the one big
  board on a page). Shadow is an accent — never on everything at once.

---

## 2. Motion

- Default ease: `--ease: cubic-bezier(.22,.61,.36,1)`.
- **Glide ease** for entrances and card hovers: `cubic-bezier(.16,1,.3,1)`
  (expo-out), 0.5–0.9s. This curve is most of the "premium vs. generated"
  difference — long soft landing, no pop.
- Reveal-on-scroll: `.reveal` = opacity + 14px rise, staggered `data-d="1–4"`
  (+.08s each). Applied per element, not per section.
- Hovers: 0.25–0.5s, translateY(-3/-4px) max. Nothing snaps (no <0.2s
  transforms).
- **Scrolling is free** — no scroll-snap, no scroll-padding. In-page anchors
  are JS-driven (`KfLayout`) and land section tops flush with the viewport
  top. Don't add `scroll-margin/padding`; landings will drift.
- Continuous motion (sim, ambient) runs on **one rAF loop per system**,
  transforms only (`translate3d`), text updates throttled to ~8Hz.
- **`prefers-reduced-motion`**: every animation system must have a static
  fallback (sim → static frame; ambient → fixed tint; reveals → visible).
  This is non-negotiable.

---

## 3. Signature elements (the brand's own vocabulary)

These are what make the site unmistakably Korner Flag. Reuse them; don't
invent parallel versions.

1. **Tracking dots** — 13px (10px mobile) unnumbered circles, red `#C9402F`
   home / `#EEF1EC` away, 1.5px white border, faint outer ring (`::after`).
   Receiver pulse = one-shot mint ring + scale 1.28.
2. **The ball** — `BallSvg.astro`, one component for every ball on the site
   (hero sim, ambient scroll ball, closing-band ball). Pass a unique `idp`
   (SVG defs namespace) and a `rollClass`; rotate only the roll group so
   lighting stays fixed. Never draw a different ball.
3. **Reticle** — thin double ring (hairline base + two 1.6px arcs +
   mint satellite dot), 7s linear rotation. Pale mint strokes.
4. **Telemetry chips** — dark translucent pill, 11px, mint status dot,
   backdrop blur. Used for the ball speed tag, "Live tracking", "Tracked".
5. **HUD stats** — big tabular number + tiny unit + 11.5px label, cycling
   with 0.45s opacity fades. Only 1–2 visible at once.
6. **Goal payoff** — mint ring + "GOAL" chip + 12-spark burst. Reserved for
   actual goals; don't reuse the spark burst for anything else.
7. **Ambient page background** (§5) and the **scroll ball** that ducks behind
   dark bands.

---

## 4. Components

- **Buttons** (`.btn` in `styles.css`): `btn-primary` (ink), `btn-accent`
  (green — reserve for the single most important CTA per page), `btn-ghost`
  (outline), `btn-onphoto` (frosted, photo bands only). Pills, 15px, arrow
  icon optional. Don't invent new variants.
- **Nav**: fixed overlay on the landing (`hero={true}`), relative solid on
  interior pages. Scrolled state is **glass** — `rgba(237,236,233,.42)` +
  18px blur + green hairline + soft green glow. Never a solid white bar.
- **ScrollNext** (`ScrollNext.astro`): 38px circular chevron, bottom-center,
  55% opacity until hover; `dark` variant on photo bands. One per section,
  chained to the next section's id.
- **Dark board** (match room pattern): `#161D12` shell, top bar with three
  dots + title + chips, 1px white-alpha hairlines between cells, `--sh-lg`.
  One board per page maximum.
- **Heatmap** (`Heatmap.astro`): stylized SVG pitch heatmap — use this, not
  the raw pipeline PNGs.

---

## 5. Ambient background system

`KfLayout` renders a fixed `.page-bg` layer behind every page: surface tint +
drifting radial glow + faint oversized pitch diagram (48s float) + film grain.

- Sections opt in via attributes:
  `data-bg="#EAEDE6" data-glow-x="80%" data-glow-y="22%" data-glow-c="rgba(63,107,52,.21)"`.
  An IntersectionObserver (middle-of-viewport band) cross-fades the layer as
  sections take over (1.2s tint, 1.6s glow via `@property` transitions).
- Light sections have `background: transparent` so the layer shows through;
  dark bands paint over it.
- The **scroll ball** lives in this layer: scroll-linked weave down the
  viewport, rolling rotation, hidden behind dark bands by design. The closing
  band has its own in-band ball (`.wc-ball`, z-index 1: above photo + scrim,
  below text at z-index 2).

---

## 6. Data honesty

- Numbers on product surfaces (match room, clips) come from the real pipeline
  JSONs in `site/public/data/` at build time. **No invented stats** where a
  real one exists.
- Filter tracking artifacts: player speeds > 45 km/h are homography glitches
  — exclude from display (see the `pitch_xy` gotcha in CLAUDE.md).
- The hero sim's seeded stats are stylized but plausible; keep them in real
  football ranges (pass accuracy 75–92%, sprints ≤ 34 km/h, etc.).
- Placeholder copy must say so ("representative quote").

## 7. Accessibility & quality floor

- Visible keyboard focus everywhere (global `:focus-visible` ring, `--green`).
- Reduced motion honored by every system (§2).
- Decorative layers get `aria-hidden="true"` + `pointer-events: none`.
- Images: real `alt` for content, empty for decoration. Videos: `controls`,
  `preload="metadata"`, poster.
- Responsive floor: 375px. Cards stack, dark boards go single-column ≤980px,
  hero HUD trims to one stat ≤640px.

## 8. File map

| What | Where |
|---|---|
| Tokens, buttons, nav, reveals, ambient CSS | `site/public/kf/styles.css` |
| Layout, nav/footer, ambient layer + observers, anchor scrolling, scroll ball | `site/src/layouts/KfLayout.astro` |
| Hero + match simulation | `site/src/components/landing/EditorialHero.astro` |
| Ball (shared) | `site/src/components/landing/BallSvg.astro` |
| Section arrow | `site/src/components/landing/ScrollNext.astro` |
| Landing sections | `site/src/components/landing/*.astro` |
| Match room | `site/src/pages/room.astro` |
| Pipeline data consumed by UI | `site/public/data/` |

## 9. Adding a landing section — checklist

1. `<section>` direct child of `main`, unique `id`, `min-height: 100svh`,
   flex-centered content, `background: transparent` (light) or own band bg.
2. `data-bg` + `data-glow-*` chosen from the §1 families (light sections).
3. `.reveal` on entrance elements with `data-d` stagger.
4. `<ScrollNext to="next-id" />` (+ `dark` on bands), previous section
   retargeted to point here.
5. Spacing only via tokens; grids gap `--s4`; heading margin `--s8`.
6. Reduced-motion story for anything that moves.
7. Numbers: real, tabular-nums, honest labels.

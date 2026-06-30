# VideoTrackingHero — Scroll-Controlled Frame-Sequence Hero

**Date:** 2026-06-29
**Branch:** `feat/bg-video`
**Owner:** Achyuta (UI / investor-demo lane)
**Status:** Design — awaiting review

---

## 1. Goal

A premium, scroll-controlled animated hero for the KornerFlag landing experience.
As the user scrolls, the hero pins and a 5-frame image sequence crossfades while an
analytics overlay (tracking circle, pass line, possession, event pill, stat labels)
updates in sync — telling the story of a single attacking move from receive → goal.

Replaces a scrubbed `<video>` with a **frame sequence** for crispness, no decode
jank, and a trivial reduced-motion fallback.

---

## 2. Stack Decision (resolved)

The live site is an **Astro project rooted at `site/`** with **no React**
(`site/package.json`: `astro` + `plyr` only). The hero is therefore built as an
**Astro component**, not a `.tsx` React island.

**Rationale:** the visual result is identical either way — both drive the same GSAP
timeline + SVG + CSS. A scroll-scrubbed sequence is an imperative timeline that GSAP
owns by mutating the DOM directly; React would only wrap it in `useRef`/`useEffect`
and ship a hydration runtime to a zero-React site for no visual gain. The Astro path
is fewer moving parts, matches the existing `BgVideo.astro` pattern, and deploys
cleanly under `base: '/ui'`.

### Adaptations from the original brief

| Brief said | This codebase | Decision |
|---|---|---|
| `VideoTrackingHero.tsx` (React) | Astro, no React | `VideoTrackingHero.astro` |
| `/public/images/sequence/...` | `base: '/ui'`, assets in `site/public/` | `site/public/images/sequence/...`, referenced via `withBase()` |
| `src/components/landing/`, `src/data/` | code lives under `site/src/` | `site/src/components/landing/`, `site/src/data/` |
| HTML/**Tailwind** for overlay | No Tailwind installed; design-system tokens + scoped CSS | Scoped CSS + design-system tokens (matches existing pages) |

Unchanged from brief: GSAP ScrollTrigger, SVG for circle/pass-line/marker, no canvas,
no Three.js, no Lottie, 300vh pin, crossfade, all 5 scroll states, accessibility,
preload/lazy-load.

---

## 3. Files

| File | Purpose |
|---|---|
| `site/src/components/landing/VideoTrackingHero.astro` | Markup (frame stack + SVG overlay + HTML overlay + hero copy), scoped CSS, client `<script>` with the GSAP/ScrollTrigger timeline. |
| `site/src/data/heroTrackingSequence.ts` | Typed `HeroState[]` — single source of truth for all 5 states. **Circle positions are tuned here.** |
| `site/public/images/sequence/frame-0{1..5}-*.jpg` | The 5 frames (dropped in by user). |
| `site/src/pages/proto/tracking-hero.astro` | Demo page mounting the hero (mirrors `proto/bg-video.astro`). Isolated, reversible. |
| `site/package.json` | Add `gsap` dependency. |

No existing landing page is modified (mount = new proto page only).

---

## 4. Data Model (`heroTrackingSequence.ts`)

```ts
export interface Vec2 { x: number; y: number } // % of the frame box (0–100)

export interface HeroState {
  id: string;
  image: string;                 // base-relative, e.g. "images/sequence/frame-01-receive.jpg"
  label: string;                 // overlay label, e.g. "#8 · 12.4 mph"
  possession: number;            // 54 → drives the count-up number
  event: string;                 // event pill text
  marker: Vec2;                  // tracking circle centre — EDIT THESE to reposition the circle
  passLine?: { from: Vec2; to: Vec2 };  // only state 3
  highlightReceiver?: boolean;          // state 4 (receiver ring)
  showHeatmap?: boolean;                // state 5 (green heatmap fade-in)
  reviewClips?: number;                 // state 5 → 1
}

export const heroTrackingSequence: HeroState[] = [ /* 5 entries below */ ];
```

### The 5 states

| # | id | image | label | poss. | event | extra |
|---|---|---|---|---|---|---|
| 1 | receive | frame-01-receive.jpg | `#8 · 12.4 mph` | 54 | Tracking active | — |
| 2 | carry | frame-02-carry.jpg | `#8 · 14.1 mph` | 57 | Carry forward | — |
| 3 | pass | frame-03-pass.jpg | `Progressive pass` | 59 | Progressive pass | passLine #8→#11 |
| 4 | receive-box | frame-04-receive-box.jpg | `#11 · Final-third entry` | 61 | Final-third entry | highlightReceiver |
| 5 | goal | frame-05-goal.jpg | `Goal` | 61 | Goal added to review clips | showHeatmap, reviewClips: 1 |

All positions are **percentages of the frame box**, so they are resolution-independent.
**To adjust the player circle:** edit `marker.x` / `marker.y` (and `passLine` for
state 3) in this file — two numbers per state, no component code changes.

---

## 5. Component Structure (`VideoTrackingHero.astro`)

Layered, all absolutely positioned inside a pinned stage:

```
section.vth (pinned stage, height set by JS = viewport)
├── div.vth-frames          # 5 <img> stacked, opacity-crossfaded
│   └── img.vth-frame ×5     # frame 1 eager+fetchpriority=high; 2–5 lazy+async
├── svg.vth-overlay (viewBox 0 0 100 100, preserveAspectRatio)
│   ├── line.vth-passline    # stroke-dashoffset draw-on (state 3)
│   ├── circle.vth-receiver  # receiver highlight ring (state 4)
│   └── g.vth-tracker        # tracking circle + pulse, glides cx/cy between markers
├── div.vth-heatmap          # soft green radial layer, fades in (state 5)
└── div.vth-ui               # HTML overlay (non-SVG)
    ├── div.vth-label        # "#8 · 12.4 mph"
    ├── div.vth-pill         # event pill
    ├── div.vth-stats        # possession card (count-up) + review-clips card
    └── div.vth-copy         # headline, subhead, 2 CTAs
```

**Hero copy (fixed):**
- Headline: *World Cup-level match analysis for your team.*
- Subhead: *KornerFlag turns existing footage into passing, possession, movement,
  heatmaps, and review clips — no wearables or player setup.*
- CTA 1: **Analyze a match** · CTA 2: **Free one-match analysis**

---

## 6. Timeline Mechanics (client `<script>`)

- Import `gsap` + `ScrollTrigger`; `gsap.registerPlugin(ScrollTrigger)`.
- One ScrollTrigger on `section.vth`: `pin: true`, `scrub: true`,
  `start: 'top top'`, `end: '+=300%'` (the 300vh).
- A master timeline spans scroll progress 0→1 with **4 transitions** between the 5
  states:
  - **Crossfade:** tween each frame's `opacity` (overlapping fades).
  - **Tracking circle:** `gsap.to` the `<g.vth-tracker>` `cx/cy` (via attr/transform)
    from each marker to the next — smooth glide, not teleport — plus a looping pulse.
  - **Possession:** interpolate the number (54→57→59→61→61) and the possession bar
    width; render rounded integer.
  - **Event pill / label:** swap text at state thresholds (snap, with a quick
    fade-in on change).
  - **Pass line (state 3):** animate `stroke-dashoffset` from full→0 to draw the
    line #8→#11; fade out as state 4 begins.
  - **Receiver ring (state 4):** fade/scale the highlight ring in.
  - **Heatmap (state 5):** fade `div.vth-heatmap` opacity 0→target; reveal the
    review-clips card.

All driven off the data array so adding/reordering states needs no timeline rewrite.

---

## 7. Visual Style

- Background: dark navy gradient (reuse design-system navy/steel tokens; consistent
  with `BgVideo.astro`).
- Tracking circle: crisp **electric blue** stroke with a soft outer glow (SVG
  `filter` or layered stroke), gentle pulse.
- Heatmap: **subtle green** radial, low opacity, `mix-blend-mode` so it reads as a
  wash over the pitch, not a sticker.
- Labels/pill/cards: clean, mono-ish numerals, design-system surfaces. No
  glassmorphism overload, no fake dashboard clutter.

---

## 8. Accessibility

- Detect `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- If reduced motion: **do not pin, do not build the timeline.** Render the stage at
  natural height showing **frame 5** with the final overlay statically — label,
  61% possession, event "Goal added to review clips", heatmap visible, review
  clips: 1. Pass line hidden (terminal state).
- CTAs are real focusable `<a>` elements; overlay text has sufficient contrast over
  the darkened frames.

---

## 9. Performance

- Frame 1: `loading="eager"`, `fetchpriority="high"`, `decoding="async"` — preloaded.
- Frames 2–5: `loading="lazy"`, `decoding="async"`.
- Images expected pre-compressed (user supplies optimized JPGs).
- GSAP timeline mutates transforms/opacity only (compositor-friendly); no layout
  thrash per scroll tick.
- `ScrollTrigger.refresh()` on load + resize so the pin distance stays correct.

---

## 10. Out of Scope

- Wiring into existing landing pages (proto page only this pass).
- Real per-frame homography/tracking data — positions are hand-tuned percentages.
- Tailwind setup, React/Astro-island integration.
- Image production/compression (user supplies the 5 frames).

---

## 11. Verification

- `cd site && npm install && npm run dev` — visit `/ui/proto/tracking-hero/`.
- Scroll: confirm pin holds for 300vh, 5 frames crossfade, circle glides, possession
  counts up, pass line draws on state 3, heatmap fades on state 5.
- Toggle OS "Reduce motion": confirm no pin, frame 5 + static final overlay.
- `npm run build` succeeds; asset URLs resolve under `/ui/`.
- Placeholder behaviour acceptable until real frames are dropped in
  `site/public/images/sequence/` (component should not hard-crash on missing images).

# Korner Flags — Design System

> Coach-facing soccer analytics SaaS. Turn match footage and preprocessed
> analytics into a complete, meeting-ready review workflow.

This repository is the **design system** for Korner Flags: design tokens, brand
assets, documentation, and high-fidelity UI kits that let any design agent build
on-brand interfaces and marketing material for the product.

---

## 1. Product context

**Korner Flags** turns game video and preprocessed analytics into a complete
review workflow for soccer (football) coaches. It helps coaches **review
matches, explain tactics, evaluate player performance, discuss recruitment, and
present analysis in meetings.**

**Core product principle — lead with video and tactical understanding.** Stats
support the coach's discussion; they never dominate the product. The annotated
match video is always the hero.

**Audience:** coaches, analysts, recruiting staff, club directors, investors.

**Honesty bar:** the current demo is static and pre-generated using NC State
sample footage/data. Some analytics are still evolving — speed calibration,
passing, shots, assists, and player-name mapping. The UI must feel **honest and
credible without overclaiming.** Player IDs are shown instead of names; speed is
muted and marked "calibration under review"; estimated metrics carry plain-English
captions.

### Surfaces / pages
1. **Landing page** — marketing homepage for outreach, demos, investors.
2. **Dashboard** — logged-in product hub (plan status, recent analyses, queue).
3. **Past Matches** — scalable archive/history of analyzed matches.
4. **Match Analysis** — the flagship experience: hero video + tactical analytics.
5. **Payment / Checkout** — package selection and order summary.

### Sources
- **No external codebase or Figma was provided.** This system was designed
  from the Korner Flags product brief (May 2026). All brand assets (logo,
  palette, type pairing) were created here as the canonical first version.
- Sample data references **NC State** footage as demo-safe placeholder content.

---

## 2. Content fundamentals

**Voice:** plain English, the language of a sports analytics product — not an ML
research demo. Composed, tactical, credible. Speak to a coach who knows the game.

- **Person:** address the coach directly as **"you" / "your program."** The
  product refers to itself as **"Korner Flags"** (not "we" in product UI; "we" is
  acceptable in marketing/pilot copy).
- **Casing:** Sentence case for headings and buttons (`View sample analysis`,
  `Open analysis`). Avoid Title Case and ALL CAPS except small uppercase
  eyebrows/labels (`MATCH REVIEW`, `POSSESSION`).
- **Numbers:** always concrete and demo-safe — `54% / 46%`, `67.4 km`, `412
  passes`, `92:14`. Set numerals in the mono face for a data feel.
- **Honesty markers:** never overclaim. Use qualifiers where data is improving:
  - "Possession is estimated from processed match segments and intended for tactical review."
  - "Speed calibration under review."
  - "Some calibration-backed metrics are still being refined."
  - Roadmap features are labelled "Coming soon" / "Planned analytics" / "Premium roadmap" — never broken placeholders.
- **Emoji:** none. This is a professional, meeting-ready product.

**Use phrases like:** "Match review built for coaches" · "Turn footage into
coach-ready insights" · "Review movement, possession, passing, and tactical
shape" · "Video-first analysis with supporting metrics."

**Avoid phrases like:** "AI-powered revolution" · "Perfect player tracking" ·
"Instant VAR replacement" · "100% accurate detection" · "Automated intelligence
layer."

---

## 3. Visual foundations

The system is a **refined sports-analytics SaaS** look: navy ink, steel blue,
slate, and off-white surfaces. Calm, composed, premium, tactical.

### Palette
- **Navy ink** (`--ink-800` `#0F1C2E`) — hero backgrounds, the match-analysis
  stage, dark nav. The product's anchor color.
- **Steel blue** (`--steel-600` `#2C6BB0`) — the single primary action/accent.
  Used for buttons, links, active states, key data.
- **Slate neutrals** — full grey scale from `--slate-900` text to `--slate-150`
  hairline borders. Carries most of the UI.
- **Off-white surfaces** — `--surface-1` `#F7F9FC` app background, `#FFFFFF`
  cards. Generous whitespace.
- **Status:** pitch green (`--pitch-600`) Ready/live, used sparingly; amber
  Processing; slate Draft; muted brick (`--signal-600`) foul/alert.
- **Heat scale:** a 6-stop cool-steel → warm-brick ramp for heatmaps and
  intensity, deliberately avoiding neon.

### Type
- **Display:** **Source Serif 4** — editorial, credible, premium. Headlines,
  hero, section titles.
- **UI / body:** **Manrope** — modern geometric sans, sporty and clean. All
  interface text, body copy, buttons, labels.
- **Data / numerals:** **IBM Plex Mono** — tabular figures for stats, scores,
  durations, money. Gives the analytic, instrument-panel feel.
- Headings use tight tracking (`-0.02em`); eyebrows/labels use wide tracking
  (`0.08em`) uppercase.

### Spacing, radii, elevation
- **4px spacing base**; generous premium rhythm (24–96px section gaps).
- **Radii:** 6–14px on cards and controls; pills for chips/status; the big video
  stage uses 14–20px.
- **Shadows:** soft and low-contrast — `--shadow-sm`/`--shadow-md` on cards,
  `--shadow-lg` on overlays, a deep `--shadow-ink` for dark hero panels.
  No harsh drop shadows.

### Backgrounds, motion, states
- **Backgrounds:** flat off-white in the app; navy-ink full-bleed for hero/stage.
  Subtle pitch-line motifs (thin hairline geometry) may decorate dark panels —
  no busy gradients, no glassmorphism, no neon.
- **Borders:** 1px `--border`/`--border-soft` hairlines everywhere; cards are
  defined by border + soft shadow rather than heavy fills.
- **Motion:** minimal and restrained. 120–320ms, `--ease-out`. Fades and small
  translates only. No bounces, no parallax gimmicks.
- **Hover:** controls darken (steel-600 → steel-700) or gain a faint steel tint
  fill; cards lift with a slightly deeper shadow. **Press:** subtle darken; no
  large scale changes (small controls may scale to 0.98).
- **Imagery:** cool-toned, composed; video/heatmap placeholders sit on navy with
  thin framing. Player thumbnails and pitch visualizations are framed, never
  bleeding raw.

### Cards
Defined by `--surface-0` fill, 1px `--border`, `--radius-md/lg`, and
`--shadow-sm`. Hover lifts to `--shadow-md`. Stat cards pair a small uppercase
label with a large mono numeral.

---

## 4. Iconography

- **System:** **[Lucide](https://lucide.dev)** — clean, consistent 1.75–2px
  stroke icons that match the calm, analytic feel. Loaded via CDN
  (`lucide@latest`) in UI kits and rendered inline as SVG.
- **Why Lucide:** open-source, neutral, geometric; reads as "instrument panel"
  rather than playful. ⚑ FLAG: this is a substitution chosen for the system —
  no icon set was provided in a brief. Swap if the product adopts a different set.
- **Usage:** stroke icons sized 16/18/20px inline with text; 24px in nav. Icons
  inherit `currentColor` and sit in steel-600 (active) or slate (default).
- **No emoji.** No unicode-character icons. The brand mark (corner flag) is the
  only bespoke glyph — see `assets/logo-mark.svg`.

---

## 5. Index / manifest

Root files:
- **`README.md`** — this file.
- **`colors_and_type.css`** — all design tokens (color, type, spacing, radii,
  shadow, motion) as CSS variables, plus semantic type classes (`.kf-h1`,
  `.kf-body`, `.kf-stat`, …). Import this into any artifact.
- **`SKILL.md`** — Agent-Skills-compatible entry point (read for a quick map).

Folders:
- **`assets/`** — `logo-mark.svg` (corner-flag brand mark) and brand imagery.
- **`preview/`** — design-system cards (type, color, spacing, components) shown
  in the Design System tab.
- **`ui_kits/korner-flags/`** — high-fidelity, click-through recreation of the
  full product: landing, dashboard, past matches, match analysis, checkout.
  See its own `README.md` for the component list.

---

## 6. Caveats

- Brand assets (logo, palette, type pairing) are an **original first version**
  designed from the brief — there was no existing brand to match. Treat them as a
  proposed canonical system, open to iteration.
- Fonts load from **Google Fonts CDN**. To self-host for production, drop the
  woff2 files into `/fonts` and swap the `@import` for `@font-face`.
- Icons use **Lucide** as a documented substitution.

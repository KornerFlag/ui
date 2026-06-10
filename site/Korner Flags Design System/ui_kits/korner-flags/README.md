# Korner Flags — UI kit

High-fidelity, click-through recreation of the Korner Flags product, built on
the design system tokens (`colors_and_type.css`) and kit styles (`styles.css`).

Open **`index.html`** to run it. Hash-routed flow:

| Route | Screen |
|---|---|
| `#/` | Landing (marketing homepage) |
| `#/dashboard` | Dashboard (logged-in hub) |
| `#/matches` | Past Matches (archive, grid + table) |
| `#/analysis/:id` | **Match Analysis** — the flagship experience |
| `#/checkout` | Pricing & checkout |

Everything is wired so you can walk the full journey: landing → view sample →
dashboard → past matches → open an analysis room → choose a package → checkout →
back to dashboard.

## Files
- `index.html` — loads React/Babel + every component, mounts the app.
- `app.jsx` — hash router + `go(path)` navigation helper.
- `icons.jsx` — `<Icon name size stroke/>` inline-SVG set (Lucide path data).
- `data.jsx` — `window.KF_DATA` mock/static demo content (demo-safe values).
- `components.jsx` — primitives: `Logo`, `PitchLines`, `HeatPitch`, `VideoFrame`,
  `StatCard`, `StatusBadge`, `SectionHead`.
- `cards.jsx` — composites: `MatchCard`, `MatchRow`, `RoadmapCard`, `MiniPitch`.
- `nav.jsx` — `MarketingHeader`, `ProductShell` (sidebar + topbar).
- `Landing.jsx`, `Dashboard.jsx`, `PastMatches.jsx`, `Checkout.jsx` — screens.
- `analysis-panels.jsx` — `PossessionSplit`, `PassingStatsPanel` (incl. passing
  network), `RunningOutput`, `HeatmapReview`, `RoadmapSection`.
- `MatchAnalysis.jsx` — flagship assembly: hero video + analytics surfaces.

## Conventions
- Each component file ends with `Object.assign(window, {…})` so screens can use
  components across Babel script scopes.
- Pitch / heatmap / passing-network visuals are **data-viz placeholders** drawn
  from positioning data — search `HINT:` for spots to drop in real footage,
  thumbnails, and heatmap images.
- Stats use `window.KF_DATA`; player IDs stand in until roster names are mapped;
  sprint speed is intentionally muted ("calibration under review").

## Asset replacement
Look for `HINT:` comments and the gradient/`MiniPitch` thumbnails — replace with
real match footage `<video>`/posters, thumbnail images, and generated heatmaps.
Paths are relative for GitHub-Pages-style hosting.

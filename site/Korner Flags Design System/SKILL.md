---
name: korner-flags-design
description: Use this skill to generate well-branded interfaces and assets for Korner Flags (a coach-facing soccer analytics SaaS), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — product context, content fundamentals, visual foundations, iconography, index.
- `colors_and_type.css` — all design tokens (color, type, spacing, radii, shadow, motion) + semantic type classes. Import this first.
- `assets/` — `logo-mark.svg` (corner-flag brand mark).
- `preview/` — design-system reference cards (type, color, spacing, components).
- `ui_kits/korner-flags/` — runnable, click-through recreation of the full product with reusable JSX components. See its `README.md`.

## Essentials
- **Voice:** plain English for coaches; sentence case; honest about evolving data; no emoji; lead with video, stats support.
- **Type:** Source Serif 4 (display) · Manrope (UI) · IBM Plex Mono (data/numerals).
- **Color:** navy ink `#0F1C2E`, steel-blue primary `#2C6BB0`, slate neutrals, off-white surfaces; pitch-green status used sparingly. No neon, no purple AI gradients, no glassmorphism.
- **Icons:** Lucide (documented substitution).

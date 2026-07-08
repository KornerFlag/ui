# UI Review — Landing Page (Baseline-style soccer replica)

**Audited:** the rebuilt landing on `feat/bg-video` — a faithful replica of the "Baseline"
reference, soccer-ified for Korner Flag.
**Baseline standard:** the reference screenshot + `WEBSITE-DESIGN-RULES.md` (the design
constitution added this session).
**Date:** 2026-07-05 · supersedes the earlier `03-UI-REVIEW.md` (that code is gone).
**Method:** headless Chrome screenshots at 1440 (desktop) and 390 (mobile), plus a focus
close-up. No live click-through of the mobile menu in headless (markup + toggle logic
verified by inspection).

## Score — 23 / 24

| Pillar | Score | Note |
|---|---|---|
| Copywriting | 4/4 | Specific, plain, coach-facing; real demo numbers; testimonial honestly labelled |
| Visuals | 4/4 | Generated pitch + real tracked frames + refined custom heatmap + moving tracked ball |
| Color | 4/4 | Neutral gray · near-black · one green accent; no purple/blue/pink, no gradients |
| Typography | 3/4 | Switzer, bold grotesque headings, good scale — single family (matches ref, not a pairing) |
| Spacing | 4/4 | Consistent 4px scale, generous section rhythm, adapts on mobile |
| Experience | 4/4 | Working mobile menu, scroll-aware nav, focus-visible, reduced-motion, one restrained motion |

## Section map (reference → build)

| Reference | Build |
|---|---|
| Hero "Master the Game. Anytime." | Full-bleed generated pitch, goals both ends, **moving tracked ball**, "Master the match. Anytime." |
| Tennis Balance Focus | `ProofBlock` — real tracked frame + 54% / 408 stats, heading + strip + copy |
| Training Paths (3 cards) | `FeatureGrid` — Passing / Formation / Movement photo cards |
| Performance Gear band | `GearBand` — full-bleed band + Match room / Heatmaps / Clips cards |
| Club Memberships | `Memberships` — Starter (Free) / Season / Club, real free tier, no invented prices |
| Testimonial | `Testimonial` — representative quote (labelled) |
| World-Class Courts band | `WorldClassBand` — full-bleed closing band + free-analysis CTA |
| Footer | dark multi-column, Korner Flag brand |

## Vibe-code checklist (WEBSITE-DESIGN-RULES §9) — all NO ✓

- Purple/violet dominant? **No** (green/neutral).
- Purple/blue/pink gradients? **No.**
- Gradient-filled headline words? **No.**
- Row of giant meaningless stats? **No** — the only numbers (54% possession, 408 passes)
  are real demo-match figures on an image, not a vague hero stat row.
- Emoji in headings? **No.**
- "Why Choose us" / SaaS slogan? **No.**
- Everything centered in one column? **No** — asymmetric editorial composition.
- Default Inter/system as the whole system? **No** — Switzer.
- Frosted-glass + soft-glow cards? **No** — the heatmap glow was fixed; only small on-photo
  pills use a mild blur (see below).
- Breaks / unstyled on mobile? **No** — verified at 390px, nav collapses to a working menu.

## What I changed this pass

- **Heatmap** rebuilt: dropped the `screen` blend + bright yellow that read as an AI
  light-leak; now muted amber→green zones over pitch lines — a real heatmap.
- **Mobile menu** added: the nav previously just hid its links (a §7 failure). Now a
  hamburger opens a full panel (links + CTA), closes on link/Esc, locks body scroll.
- **Scroll-aware nav**: fixed overlay nav gains a solid light background once scrolled off
  the hero, so it stays legible over light content and the hamburger is always reachable.

## Remaining (minor)

- **Typography is single-family** (Switzer for display + body). Faithful to the reference,
  but `WEBSITE-DESIGN-RULES §3` nudges toward a display+body pairing — worth a look if we
  want more character (e.g. a serif for long copy).
- **Chanel's "remove one thing":** the small on-photo pills (`hero-proof`, ball label) use a
  mild backdrop-blur — the one whiff of glassmorphism left. Could drop the blur.
- **Testimonial + plan pricing are placeholders** — swap for a real coach quote and real
  pricing when available.
- Mobile-menu open state verified by code, not screenshot — click-test in a real browser.

# Korner Flags

## What This Is

AI-powered soccer/football video analysis tool. Takes any uploaded match video, runs YOLO11 detection + ByteTrack tracking, classifies teams by jersey color, calculates possession/speed/distance, and outputs an annotated video with stats overlay. Built to pitch to soccer coaches and demonstrate generalization across different teams, fields, and camera setups.

## Core Value

A coach can drop in any match video and immediately see annotated footage with player tracking, possession %, and speed/distance stats — no setup, no expertise required.

## Requirements

### Validated (v1.0)

- ✓ CLI pipeline processes any soccer video (python main.py --input video.mp4) — v1.0
- ✓ YOLO11 + ByteTrack detects and tracks players/ball with persistent IDs — v1.0
- ✓ KMeans jersey color clustering assigns players to teams — v1.0
- ✓ Possession % calculated with 15-frame smoothing — v1.0
- ✓ Player speed (km/h) and distance (m) via perspective transform — v1.0
- ✓ Annotated video output (ellipses, triangles, overlays) — v1.0
- ✓ Stats JSON output alongside annotated video — v1.0
- ✓ Camera movement estimation via optical flow — v1.0
- ✓ positions.json export (1Hz per-player coordinates) for heatmap generation — v1.0
- ✓ Team heatmap PNGs via mplsoccer — v1.0
- ✓ GitHub Releases video hosting (CDN URLs, no repo size limit) — v1.0
- ✓ Static demo site on GitHub Pages (Astro, GitHub Actions CI/CD) — v1.0
- ✓ Manifest-driven clip gallery with annotated video player (Plyr) — v1.0
- ✓ Stats visualizations: possession bar, speed/distance tables, coming-soon cards — v1.0
- ✓ Team heatmap display on clip pages (two-column, team-colored) — v1.0
- ✓ 2-clip NC State D1 gallery, plain-English "How It Works", zero ML jargon — v1.0

### Active (v2.0)

- [ ] Pass detection — identify ball transfers between players
- [ ] Shot detection — detect goal attempts, tag on/off target
- [ ] Assist tagging — link pass immediately preceding a shot to the assisting player
- [ ] Perspective calibration — pitch keypoint detection to replace estimated vertices (fixes ~268 km/h ghost speeds)
- [ ] Tracking stability — reduce ByteTrack ID switches and ghost players
- [ ] Individual player heatmaps — static PNG per player (primary); interactive player-toggle (stretch)
- [ ] Site updates — display event stats and per-player heatmaps on clip pages

### Out of Scope

- Live video upload + cloud processing — deferred to Phase 2 web app (needs GPU backend, too complex for 1-2 week demo deadline)
- Real-time processing — latency requirements incompatible with current pipeline
- Mobile app — not needed for coach demo
- Multi-match comparison dashboard — future feature after validated

## Current Milestone: v2.0 Advanced Analytics

**Goal:** Upgrade the pipeline with event detection (passes, shots, assists), calibrated accuracy (real pitch keypoints), and per-player heatmaps — all delivered through the existing static demo site.

**Target features:**
- Pass, shot, and assist detection
- Perspective calibration + tracking stability improvements
- Individual player heatmaps (static PNGs; interactive stretch)
- Site updates for new stats and per-player heatmaps

## Context

- **Current state:** v2.0 in progress (started 2026-03-24). v1.0 MVP shipped (2026-03-20) — demo site live at krishnaikgaunekar.github.io/Korner-Flags_stats/ with 2 NC State clips, annotated video, stats, heatmaps, and plain-English explainer. Full pipeline working locally.
- **Demo target:** NC State soccer coaching staff — site is ready to share
- **Domain:** Custom domain available for deployment when needed
- **Codebase state:** ~4,500 LOC Python + Astro/TypeScript. Perspective transform uses estimated pitch vertices (no calibration). No test suite for pipeline inference code. `tests/` covers data export and heatmap generation only.
- **PRD:** `docs/Korner-Flags-PRD.docx`

## Constraints

- **Timeline:** 1-2 weeks to working demo — static site first, backend upload later
- **Hosting:** GitHub Pages (static) for demo; FastAPI + Next.js backend planned for Phase 2
- **Tech stack:** Python, ultralytics YOLO11, roboflow supervision, OpenCV, scikit-learn — keep existing stack
- **Video footage:** Must use NC State D1 soccer clips specifically for the coaching demo
- **Processing:** Videos processed locally, results uploaded to repo — no cloud GPU required for Phase 1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site first (GitHub Pages) | 1-2 week deadline makes backend too risky; pre-processing locally is reliable and zero server cost | ✓ Shipped — site live |
| YOLO11 + ByteTrack for tracking | Industry-standard combo for sports tracking; already implemented and working | ✓ Good |
| KMeans jersey color for team assignment | No hardcoded player IDs needed; generalizes to any team | ✓ Good |
| GitHub Releases for video CDN | Bypasses 100 MB GitHub Pages file limit; stable CDN URLs | ✓ Good |
| mplsoccer for heatmaps | Simple static PNGs; no browser-side JS complexity for v1 | ✓ Good — deferred interactive for v1.1 |
| Plyr for video player | Open-source, CSS-customizable, no server dependency | ✓ Good |
| FastAPI + Next.js for Phase 2 web app | Standard stack for ML-backed web apps; clean separation of concerns | — Planned for v1.1+ |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 — milestone v2.0 started*

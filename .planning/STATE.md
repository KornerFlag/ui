---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Advanced Analytics
status: ready_to_plan
stopped_at: Roadmap created for v2.0 — 5 phases (7-11), 15 requirements mapped
last_updated: "2026-03-25T00:00:00.000Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value:** A coach can drop in any match video and immediately see annotated footage with player tracking, possession %, and speed/distance stats — no setup, no expertise required.
**Current focus:** Phase 7 — Tracking Stability (first phase of v2.0)

## Current Position

Phase: 7 of 11 (Tracking Stability)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-25 — v2.0 roadmap created (5 phases, 15 requirements)

Progress: [░░░░░░░░░░] 0% (v2.0)

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.0 Phase 01-03]: Speed values hit 268 km/h — known issue from estimated pitch vertices; Phase 8 calibration fixes this
- [v2.0 Init]: Build order is fixed: tracking stability (7) → calibration (8) → events (10); player heatmaps (9) can parallel Phase 8
- [v2.0 Init]: EventDetector outputs separate `events[]` list, does not write into `tracks{}` — additive schema, no breaking changes
- [v2.0 Init]: Per-player heatmap URLs live in `stats.players[id].heatmap_url`, not in `manifest.json`
- [v2.0 Init]: Possession smoothing (15-frame) and pass detection (velocity) are independent systems — document explicitly in stats JSON

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 8]: Pitch keypoint model (Roboflow, mAP 0.99 on training data) is untested on NC State footage — may need 50-100 frame annotation and fine-tuning if fewer than 10 confident keypoints detected per frame
- [Phase 7]: ByteTrack parameter values are community-validated; must confirm empirically on NC State clips by measuring unique ID count before and after
- [General]: Confirm `ultralytics >= 8.1.0` before starting Phase 8 — YOLO11-pose requires 8.1.0; v1.0 specified >= 8.0.0

## Session Continuity

Last session: 2026-03-25
Stopped at: Roadmap written — Phase 7 ready to plan
Resume file: None

# Roadmap: Korner Flags

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-03-20)
- 🚧 **v2.0 Advanced Analytics** — Phases 7–11 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-03-20</summary>

- [x] Phase 1: Pipeline Fixes and Validation (3/3 plans) — completed 2026-03-17
- [x] Phase 2: Data Export and Video Processing (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Site Scaffold and Video Playback (3/3 plans) — completed 2026-03-19
- [x] Phase 4: Stats Visualizations (2/2 plans) — completed 2026-03-19
- [x] Phase 5: Heatmap Visualizations (1/1 plan) — completed 2026-03-20
- [x] Phase 6: Polish and Demo Readiness (1/1 plan) — completed 2026-03-20

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v2.0 Advanced Analytics (In Progress)

**Milestone Goal:** Upgrade the pipeline with tracking stability, calibrated real-world coordinates, event detection (passes, shots, assists), and per-player heatmaps — all surfaced through the existing static demo site.

## Phase Details

### Phase 7: Tracking Stability
**Goal**: Players are tracked with stable IDs across the full clip, and ghost tracks are eliminated from all downstream outputs
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: TRACK-01, TRACK-02
**Success Criteria** (what must be TRUE):
  1. Running the pipeline on either NC State clip produces no more than 35 unique player track IDs for a 90-second segment (down from current inflated counts)
  2. Ghost player entries (fewer than 10 consecutive frames) are absent from the stats JSON, positions.json, and any future event output
  3. Speed and distance values in the stats JSON accumulate correctly for each physical player without fragmentation across split IDs
  4. Team color assignments are not corrupted by short-lived ghost IDs on re-entry frames
**Plans**: TBD

### Phase 8: Pitch Keypoint Calibration
**Goal**: The pipeline uses detected pitch keypoints to compute a calibrated homography, eliminating ghost speeds and providing accurate real-world coordinates for all spatial stats
**Depends on**: Phase 7
**Requirements**: CALIB-01, CALIB-02, CALIB-03
**Success Criteria** (what must be TRUE):
  1. The pipeline detects pitch keypoints via the YOLO11-pose model and computes a calibrated homography without crashing on either NC State clip
  2. When fewer than 4 keypoints are detected in a frame, the pipeline falls back to the proportional vertex estimate and logs a warning — no silent failures
  3. Maximum player sprint speed in the stats JSON does not exceed 40 km/h on either NC State clip (the 268 km/h ghost speed is gone)
  4. Calibrated homography is validated by back-projecting corner points within ±2 m of expected real-world coordinates before any downstream use
**Plans**: TBD
**UI hint**: no

### Phase 9: Individual Player Heatmaps
**Goal**: A heatmap PNG is generated for every player with sufficient position data and is available for upload alongside the annotated video
**Depends on**: Phase 7
**Requirements**: HEAT-01, HEAT-02
**Success Criteria** (what must be TRUE):
  1. After running the pipeline, one heatmap PNG exists per player who has at least 30 position samples, with the player ID and team color visible in the image
  2. Players with fewer than 30 position samples (ghost or short-appearance players) produce no heatmap file
  3. Per-player heatmap PNGs are uploaded to the GitHub Release for each clip alongside the annotated video and stats JSON
  4. The stats JSON includes a `heatmap_url` field for each player whose heatmap was generated
**Plans**: TBD
**UI hint**: no

### Phase 10: Event Detection
**Goal**: The pipeline detects passes, shots, and assists from calibrated tracking data and outputs structured event records in the stats JSON
**Depends on**: Phase 7, Phase 8
**Requirements**: EVENT-01, EVENT-02, EVENT-03, EVENT-04, EVENT-05
**Success Criteria** (what must be TRUE):
  1. The stats JSON contains a pass count per team that is plausible for the clip duration (no phantom passes during ball occlusions caused by interpolated frames)
  2. The stats JSON contains a shot count per team with an on-target / off-target split; shot counts are credible for D1 footage (not wildly exceeding 12 shots per 90 minutes of footage)
  3. The stats JSON contains an assist count per player, linked to shots via a 15-second lookback window
  4. The stats JSON contains an `events[]` array where each entry includes frame number, timestamp in seconds, event type, team, player IDs, and ball coordinates
  5. Event detection does not fire on interpolated ball positions — each ball track entry is tagged with its interpolation status and velocity calculations skip interpolated spans
**Plans**: TBD

### Phase 11: Site Updates
**Goal**: The demo site displays pass/shot event stats and per-player heatmaps on each clip page, replacing the coming-soon placeholders
**Depends on**: Phase 8, Phase 9, Phase 10
**Requirements**: SITE-09, SITE-10, SITE-11
**Success Criteria** (what must be TRUE):
  1. Each clip page shows pass count per team and shot count (total, on-target, off-target) per team sourced from the expanded stats JSON
  2. Each clip page shows an assist leaderboard listing player ID and assist count per team
  3. Each clip page shows a grid of per-player heatmap images organized by team, with player IDs as labels
  4. The coming-soon placeholder cards are removed; all three new stat sections are visible without any login or JavaScript requirement
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** 7 → 8 → 9 → 10 → 11 (Phase 9 may run in parallel with Phase 8)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Pipeline Fixes and Validation | v1.0 | 3/3 | Complete | 2026-03-17 |
| 2. Data Export and Video Processing | v1.0 | 4/4 | Complete | 2026-03-17 |
| 3. Site Scaffold and Video Playback | v1.0 | 3/3 | Complete | 2026-03-19 |
| 4. Stats Visualizations | v1.0 | 2/2 | Complete | 2026-03-19 |
| 5. Heatmap Visualizations | v1.0 | 1/1 | Complete | 2026-03-20 |
| 6. Polish and Demo Readiness | v1.0 | 1/1 | Complete | 2026-03-20 |
| 7. Tracking Stability | v2.0 | 0/TBD | Not started | - |
| 8. Pitch Keypoint Calibration | v2.0 | 0/TBD | Not started | - |
| 9. Individual Player Heatmaps | v2.0 | 0/TBD | Not started | - |
| 10. Event Detection | v2.0 | 0/TBD | Not started | - |
| 11. Site Updates | v2.0 | 0/TBD | Not started | - |

# Requirements: Korner Flags

**Defined:** 2026-03-25
**Core Value:** A coach can drop in any match video and immediately see annotated footage with player tracking, possession %, and speed/distance stats — no setup, no expertise required.

## v1.0 Requirements (Shipped 2026-03-20)

All 20 v1.0 requirements shipped. See `.planning/milestones/v1.0-REQUIREMENTS.md` for full list.

## v2.0 Requirements

### Tracking Stability

- [ ] **TRACK-01**: Pipeline filters ghost tracks (< 10 consecutive frames) from all downstream outputs (stats, heatmaps, events)
- [ ] **TRACK-02**: ByteTrack configured with tuned parameters (track_buffer, match_thresh) to reduce mid-clip ID switches on broadcast footage

### Calibration

- [ ] **CALIB-01**: Pipeline detects pitch keypoints via pretrained YOLO model and computes calibrated homography per frame
- [ ] **CALIB-02**: Pipeline falls back to proportional vertex estimate when fewer than 4 keypoints are detected in a frame
- [ ] **CALIB-03**: Player speed outputs fall within credible range (< 40 km/h max sprint) — no ghost speeds in any clip

### Event Detection

- [ ] **EVENT-01**: Pipeline detects pass events (ball transfer between same-team players with 5-frame minimum hold) and outputs pass count per team in stats JSON
- [ ] **EVENT-02**: Pipeline detects shot events (ball velocity spike toward goal region) and outputs shot count per team in stats JSON
- [ ] **EVENT-03**: Pipeline classifies each detected shot as on-target or off-target using goal bounding box derived from calibrated pitch coordinates
- [ ] **EVENT-04**: Pipeline tags assists (last pass to the shooter within a 15-second lookback window) and outputs assist count per player in stats JSON
- [ ] **EVENT-05**: Pipeline exports an `events[]` array in stats JSON with frame, timestamp_sec, event_type, team, player IDs, and ball coordinates per event

### Individual Player Heatmaps

- [ ] **HEAT-01**: Pipeline generates one heatmap PNG per tracked player with ≥ 30 position samples, labeled with player ID and team color
- [ ] **HEAT-02**: Per-player heatmap PNGs uploaded to GitHub Releases alongside the annotated video for each clip

### Site Updates

- [ ] **SITE-09**: Clip pages display pass count per team and shot count (total + on/off target split) per team
- [ ] **SITE-10**: Clip pages display assist leaders (player ID + assist count) per team
- [ ] **SITE-11**: Clip pages display per-player heatmap grid organized by team

## Future Requirements (v2.x+)

### Tracking Stability

- **TRACK-03**: BoT-SORT tracker (camera motion compensation) replaces ByteTrack for broadcast footage with heavy panning

### Event Detection

- **EVENT-06**: Event timestamps linked to video seek positions on demo site (click event → jump to frame)
- **EVENT-07**: Shot location minimap (dots on pitch diagram at shot coordinates)

### Heatmaps

- **HEAT-03**: Interactive player-toggle heatmap — click player ID on site to show/hide their PNG overlay

### Accuracy

- **CALIB-04**: Player name / jersey number mapping for NC State roster (labeled heatmaps and stats by name, not tracker ID)

## Out of Scope

| Feature | Reason |
|---------|--------|
| ML-based action spotting (T-DEED, SoccerNet) | Requires labeled training data and GPU training runs — weeks of work for marginal gain over rule-based on 2-clip demo |
| xG (expected goals) model | Requires large labeled shot dataset with defender/goalkeeper positions; creates false precision without sufficient data |
| ReID embedding (OSNet, FastReID) | Adds 15-25ms latency per frame; supervision doesn't natively support it (issue #1545); defer until BoT-SORT is proven insufficient |
| Real-time event detection | Requires streaming GPU infra — incompatible with static site architecture |
| Video upload web app (FastAPI + Next.js) | Deferred to v3+; v2.0 focus is ML accuracy not delivery mechanism |
| Offside detection | Requires frame-accurate calibration + simultaneous multi-player positional analysis — too complex for v2 |
| Goalkeeper-based on/off target | Goalkeeper frequently misclassified due to jersey ambiguity; goal-region bounding box is more reliable |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRACK-01 | Phase 7 | Pending |
| TRACK-02 | Phase 7 | Pending |
| CALIB-01 | Phase 8 | Pending |
| CALIB-02 | Phase 8 | Pending |
| CALIB-03 | Phase 8 | Pending |
| EVENT-01 | Phase 10 | Pending |
| EVENT-02 | Phase 10 | Pending |
| EVENT-03 | Phase 10 | Pending |
| EVENT-04 | Phase 10 | Pending |
| EVENT-05 | Phase 10 | Pending |
| HEAT-01 | Phase 9 | Pending |
| HEAT-02 | Phase 9 | Pending |
| SITE-09 | Phase 11 | Pending |
| SITE-10 | Phase 11 | Pending |
| SITE-11 | Phase 11 | Pending |

**Coverage:**
- v2.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 — traceability populated after v2.0 roadmap creation*

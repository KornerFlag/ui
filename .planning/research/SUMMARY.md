# Project Research Summary

**Project:** Korner Flags — Soccer Video Analysis (v2.0 Feature Additions)
**Domain:** Sports computer vision — batch video analysis pipeline extensions
**Researched:** 2026-03-24
**Confidence:** MEDIUM overall (HIGH for stack and architecture; MEDIUM for event detection accuracy)

## Executive Summary

Korner Flags v2.0 is a targeted upgrade of a complete and validated v1.0 pipeline. The four feature additions — pitch keypoint calibration, tracking stability improvements, event detection (pass/shot/assist), and individual player heatmaps — are well-understood problems with established open-source solutions. None require new ML training pipelines or server infrastructure. All are achievable through parameter tuning, two new Python modules, one new model weight file, and direct extensions of existing code. The only new package dependency is `roboflow/sports` (git install, no PyPI release), which provides canonical pitch keypoint real-world coordinates. Every other addition reuses the existing `ultralytics`, `supervision`, `opencv`, and `mplsoccer` stack.

The single most important architectural decision in v2.0 is build order. Tracking stability and pitch calibration are not just features — they are foundational data quality fixes. Ghost player IDs (ByteTrack ID switches) corrupt heatmaps, event logs, and assist attribution. Phantom 268 km/h speeds from estimated perspective vertices destroy coaching credibility. Both must be resolved before event detection is built on top of them. The research is unambiguous on this: fix the data quality first, then detect events on clean data. Any feature built on noisy input will require rework after the foundation is fixed.

The primary risks are (1) the pretrained pitch keypoint model may underperform on NC State footage and require fine-tuning on 50-100 annotated frames, and (2) velocity thresholds for pass/shot detection are not portable across clips until calibrated coordinates are in place. Both are manageable: the calibration module has a documented graceful fallback path (returns `None`, pipeline continues with estimated vertices), and threshold portability is resolved by completing calibration before finalizing event logic. A coaching demo that shows accurate sprint speeds and stable player labels is more credible than one with event counts derived from noisy tracks.

---

## Key Findings

### Recommended Stack

The v1.0 stack is extended, not replaced. All four v2.0 features are achievable without replacing any existing library.

**Core technologies:**
- `ultralytics` (>=8.1.0 required for YOLO11-pose): existing player/ball detection unchanged; adds a second model weight (`pitch_keypoints.pt`) for pitch keypoint detection — ultralytics-native inference, no new framework
- `supervision 0.27.0.post2`: ByteTrack already installed; tracking stability via three constructor parameter changes (`track_activation_threshold=0.35`, `lost_track_buffer=75`, `minimum_consecutive_frames=3`) — zero new dependencies
- `opencv-python-headless`: `cv2.findHomography` (RANSAC, N>4 point pairs) replaces `cv2.getPerspectiveTransform` (exactly 4 points, no outlier rejection) for calibration — already imported, no new import
- `mplsoccer>=1.6.0`: per-player heatmaps use identical `Pitch.bin_statistic` + `Pitch.heatmap` API as existing team heatmaps; the new code is ~20 lines filtering by `player_id`
- `roboflow/sports` (git install only): provides `SoccerPitchConfiguration` with 32 canonical pitch keypoint real-world coordinates as the reference frame for homography; no PyPI release, pin by commit hash in production
- Event detection: pure Python rule-based state machine over existing `tracks{}` dict — no library, no ML model, ~150-200 LOC; academic benchmarks confirm rule-based achieves F-score 0.93 for passes, 0.95 for shots on tracking data

**Critical version check required:** Confirm `ultralytics >= 8.1.0` with `pip show ultralytics` before starting the calibration phase. YOLO11-pose requires 8.1.0; the v1.0 pipeline specified `>=8.0.0`.

### Expected Features

**Must have (v2.0 table stakes):**
- Pass count per team — every commercial analytics tool (Wyscout, StatsBomb) shows pass counts first; absence makes the "event detection" milestone claim hollow
- Shot count per team with on/off target split — "how many shots, how many on target?" is the first attacking question coaches ask
- Individual player heatmaps (static PNG) — immediate follow-up to team heatmaps already on the demo site: "can I see just where Player 7 was?"
- Accurate real-world coordinates (calibrated) — ghost speeds (~268 km/h) actively destroy trust in all spatial stats; coaches with Hudl/GPS experience will notice immediately
- Tracking stability — invisible when working, immediately jarring when broken; prerequisite for all event accuracy

**Should have (v2.0 competitive additions):**
- Assist attribution with player ID — "Player 7 had 2 assists" is immediately actionable in a team session
- Site updates showing events table and per-player heatmap grid — connects pipeline output to coaching UI
- BoT-SORT tracker swap if NC State footage shows significant camera pan causing ID switches after ByteTrack tuning

**Defer to v2.x:**
- Shot map visualization (dots on pitch minimap at shot locations)
- Event timestamps with video seek links
- Interactive player-toggle heatmaps (JS image-swap on static site with pre-rendered PNGs)
- Player name/jersey number mapping (requires coaching staff to provide roster data)

**Defer to v3+:**
- ML-based action spotting (T-DEED, SoccerNet architecture) — requires labeled training data that does not exist
- xG model — needs large labeled shot dataset
- ReID embedding for tracking — defer until BoT-SORT proven insufficient
- Offside detection, foul/card detection

### Architecture Approach

The v2.0 architecture adds two new modules (`pitch_calibrator/` and `event_detector/`), tunes one existing module (`trackers/tracker.py` ByteTrack params), extends one script (`generate_heatmaps.py --per-player`), and adds two Astro components to the site. The existing staged track enrichment pattern — each module reads keys written by prior modules into `tracks{}` — is preserved exactly. EventDetector is the only genuinely new addition to the main pipeline sequence; it runs after all enrichment is complete and outputs a separate `events[]` list rather than writing into `tracks{}`. The stats JSON schema expands additively with no breaking changes to existing fields.

**Major components:**
1. `PitchCalibrator` (NEW module) — YOLO11-pose pitch keypoint model on first 3-5 frames; returns calibrated `pixel_vertices` (np.ndarray) or `None` on failure; called before ViewTransformer; fallback preserves existing behavior
2. `EventDetector` (NEW module) — deterministic state machine over fully-enriched `tracks{}` and `team_ball_control[]`; outputs `events[]` list; called after PlayerBallAssigner; ~150-200 LOC
3. ByteTrack parameter tuning — three constructor arguments in `Tracker.__init__`; `draw_events()` annotation method added
4. `generate_heatmaps.py --per-player` — per-player PNG generation with minimum-sample filter (≥30 samples at 1Hz) before rendering
5. `EventsTable.astro` + `PlayerHeatmapGrid.astro` (NEW site components) — reads expanded `stats.json`; no `manifest.json` schema changes needed

**Key integration rule:** Per-player heatmap URLs live in `stats.players[id].heatmap_url`, not in `manifest.json`. Player IDs are not stable across clips; manifest stays clip-level metadata only.

### Critical Pitfalls

1. **Pass detection fires on interpolated ball positions (V2-1)** — The pipeline linearly interpolates missing ball positions before possession evaluation. Velocity triggers at the seam between interpolated and real tracking produce phantom passes during every ball occlusion. Prevention: tag each ball track entry with `interpolated=True` during `interpolate_ball_positions`; pass/shot velocity calculations skip any span that includes an interpolated frame. Without this, pass counts are nonsense — implement before any event logic.

2. **Pitch keypoint calibration fails silently and corrupts all spatial stats (V2-5)** — `cv2.findHomography` does not validate that the result is geometrically reasonable. A single misidentified keypoint produces a plausible-looking but wrong homography, yielding phantom speeds identical to the current 268 km/h problem with no error raised. Prevention: after computing homography, validate by mapping corner points back through the transform (check within ±2m of expected real-world coordinates); reject and fall back to estimated vertices if validation fails; log a warning. Gate this check before the calibrated transform is used for any downstream calculation.

3. **ByteTrack ID switches corrupt every downstream feature (V2-4, V2-7, V2-8, V2-9)** — Ghost IDs produce: wrong team assignments cached on bad first frames, fragmented per-player heatmaps (confetti), missing or wrong assist attribution, and inflated pass counts from possession-chain breaks. Prevention: tune ByteTrack parameters first; apply minimum-frame filter (≥1 second / ~25 frames) to exclude ghost player IDs from stats, heatmaps, and event detection. Measure unique ID count before and after — target ≤35 unique IDs per 90-second clip with 22 players.

4. **Velocity threshold for pass/shot detection is not portable across clips (V2-2)** — Any absolute m/s threshold tuned on one clip will over- or under-fire on another until pitch calibration is complete, because pixel-to-metre conversion currently varies by zoom and camera angle. Prevention: do not finalize absolute velocity thresholds until calibration phase is done; use clip-relative percentile thresholds as a transitional measure; re-validate thresholds on at least two different NC State clips after calibration ships.

5. **Shot detection conflates clearances, goalkeeper punts, and long balls with shots on goal (V2-3)** — Velocity spike alone is insufficient to identify a shot. D1 games average ~12 shots per 90 minutes — any shot count exceeding 12 per 90 seconds indicates false positives. Prevention: shot detection requires three conditions simultaneously: (a) origin in attacking half, (b) ball trajectory within ±30 degrees of goal-center heading, (c) possession attributed to attacking team. Goal mouth coordinates require calibration; calibration phase is a hard prerequisite for reliable shot detection.

---

## Implications for Roadmap

Based on combined research, the build order is dictated by data quality dependencies. Features built on noisy data must be reworked after the data is fixed. The five-phase structure below is directly derived from the build order specified in ARCHITECTURE.md and is consistent with pitfall prevention requirements across all four research files.

### Phase 1: Tracking Stability

**Rationale:** ID switches are the root cause of corruption in every downstream v2.0 feature — events, heatmaps, assist attribution. This is the lowest-effort, highest-leverage fix: three ByteTrack constructor parameter changes and a minimum-frame ghost filter in `generate_stats()`. Must come first because every other phase depends on clean track IDs.

**Delivers:** Stable player IDs across clips; ≤35 unique IDs per 90-second clip; ghost player entries removed from stats JSON and positions.json; accurate speed/distance accumulation per physical player; team assignment corruption reduced.

**Addresses:** Table stakes: tracking stability (prerequisite for all event features). Pitfalls V2-4, V2-7, V2-8, V2-9.

**Avoids:** Building event detection on fragmented tracks, which would require full rework after this fix.

**Research flag:** Standard patterns — no additional research needed. ByteTrack parameter values are documented in supervision GitHub discussions and confirmed in soccer tracking literature. Skip `gsd:research-phase`.

---

### Phase 2: Pitch Keypoint Calibration

**Rationale:** Ghost speeds (~268 km/h) from estimated perspective vertices destroy coaching credibility. Calibration also provides goal-mouth coordinates required for accurate shot detection direction filtering. Must complete before event detection so that all spatial statistics and event coordinates are in real-world metres. Soft dependency on Phase 1 (cleaner tracks improve which keypoints are selected as reliable).

**Delivers:** New `pitch_calibrator/` module; `pitch_keypoints.pt` model weight in `models/`; `--calibrate` CLI flag; all `position_transformed` values in real-world metres; speeds in believable 25-35 km/h range for fast players; validated fallback path (logs warning, continues with estimated vertices on failure).

**Addresses:** Table stakes: accurate real-world coordinates. Pitfalls V2-5, V2-6.

**Uses:** `ultralytics` YOLO11-pose task; `roboflow/sports` `SoccerPitchConfiguration`; `cv2.findHomography` with RANSAC.

**Avoids:** Finalizing velocity thresholds for event detection before the coordinate system is reliable.

**Research flag:** Needs `gsd:research-phase` during planning. The pretrained Roboflow model (mAP 0.99 on training data) may underperform on NC State footage with different lighting, camera angles, or pitch marking visibility. Fine-tuning strategy and fallback path need to be scoped before committing to implementation. This is the single highest-uncertainty item in v2.0.

---

### Phase 3: Individual Player Heatmaps

**Rationale:** Lowest-effort, highest-coaching-utility feature in v2.0. `positions.json` already exports per-player coordinates at 1Hz from v1.0 — the only new work is filtering by `player_id` and calling the existing mplsoccer API. Can be developed in parallel with Phase 2 (calibrated coordinates improve positional accuracy but are not required for heatmaps to function). Hard dependency on Phase 1 ghost filter to avoid confetti heatmaps.

**Delivers:** `generate_heatmaps.py --per-player` flag; per-player PNG files (`player_{id}_{team}_heatmap.png`) for players with ≥30 position samples (≥60 seconds for demo display); `heatmap_url` field added to each player entry in `_stats.json`; ghost player heatmaps filtered out.

**Addresses:** Table stakes: individual player heatmaps. Pitfalls V2-8, V2-10.

**Avoids:** Generating heatmaps for ghost player IDs (Phase 1 filter prevents this); Gaussian sigma scale issue addressed by expressing smoothing in metres, not bin counts.

**Research flag:** Standard patterns — mplsoccer API confirmed in official docs; direct extension of existing team heatmap code. Skip `gsd:research-phase`.

---

### Phase 4: Event Detection (Pass / Shot / Assist)

**Rationale:** Hard dependency on Phases 1 and 2. Building event detection before tracking stability and calibration are solid produces unreliable events requiring full rework. New `event_detector/` module (~150-200 LOC rule-based state machine) running after all track enrichment. Assist detection is the last sub-feature — it is pure composition of pass + shot detection and cannot be built until those exist.

**Delivers:** New `event_detector/` module; `events[]` array in `_stats.json` with per-event `frame_num`, `time_seconds`, `type`, `player_id`, `team`; per-player pass/shot/assist counts in `stats.players`; `draw_events()` method in `Tracker` for in-video event labels; interpolated-frame tagging to prevent false events.

**Addresses:** Table stakes: pass count per team, shot count with on/off target, assist attribution. Pitfalls V2-1, V2-2, V2-3, V2-4, V2-9, V2-11, V2-12.

**Key implementation guard:** Interpolated ball frame tagging (Pitfall V2-1) and camera cut detection (Pitfall V2-11) must be implemented at the start of this phase, before any event logic is written. All velocity thresholds must be validated on at least two different NC State clips before marking the phase complete.

**Research flag:** No `gsd:research-phase` needed for event logic itself (rule-based approach is well-documented in literature). However, build in a threshold-tuning checkpoint after initial implementation — validate pass/shot counts against manual inspection of both NC State clips before proceeding to site integration.

---

### Phase 5: Site Updates

**Rationale:** Always last — depends on the finalized output file formats from all pipeline phases. `EventsTable.astro` and `PlayerHeatmapGrid.astro` are additive Astro components that read from the expanded `_stats.json` schema. No `manifest.json` changes required. `ComingSoonCards.astro` is removed or repurposed since those features are now real.

**Delivers:** `EventsTable.astro` component rendering `stats.events[]`; `PlayerHeatmapGrid.astro` rendering per-player heatmap URLs from `stats.players`; `[slug].astro` updated to import both components; `ComingSoonCards.astro` replaced.

**Addresses:** Site display of all v2.0 features to coaching audience.

**Avoids:** Adding server-side dependencies (Plotly Dash, Folium) — site is GitHub Pages (static); interactive heatmap toggle deferred to v2.x as a JS image-swap with pre-rendered PNGs (no server needed).

**Research flag:** Standard patterns — Astro component composition is well-documented; reads data from existing JSON import pattern already in `[slug].astro`. Skip `gsd:research-phase`.

---

### Phase Ordering Rationale

- **Phases 1-2 before 3-4:** Data quality (track stability + calibration) must precede features that consume that data. This is the primary dependency chain identified across all four research files independently.
- **Phase 3 parallel-capable with Phase 2:** Individual heatmaps do not depend on calibration (they degrade gracefully without it). Can be developed concurrently with Phase 2 to compress the total timeline.
- **Assist detection is last within Phase 4:** It is derived entirely from pass + shot detection with no unique logic; it cannot be built before the events it depends on exist.
- **Phase 5 after all pipeline phases:** Site depends on the finalized `_stats.json` schema; building it before the schema is stable causes rework.
- **BoT-SORT optional upgrade within Phase 1:** If NC State footage shows significant camera pan causing ID switches after ByteTrack tuning, swap to `sv.BoTSORTTracker` (supervision-native, adds Camera Motion Compensation). This is a within-Phase-1 decision measured by unique ID count diagnostic.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries confirmed via official docs and supervision GitHub issues; `roboflow/sports` API confirmed via repo inspection; YOLO11-pose version requirement needs one `pip show` check |
| Features | MEDIUM | Table stakes and prioritization grounded in competitive analysis (Wyscout, Trace, tryolabs) and coaching UX expectations; event accuracy figures from peer-reviewed literature but depend heavily on tracking quality which varies by footage |
| Architecture | HIGH | Build order and module boundaries derived from direct codebase analysis and peer-reviewed sports CV architecture literature; module separation decisions (EventDetector as its own module, calibration fallback design) are well-justified |
| Pitfalls | HIGH | 10 of 12 v2.0 pitfalls verified against specific codebase code paths (first-party, HIGH confidence); external sources are peer-reviewed or official repo issues |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **YOLO11-pose version requirement:** Confirm `pip show ultralytics` returns `>=8.1.0` before starting Phase 2. If `8.0.x`, upgrade and test for regressions in player/ball detection before proceeding.
- **Pitch keypoint model on NC State footage (highest uncertainty):** The pretrained Roboflow model reports mAP 0.99 on its training set. NC State stadium lighting, press-box camera angle, and pitch marking condition are untested. Budget time for 50-100 frame annotation and fine-tuning if validation shows fewer than 10 confident keypoints detected per frame. Define the validation gate before Phase 2 planning.
- **ByteTrack parameter tuning validation:** Recommended parameter values are from community findings. Must be validated empirically on the two existing NC State clips by counting unique track IDs before and after tuning. If ≤35 unique IDs per 90-second clip is not achieved, escalate to BoT-SORT.
- **Possession smoothing / pass detection independence (Pitfall V2-12):** The existing 15-frame possession smoothing threshold and raw ball-velocity pass detection will disagree on quick short passes. Research recommends treating them as independent systems and documenting that in the stats JSON explicitly rather than coupling the logic. This design choice needs to be made explicit at the start of Phase 4.
- **Coordinate system scope per clip (Pitfall V2-6):** Each clip's coordinate space is local to its camera angle. Multi-clip heatmap merging is not feasible in v2.0. This scope limitation should be documented on the demo site to avoid coaching confusion when comparing clips from different camera positions.

---

## Sources

### Primary (HIGH confidence)

- Supervision official docs + GitHub issues `#1044`, `#1001`, `#1545` — ByteTrack parameter names, defaults, community-validated tuning ranges for soccer tracking
- mplsoccer official docs (`mplsoccer.readthedocs.io`) — `bin_statistic` + `heatmap` API confirmed for per-player use
- Springer "Automatic event detection in football using tracking data" (2022) — deterministic possession-change state machine; F-scores 0.93 pass, 0.95 shot
- Springer "Automating assist identification in football" (2025) — assist lookback window design and edge cases
- arXiv 2410.07401 "Enhancing Soccer Camera Calibration Through Keypoint Exploitation" (2024) — keypoint + homography calibration approach
- TVCalib (`mm4spa.github.io/tvcalib`) — camera calibration methodology for sports broadcast
- Ultralytics GitHub discussion `#19784` — ByteTrack ID reassignment root causes
- Codebase direct inspection: `tracker.py`, `view_transformer.py`, `main.py`, `team_assigner.py`, `player_ball_assigner.py`, `camera_movement_estimator.py`, `generate_heatmaps.py`, `08fd33_4_annotated_stats.json`

### Secondary (MEDIUM confidence)

- Roboflow blog "Camera Calibration in Sports with Keypoints" — YOLO keypoint + findHomography pattern; 32-keypoint dataset reference
- Roboflow Universe `football-field-detection-f07vi` — pretrained 32-keypoint soccer pitch model (mAP 0.99 reported on training data)
- `github.com/roboflow/sports` — `SoccerPitchConfiguration` API; install via git
- PMC/PLOS One "Event detection in football: Improving the reliability of match analysis" (2024)
- PathCRF arXiv 2602.12080 (2025) — ball-free possession path inference
- arXiv 2411.08216 "Global Tracklet Association for Multi-Object Tracking in Sports" (2024)
- tryolabs.com "Automatically Measuring Soccer Ball Possession with AI" — possession and pass detection implementation patterns
- Improved ByteTrack for Soccer Multi-Player Tracking (GitHub) — parameter tuning validation for soccer
- SoccerNet Ball Action Spotting challenge results — event detection accuracy benchmarks

### Tertiary (LOW confidence / needs validation)

- Roboflow pitch keypoint model performance on NC State footage specifically — untested; mAP 0.99 on training data does not guarantee performance on NC State stadium conditions

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*

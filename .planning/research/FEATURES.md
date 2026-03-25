# Feature Research

**Domain:** Soccer video analysis — event detection, calibration, tracking stability, per-player heatmaps (v2.0 milestone)
**Researched:** 2026-03-24
**Confidence:** MEDIUM overall (rule-based heuristics HIGH; ML-based action spotting MEDIUM; coaching UX expectations MEDIUM from industry sources)

---

## Scope

This document covers the six feature categories in v2.0. v1.0 features (player/ball tracking, team classification, possession %, speed, distance, team heatmaps, annotated video, stats JSON, demo site) are shipped and excluded.

---

## Feature Landscape

### Table Stakes (Users Expect These)

For a coaching-audience product that claims "event detection," these are the minimum expectations. Missing these causes the v2.0 claim to ring hollow.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Pass count per team | Every commercial analytics tool (Wyscout, StatsBomb) shows pass counts as the first stat — it is the baseline measure of team work rate and possession quality | LOW | Rule-based: possession change between players on same team, sustained for N frames; already have ball-to-player assignments from v1.0 |
| Shot count per team with on/off target split | Coaches expect "how many shots, how many on target?" — a shot count without target classification feels like a raw number, not analysis | MEDIUM | Velocity heuristic + goal-region direction filter; on/off target needs goal-region definition (easier with calibration) |
| Assist tagging (last pass before shot) | Logical extension of pass + shot; coaches ask "who set up that chance?" before they ask anything else about attacking play | LOW (derived) | Pure composition of pass events + shot events + lookback window — no independent logic; only add after pass + shot exist |
| Individual player heatmaps (static PNG) | Team heatmaps are already live on the demo site; individual heatmaps are the obvious coach follow-up: "can I see just where Player 7 was?" | LOW | Direct extension of existing mplsoccer team heatmap code — filter positions.json by player_id; nearly free given existing data |
| Accurate real-world coordinates (calibrated) | Ghost speeds (~268 km/h currently) destroy trust in all spatial stats; coaches working with GPS and Hudl data will notice immediately | HIGH | Pitch keypoint detection + homography; pretrained YOLO keypoint model available (roboflow, mAP 0.99, 32 keypoints) |

### Differentiators (Competitive Advantage)

These raise the product above "student project" status toward something coaches would consider in a budget context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Shot on/off target with timestamps | Turns a stat into a coaching tool — coaches can seek to exact moments rather than just reading a count | MEDIUM | Requires shot event frame + video timestamp; demo site integration needed |
| Assist attribution with player ID | Makes the event log a coaching artifact — "Player 7 had 2 assists" is immediately actionable in a team session | MEDIUM | Accuracy bounded by tracking ID stability — breaks if IDs switch during pass-to-shot window |
| Pitch keypoint calibration (replaces estimated vertices) | Eliminates ghost speeds permanently; makes all spatial stats credible to coaches who are already skeptical of AI tools | HIGH | YOLOv8 keypoint model from roboflow/sports; drop-in replacement for view_transformer estimated vertices |
| Tracking ID stability (no ghost players, no ID switches mid-clip) | All downstream event features break noisily when IDs switch — stable tracking is the silent prerequisite for everything | MEDIUM | BoT-SORT (supervision-native) + parameter tuning + ghost track filter |
| Player-specific heatmap with coaching context (title, player number) | Named, labeled heatmaps feel like a professional deliverable vs an unlabeled image | LOW | Label each PNG with player_id or jersey number; title rendered via mplsoccer |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time event detection | Feels like the natural end-state for a pipeline tool | Requires GPU streaming infra, sub-100ms latency — incompatible with current static-site architecture and 1-2 week timeline | Pre-process locally, publish results to demo site |
| ML-based action spotting (T-DEED, SoccerNet architecture) | Higher theoretical accuracy for fine-grained event classification | Requires labeled training data, GPU training runs, temporal video models — weeks of work for marginal gain over rule-based on focused demo clips | Rule-based pass/shot detection: sufficient for D1 coaching demo, fast to build, explainable |
| On-target/off-target via goalkeeper tracking | Feels semantically correct (goalkeeper saves = on target) | Goalkeeper is frequently misclassified as a player (jersey color ambiguity), tracks unreliably, and adds a hard dependency on goalkeeper ID stability | Goal-region bounding box heuristic from calibrated pitch coordinates |
| xG (expected goals) model | Industry buzzword coaches have heard; high prestige | Requires large labeled shot dataset with defender/goalkeeper positions — cannot be trained from 2-clip demo; creates false precision | Report shot location coordinates as proxy for shot quality; defer xG to v3+ |
| Interactive player-toggle heatmaps (JS) | Feels like a premium product feature | Complex client-side state on a static Astro site — either heavy JS bundling or iframe complexity; 3-5 extra days for marginal UX improvement | Static per-player PNG gallery — one image per player, same coaching utility, zero client complexity |
| Per-frame event annotation baked into video | Coaches want to see passes/shots highlighted in the video stream | Frame-accurate event detection is hard; drawing event icons at every detected frame adds rendering complexity and false positives become very visible | Timestamp list + video seek integration on demo site; separate event log in JSON |

---

## Feature Dependencies

```
[Pitch Keypoint Calibration]
    └──required-for (hard)──> [Accurate speed / distance stats]
    └──required-for (soft)──> [Goal region definition for shot on/off target]
    └──improves──> [All spatial coordinates in stats JSON and events]

[Tracking Stability (ID switch reduction)]
    └──required-for (soft)──> [Assist Attribution] — ID must stay consistent across pass→shot window
    └──improves──> [Per-player heatmaps] — noisy IDs create merged/split heatmaps
    └──improves──> [Pass Detection] — possession chain breaks on ID switch

[Ball Tracking Quality (existing v1.0)]
    └──required-for──> [Pass Detection] — possession changes need reliable ball-to-player assignment
    └──required-for──> [Shot Detection] — ball velocity / trajectory analysis

[Pass Detection]
    └──required-for──> [Assist Tagging]

[Shot Detection]
    └──required-for──> [Assist Tagging]
    └──required-for──> [On/Off Target Classification]

[Per-player Position Data (positions.json — existing v1.0)]
    └──required-for──> [Individual Player Heatmaps]
```

### Dependency Notes

- **Pitch keypoint calibration is a force-multiplier.** It unblocks accurate shot coordinates, goal-region heuristics, and credible speed/distance stats in a single implementation. Complete it before finalizing event output formats so coordinates are in real-world meters, not pixels.
- **Tracking stability affects everything downstream.** ID switches corrupt the possession chain (pass detection), corrupt assist attribution (wrong player credited), and split per-player heatmaps across ghost IDs. Improve tracking before building event detection or accept significant noise in all downstream outputs.
- **Assist tagging has no unique logic.** It is pure composition of pass detection + shot detection + a lookback window (typically 5-15 seconds). Do not implement it as a standalone module; add it as a post-processing step in the event pipeline.
- **Individual heatmaps are nearly free.** positions.json already exports per-player coordinates at 1Hz from v1.0. The only new work is filtering by player_id and rendering one mplsoccer plot per player. Lowest-effort, high-value feature in v2.0.

---

## Feature Detail: Pass Detection

**What it is:** Identifying when the ball transfers from one player to another on the same team — possession changes from Player A (Team X) to Player B (Team X).

**Standard rule-based approach (verified against tryolabs/soccer-video-analytics and academic literature):**
1. Use existing ball-to-nearest-player assignment per frame (already in v1.0 pipeline)
2. Apply a minimum-frames threshold (e.g., 5+ consecutive frames of sustained possession) to confirm a possession event — prevents counting every brief contact as a new pass
3. Detect possession change: Player A → Player B, same team = pass event
4. A possession change to the opposing team = interception/turnover, not a pass
5. Record: frame number, timestamp_sec, passer_id, receiver_id, team, ball coordinates at event

**Edge cases to handle:**
- Ball out of frame: possession chain must be broken; do not log a pass when ball disappears
- Ball tracking interpolation frames (v1.0 already does linear interpolation for missing ball detections): suppress event detection during interpolated windows to avoid false possession changes
- Goalkeeper distribution: long kicks are passes by definition — no special handling needed unless the coaching team wants "long ball" vs "short pass" classification (defer)
- Dribbling: player touching ball across many frames — the minimum-frames threshold on the receiving player prevents dribble oscillation from generating false pass counts
- ID switch mid-possession: if a player's ID changes, the pipeline will falsely log a pass to a new receiver; tracking stability is a prerequisite for clean pass counts

**Data output per event:**
```json
{
  "frame": 1247,
  "timestamp_sec": 41.6,
  "team": "team_1",
  "passer_id": 7,
  "receiver_id": 3,
  "ball_x_m": 34.2,
  "ball_y_m": 18.1
}
```
Plus summary: `pass_counts: { "team_1": 18, "team_2": 12 }` in the stats JSON.

**Coaching UX expectation:** Pass count per team as a stat in the stats panel. Coaches understand this number immediately and compare it to possession % as a consistency check. Raw event log stays in JSON for later features.

**Confidence:** MEDIUM — rule-based detection works well when tracking is stable and ball tracking is reliable; degrades proportionally with tracking noise. Sufficient for demo clips.

---

## Feature Detail: Shot Detection

**What it is:** Detecting when a player attempts to score — ball leaves possession at high velocity directed toward the goal.

**Standard rule-based approach:**
1. Detect sudden ball velocity spike: ball displacement between consecutive frames exceeds a threshold (e.g., >4 m/frame in calibrated coordinates, or >30px/frame in pixel space as fallback)
2. Direction filter: ball trajectory vector points toward the goal region (within ±45 degrees of goal-center heading from current ball position)
3. Possession loss confirmation: the player nearest to the ball in the frame before the velocity spike loses possession immediately after (confirms kick rather than pass received at pace)
4. On/off target: check if ball trajectory intersects the goal frame bounding box (7.32m × 2.44m, positioned at pitch end in calibrated coordinates) — if yes, on target; if trajectory misses the frame, off target

**Goal region definition:**
- With keypoint calibration (preferred): use known FIFA pitch dimensions; goal position is known from calibrated homography
- Without calibration (fallback): define goal zone as the central 15-20% of the far vertical edge of the frame — crude but functional for a fixed broadcast camera with a consistent shooting angle

**Edge cases:**
- Clearances (defender high-velocity kick away from goal): filtered by direction — clearances point away from goal
- Long-range diagonal passes: high velocity but direction angle fails the goal-heading filter
- Ball leaves frame before reaching goal: classify as "result unknown"; do not force on/off target
- Goalkeeper save vs deflection: if trajectory would have intersected goal frame, classify on-target regardless of outcome — this matches the official soccer definition (shot on target = would have scored without intervention)
- Ball tracking loss mid-trajectory: incomplete trajectory; log the shot event without on/off target classification

**Expected accuracy:** ~70-80% correct on/off target classification with rule-based approach; ~85-90% with calibrated homography. Acceptable for coaching demo.

**Data output:**
```json
{
  "frame": 2891,
  "timestamp_sec": 96.4,
  "team": "team_2",
  "shooter_id": 11,
  "on_target": true,
  "ball_x_m": 84.1,
  "ball_y_m": 27.3,
  "goal_distance_m": 14.7
}
```
Plus summary: `shot_counts: { "team_1": { "total": 5, "on_target": 3 }, "team_2": { "total": 7, "on_target": 4 } }`.

**Coaching UX expectation:** Shot count + on/off target split per team displayed as a stat. Coaches immediately read this alongside possession and pass counts to assess attacking effectiveness. Optional stretch: shot locations plotted on a pitch minimap.

**Confidence:** MEDIUM — velocity heuristic is well-established in the literature; on/off target degrades without calibration.

---

## Feature Detail: Assist Tagging

**What it is:** Linking the last successful pass before a shot to the assisting player.

**Implementation (derived logic only):**
1. For each shot event, iterate backward through the pass event log
2. Find the most recent pass where `receiver_id == shot.shooter_id` and both are on the same team
3. Apply lookback window: the assisting pass must be within T seconds of the shot (recommend 10-15 seconds configurable; passes older than 30 seconds are not assists by any convention)
4. If a qualifying pass is found: record assister_id and assist frame; extend the shot event JSON object
5. If no qualifying pass: tag the shot as a "solo effort" (player dribbled into position without a preceding pass)

**Edge cases:**
- ID switch between pass reception and shot: wrong player credited — tracking stability prerequisite
- Set piece (corner kick → shot): the corner taker is the assister; rule works correctly because corner kicks register as possession change from corner-taker to receiver
- Multiple passes in the lookback window: only the immediately preceding pass counts as assist (standard soccer definition)
- Shooter self-creates (received no pass in window): tag as unassisted, do not log an assist

**Data output:** Extend each shot event with `assister_id: N` (or `assister_id: null` for solo efforts). Summary: `assist_counts: { "player_7": 2, "player_3": 1 }` in stats JSON.

**Coaching UX expectation:** "Player #7 had 2 assists" on a player contributions table. Coaches recognize this stat immediately — it is one of the standard three stats in any soccer box score (goals, assists, shots).

**Confidence:** HIGH for the logic itself; accuracy is entirely bounded by pass and shot detection quality and tracking ID stability.

---

## Feature Detail: Pitch Keypoint Calibration

**What it is:** Detecting visible pitch line landmarks (center circle, penalty arcs, corner flags, penalty spots, etc.) in each frame and computing a homography matrix that maps pixel coordinates to real-world pitch meters. Replaces the current proportional vertex estimation in view_transformer.py.

**Recommended approach (roboflow/sports pretrained model):**
1. Load the roboflow `football-field-detection` YOLOv8 keypoint model (32 keypoints, mAP 0.99, available on Roboflow Universe and referenced in the roboflow/sports repo)
2. Run keypoint detection on each frame (or every N frames with interpolation between)
3. Match detected keypoints to known FIFA pitch coordinates (105m × 68m standard)
4. Compute homography via `cv2.findHomography` from matched point pairs (minimum 4 required; model provides up to 32)
5. Apply RANSAC in findHomography to handle outlier keypoint detections
6. Replace current view_transformer proportional estimate with this per-frame calibrated homography
7. Optional stabilization: smooth homography across frames with a rolling median or Kalman filter to reduce jitter from noisy keypoint detections

**Alternative approaches considered:**
- SoccerNet/sn-calibration (DeepLabv3 segmentation + PnP solve): higher accuracy on broadcast footage, but adds ~500MB PyTorch dependency and research-grade code. Reserve as optional "high-accuracy mode" for broadcast footage in v3+.
- Manual vertex annotation per clip: instant accuracy for demo clips, zero generalization. Acceptable as a stopgap if the pretrained model fails on NC State footage specifically.

**Edge cases:**
- Camera pan/zoom: some keypoints disappear; with 32 defined points and a dense enough labeling scheme, the model is trained to work with partial visibility (minimum 4 required for homography)
- Only 3 keypoints detected: fall back to previous frame's homography matrix (cached); if no cache exists, fall back to proportional estimate
- Severe player occlusion of pitch lines: model trained on this; YOLO keypoint detection handles partial occlusion reasonably
- Heavily compressed or low-resolution footage: keypoint localization degrades; expect ~10-15% more fallback frames

**Impact on existing pipeline:** Speed and distance calculations eliminate ghost speeds. Shot coordinates become trustworthy. All spatial metrics in stats JSON move from "estimated" to "calibrated." No change to stats JSON schema required — same coordinate fields, more accurate values.

**Coaching UX expectation:** Coaches do not see the calibration — they see sprint speeds in the 25-35 km/h range for fast players (believable) instead of 268 km/h (destroys credibility). The win is implicit trust. Do not surface "calibrated" vs "estimated" as a UI distinction; just fix the numbers.

**Confidence:** HIGH — roboflow provides a pretrained model with mAP 0.99 and documented API; homography computation is standard OpenCV; the roboflow/sports repo has a ViewTransformer class with a clean API that is a direct replacement for the current view_transformer.

---

## Feature Detail: Tracking Stability

**What it is:** Reducing the rate at which ByteTrack assigns new IDs to known players (ID switches) and removing brief ghost detections (player tracks lasting only a few frames from false positives).

**Root causes in soccer tracking:**
- Two players crossing paths: bounding boxes overlap; IoU-based matching can swap IDs since appearance features are not considered
- Brief occlusion (player behind another, behind goalpost): track "lost" and re-initializes with new ID when player reappears
- Camera pan: rapid frame-to-frame positional displacement breaks IoU matching because expected vs actual position diverges
- Low-confidence detection frames: ByteTrack drops a track if detection confidence stays low for too long; player reappears as a new track

**Mitigations in order of effort (all compatible with existing roboflow supervision stack):**

1. **Parameter tuning (LOW effort, ~30-40% ID switch reduction):** Increase `track_buffer` (frames a lost track is remembered before deletion — try 60-90 frames at 25fps = 2.4-3.6 seconds), reduce `match_thresh` (more permissive IoU matching for first-stage association), tune `track_thresh`. No code changes beyond tracker initialization.

2. **Ghost track filter (LOW effort, post-processing):** Any player track lasting fewer than N frames (recommend N=10 frames = 0.4s at 25fps) is a ghost detection from a false positive or detection flicker. Filter these from all downstream outputs (heatmaps, event detection, stats JSON). Implement as a post-processing pass over the track log.

3. **BoT-SORT (MEDIUM effort, addresses camera pan):** Drop-in replacement for ByteTrack in roboflow supervision (`sv.BoTSORTTracker`). Adds Camera Motion Compensation (CMC) that estimates frame-to-frame camera movement using sparse optical flow and corrects bounding box positions before IoU matching — directly addresses the most common soccer broadcast ID switch cause. supervision supports it natively.

4. **ReID embedding (HIGH effort, not recommended for v2.0):** Adds an appearance model (OSNet, FastReID) that matches players by visual features across frames when IoU is low. Adds 15-25ms latency per frame. supervision does not natively support ReID yet (open issue #1545). Requires custom integration. Defer to v3+ if BoT-SORT is insufficient.

**Recommended for v2.0:** Apply (1) + (2) immediately as cheap wins. Swap to (3) BoT-SORT if the NC State footage has significant camera pans (broadcast footage almost always does). Skip (4).

**Coaching UX expectation:** Coaches do not see the tracking algorithm — they see player labels that remain consistent across the video. ID instability is invisible when working; immediately jarring when broken (player label changes mid-play). No UI surface needed.

**Confidence:** HIGH for parameter tuning and ghost filtering; MEDIUM for BoT-SORT (supervision support confirmed via docs; effectiveness depends on footage characteristics).

---

## Feature Detail: Individual Player Heatmaps

**What it is:** A static PNG heatmap per tracked player showing their position density across the full clip — same format as existing team heatmaps but scoped to a single player_id.

**Implementation (near-zero new work):**
1. Load `positions.json` (already exported at 1Hz by v1.0 pipeline)
2. Filter coordinates by `player_id`
3. Convert pixel coordinates to pitch meters using calibrated homography (or existing proportional estimate as fallback)
4. Render using `mplsoccer Pitch.bin_statistic()` + `Pitch.heatmap()` — identical code to team heatmaps, different data filter
5. Label each plot with player ID or jersey number as title
6. Save as `player_{id}_{team}_heatmap.png` in the output directory
7. Upload to GitHub Releases alongside annotated video

**Output volume per clip:** One PNG per tracked player. For a typical 5-10 minute clip with 22 tracked players: ~22 files at ~200-400KB each = ~5-8MB total. Well within GitHub Releases size limits.

**Edge cases:**
- Player tracked for fewer than 30 seconds (<30 position samples at 1Hz): heatmap will be sparse and misleading — either suppress (don't generate) or render with a "limited data" watermark
- Ghost player IDs from tracking instability: ghost tracks produce heatmaps of brief random positions — apply ghost filter (from tracking stability work) before heatmap generation to eliminate these
- Player substitutes mid-clip: their heatmap only covers their time on the field — acceptable; note in the site display if known

**Interactive stretch goal:** A JavaScript visibility toggle on the demo site that shows/hides individual player heatmap PNGs when a player name or number is clicked. Achievable on static Astro by pre-generating all PNGs and toggling `display: none` in CSS — no server required, no complex JS state. Complexity: MEDIUM. Recommend as a v2.0 stretch if time allows; otherwise static gallery is sufficient.

**Coaching UX expectation:** "Show me where Player 7 spent most of their time" is one of the first follow-up questions after seeing a team heatmap. Coaches want: player number visible on the image, team-colored pitch background (mplsoccer supports this), images organized by team. Side-by-side comparison of two players is a common follow-up request — achievable in the static site layout without code changes.

**Confidence:** HIGH — mplsoccer's heatmap API is directly confirmed in documentation; v1.0 team heatmap code is the exact template; positions.json already provides the required data.

---

## MVP Definition

### Launch With (v2.0 — coaching demo upgrade)

Minimum set to deliver a credible v2.0 upgrade that justifies showing the demo again.

- [ ] Individual player heatmaps (static PNG per player) — lowest effort, highest coaching utility, direct extension of working code
- [ ] Tracking stability (parameter tuning + ghost filter) — prerequisite accuracy for event detection; cheap wins first
- [ ] Pitch keypoint calibration — eliminates ghost speeds, makes spatial stats credible; do before event detection to get correct coordinates in output
- [ ] Pass detection (rule-based, team pass counts in stats JSON and site) — table stakes for the "event detection" milestone claim
- [ ] Shot detection (rule-based, counts + on/off target in stats JSON and site) — table stakes for the "event detection" milestone claim
- [ ] Assist tagging (derived from pass + shot, player assist counts) — minimal additional work once pass + shot exist
- [ ] Site updates — display event stats table and per-player heatmap grid on clip pages

### Add After Validation (v2.x)

- [ ] BoT-SORT tracker swap — add if NC State footage shows significant camera pan causing ID switches; low risk, measurable improvement
- [ ] Shot map visualization (dots on pitch minimap at shot locations) — add when coaching staff ask "where did the shots come from?"
- [ ] Event timestamps with video seek links — add when coaching staff want to scrub to specific moments in the demo
- [ ] Interactive player-toggle heatmaps — add when static PNG gallery feels limiting in live coaching sessions
- [ ] Player name / jersey number mapping — add when coaching staff provide roster data for NC State clips

### Future Consideration (v3+)

- [ ] ML-based action spotting (T-DEED or SoccerNet architecture) — defer until rule-based approach is validated and labeled training data exists
- [ ] xG model — defer until enough clip data to train/validate
- [ ] Foul and card detection — complex, limited coaching utility relative to effort
- [ ] Offside detection — requires frame-accurate calibration and simultaneous multi-player positional analysis
- [ ] ReID embedding for tracking — defer until BoT-SORT is proven insufficient

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Individual player heatmaps | HIGH | LOW | P1 |
| Tracking stability (param tuning + ghost filter) | HIGH (prerequisite) | LOW | P1 |
| Pitch keypoint calibration | HIGH | MEDIUM | P1 |
| Pass detection | HIGH | MEDIUM | P1 |
| Shot detection | HIGH | MEDIUM | P1 |
| Assist tagging | MEDIUM | LOW (derived) | P1 |
| Site updates (event stats + heatmap grid) | HIGH | MEDIUM | P1 |
| BoT-SORT tracker swap | MEDIUM | LOW-MEDIUM | P2 |
| Shot on/off target accuracy improvement | MEDIUM | MEDIUM | P2 |
| Shot map on pitch minimap | MEDIUM | LOW | P2 |
| Event timestamps + video seek | MEDIUM | MEDIUM | P2 |
| Interactive player-toggle heatmaps | LOW-MEDIUM | MEDIUM | P3 |
| Player name / jersey resolution | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v2.0 coaching demo
- P2: Should have, add in same milestone if time allows
- P3: Nice to have, v2.x or v3+

---

## Competitor Feature Analysis

| Feature | Wyscout / StatsBomb (elite) | Trace (youth-focused) | Korner Flags v2.0 approach |
|---------|-----------------------------|-----------------------|---------------------------|
| Pass detection | Full event graph, direction, outcome, pressure | Pass count + zones | Rule-based possession change; team counts + timestamps |
| Shot detection | xG, on/off target, body part, assist chain | Shot count | Velocity heuristic + goal-region filter; on/off target |
| Assist tagging | Full pre-assist chain attributed | N/A | Lookback window on pass log; immediate assist only |
| Player heatmaps | Per player, per match segment | Radar + heatmap per player | Static PNG per player from position tracking data |
| Calibrated coordinates | GPS or multi-camera array | Overhead camera (no occlusion) | Keypoint homography via YOLO pretrained model |
| Tracking stability | Professional multi-camera, dedicated hardware | Overhead camera eliminates occlusion | ByteTrack + BoT-SORT + parameter tuning |

Korner Flags v2.0 targets the gap below professional tools — delivering 70-80% of the most-used features from a single broadcast-angle camera with no hardware beyond the video file.

---

## Sources

- [SoccerNet Ball Action Spotting — soccer-net.org](https://www.soccer-net.org/tasks/ball-action-spotting)
- [SoccerNet 2025 Challenges Results — arxiv.org](https://arxiv.org/html/2508.19182v1)
- [PathCRF: Ball-Free Soccer Event Detection via Possession Path Inference — arxiv.org](https://arxiv.org/html/2602.12080)
- [Automatically Measuring Soccer Ball Possession with AI — tryolabs.com](https://tryolabs.com/blog/2022/10/17/measuring-soccer-ball-possession-ai-video-analytics)
- [Automatic event detection in football using tracking data — Springer](https://link.springer.com/article/10.1007/s12283-022-00381-6)
- [Camera Calibration in Sports with Keypoints — blog.roboflow.com](https://blog.roboflow.com/camera-calibration-sports-computer-vision/)
- [football-field-detection Keypoint Model (32 keypoints, mAP 0.99) — Roboflow Universe](https://universe.roboflow.com/roboflow-jvuqo/football-field-detection-f07vi)
- [Enhancing Soccer Camera Calibration Through Keypoint Exploitation — arxiv.org](https://arxiv.org/html/2410.07401v1)
- [Calibrating Football Fields with Keypoints — Medium / Erfan Akbarnezhad](https://medium.com/@akbarnezhad1380/calibrating-football-fields-with-keypoints-part-1-3-88fa4aad4d6e)
- [roboflow/sports GitHub](https://github.com/roboflow/sports)
- [ByteTrack ReID feature request — roboflow/supervision issue #1545](https://github.com/roboflow/supervision/issues/1545)
- [Improved ByteTrack for Soccer Multi-Player Tracking — GitHub](https://github.com/ruiqiRichard/Improved_ByteTrack_for_Soccer_Multi-Player_Tracking)
- [Tracking with Efficient Re-ID in YOLO — Analytics Vidhya](https://www.analyticsvidhya.com/blog/2025/04/re-id-in-yolo/)
- [Heatmap documentation — mplsoccer](https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_heatmap.html)
- [Heat Maps in Soccer — Soccer Wizdom](https://soccerwizdom.com/2025/03/13/heat-maps-in-soccer-tracking-movement-performance-and-strategy/)
- [Detecting key Soccer match events using Computer Vision — arxiv.org](https://arxiv.org/pdf/2204.02573)
- [Ball Tracking in Sports with Computer Vision — blog.roboflow.com](https://blog.roboflow.com/tracking-ball-sports-computer-vision/)

---
*Feature research for: Korner Flags v2.0 — event detection, calibration, tracking stability, per-player heatmaps*
*Researched: 2026-03-24*

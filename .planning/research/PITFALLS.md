# Pitfalls Research

**Domain:** Soccer video analysis — v2.0 feature additions (pass/shot/assist detection, pitch keypoint calibration, tracking stability, per-player heatmaps)
**Researched:** 2026-03-24
**Confidence:** HIGH (codebase read directly; pitfalls verified against peer-reviewed sports CV literature, official supervision/ultralytics docs, and SoccerNet research; v1.0 pitfalls unchanged below)

---

## v2.0 Critical Pitfalls

These pitfalls are specific to adding the four v2.0 feature groups to the existing pipeline. They concern integration failure modes, not generic ML mistakes.

---

### Pitfall V2-1: Pass Detection Fires on Interpolated Ball Positions

**What goes wrong:**
The pipeline interpolates missing ball positions using `pandas.DataFrame.interpolate()` before ball possession is evaluated (`tracker.py` lines 18–28, called in `main.py` line 97). Pass detection built on top of this data will fire false positives at every interpolated gap. When the ball is occluded for 10–30 frames (common during tackles or when it leaves frame), interpolation draws a straight-line path. Any velocity-threshold trigger will see a sudden "pass velocity" at the frame where real tracking resumes and the interpolated path diverges from actual position. At 25 fps, a 20-frame occlusion creates a phantom velocity spike at frame 21.

**Why it happens:**
Interpolation is appropriate for smoothing single-frame drop-outs. But pass detection reads ball velocity changes to identify ball-transfer events. The velocity at the seam between interpolated and real tracking is artificially large. The ball position also "teleports" at this seam because interpolation assumed linear motion while the ball may have changed direction during occlusion.

**How to avoid:**
Tag interpolated frames in the ball track before pass detection runs. The interpolation DataFrame currently provides no flag for which rows are real vs. synthetic. Add an `interpolated` boolean field to each ball track entry during `interpolate_ball_positions`. Pass detection must skip any velocity calculation that spans a frame where either endpoint is tagged `interpolated=True`. Do not detect events across interpolated gaps.

**Warning signs:**
- Pass count is higher than visible passes in the video.
- Passes cluster at the moments when ball tracking resumes after it exits frame.
- Reviewing the annotated video shows "pass" events during dead balls, throw-ins being taken, or when the ball is clearly off camera.

**Phase to address:** Pass/shot detection phase — validate against a clip where ball occlusions are known (e.g., throw-in sequences).

**Coaching-demo bar:** A coach reviewing pass events must not see phantom passes during set pieces. Manual count of passes in a 30-second clip must be within ±2 of the detected count.

---

### Pitfall V2-2: Ball Velocity Threshold for Pass/Shot Detection Does Not Transfer Across Clips

**What goes wrong:**
A velocity threshold tuned on one NC State clip (e.g., "ball must move > 8 m/s in one frame window to count as a pass") will overfire or underfire on clips with different frame rates, camera zoom, or perspective transform quality. Because `ViewTransformer` still uses estimated proportional vertices (not calibrated keypoints), the pixel-to-metre conversion differs across clips. A threshold calibrated on clip 1 will produce a different detection rate on clip 2 even if they were filmed at the same game.

**Why it happens:**
Pass and shot detection built on top of `position_transformed` inherits all the measurement error from the view transformer. The current estimated vertices assume a fixed proportion of frame size regardless of zoom or camera angle. Two clips from the same match but different zoom levels will yield different effective metres-per-pixel ratios, making any absolute velocity threshold non-portable.

**How to avoid:**
Do not implement hard-coded velocity thresholds in absolute m/s units until pitch keypoint calibration (v2.0 goal) is complete. During the phase when calibration is not yet available, use a clip-relative threshold (e.g., percentile of ball velocity distribution per clip) rather than an absolute value. Alternatively, express the threshold in pixel-velocity units that are clip-resolution-invariant. Calibrate thresholds on at least two different NC State clips before shipping.

**Warning signs:**
- Dramatically different pass counts between two clips of similar length from the same match.
- Shot detection fires consistently during goalkeeper kicks on one clip but misses them on another.
- Sensitivity to the `--confidence` flag (lower confidence → more ball detections → different velocity distribution → threshold shifts).

**Phase to address:** Pass/shot detection phase, with explicit re-validation after pitch calibration phase is complete.

**Coaching-demo bar:** Pass counts for two different clips from the same game should agree with manual count within 15%.

---

### Pitfall V2-3: Shot Detection Conflates Goalkeeper Kicks, Long Balls, and Clearances With Shots on Goal

**What goes wrong:**
A shot is distinguishable from a long pass or clearance only by trajectory direction (toward goal), the identity of the player (shooter vs. defender), and sometimes ball height (shots stay low; clearances are aerial). A pure velocity trigger will treat any hard kick as a shot. Goalkeeper punts, defensive clearances in the defensive third, and long diagonal switches all produce similar ball velocity signatures to shots. On a 90-second clip, this can inflate "shot" counts by 3–5× compared to actual attempts.

**Why it happens:**
The existing pipeline has no semantic understanding of pitch zones. It tracks players and the ball in transformed coordinates, but `position_transformed` places everything in a 68×23m flat space with no awareness of which end is the attacking third or where the goal is. Without pitch zone context, any high-velocity ball movement looks like a shot.

**How to avoid:**
Define goal positions in the transformed coordinate space as a prerequisite to shot detection. After pitch keypoint calibration is complete (it provides the homography), the goal mouths are at fixed real-world coordinates (e.g., x=0 and x=105m on a full pitch). A shot must: (1) originate in the attacking half, (2) have a ball trajectory vector pointing toward the goal mouth ±30 degrees, and (3) come from a player classified as belonging to the attacking team. Without condition (2), false positives dominate. Without condition (3), own goals, clearances, and keeper kicks all appear as shots.

**Warning signs:**
- Shot count exceeds 8–12 for a 90-second clip (a D1 game averages ~12 shots per 90 minutes, not per 90 seconds).
- "Shots" appear in the defensive third on the annotated overlay.
- Goalkeeper actions consistently trigger shot events.

**Phase to address:** Pass/shot detection phase — pitch zone definition must precede shot detection logic. Calibration phase is a hard prerequisite.

**Coaching-demo bar:** Zero shot events in the defensive third. Zero goalkeeper punts classified as shots. A coach must be able to watch the 30-second clip and agree every flagged event was a genuine attempt.

---

### Pitfall V2-4: Assist Attribution Breaks When Track ID Switches Occur Between Pass and Shot

**What goes wrong:**
Assist detection requires linking a pass event (player A sends ball) to a subsequent shot event (player B shoots). This link depends on both players maintaining stable ByteTrack IDs across the temporal gap between pass and shot. If player A's ID switches between the pass frame and the shot frame (common during crowded midfield sequences — the known ByteTrack fragmentation issue mentioned in the milestone context), the assist cannot be attributed. The pipeline will either produce no assist or a wrong assist credit.

**Why it happens:**
ByteTrack ID switches are more frequent during the scenarios where assists happen: congested areas near the box, players crossing paths, and players moving in and out of frame. The `players_team_dict` in `TeamAssigner` caches team assignment by track ID (`team_assigner.py` line 78–90). A new ID after a switch is treated as a new player, receiving fresh (potentially wrong) team assignment from the first frame it appears — which may be mid-sequence.

**How to avoid:**
Tracking stability improvements (the third v2.0 goal) are a hard dependency of assist detection. Do not ship assist detection before tracking stability work is complete. Implement a minimum assist window: only credit an assist if the same track ID holds for all frames between the pass event and the shot event. Log assist attribution failures separately ("assist unresolved — ID switch") rather than silently dropping the credit or attributing it wrongly. After tracking improvements, validate assist attribution on a clip where the play sequence is manually known.

**Warning signs:**
- Assist count is lower than expected for clips containing clear one-two combinations.
- Same player appears to shoot without any preceding pass detection, but video clearly shows a pass.
- Track ID for the same physical player changes number across the pass→shot window in the annotated overlay.

**Phase to address:** Tracking stability phase must precede assist detection. Assist detection is the last event feature to implement.

**Coaching-demo bar:** For any shot event displayed to the coach, either an assist is correctly attributed or the display says "assist unresolved" — never a wrong player name/ID credited.

---

### Pitfall V2-5: Pitch Keypoint Detection Fails Silently and Corrupts All Downstream Measurements

**What goes wrong:**
Pitch keypoint calibration replaces the current estimated `pixel_vertices` in `ViewTransformer`. If the keypoint model produces wrong or degenerate correspondences for a frame — because pitch markings are occluded by players, chalk lines are faded, or the camera angle is extreme — `cv2.getPerspectiveTransform` will compute a valid-looking (non-singular) matrix from incorrect points. It will not raise an error. All `position_transformed` values, player speeds, distances, heatmap coordinates, and event detection coordinates will be wrong for the entire clip processed with that calibration, with no warning. The v1.0 pipeline has the same silent failure mode for estimated vertices but those are at least consistent; keypoint errors can be frame-variable if calibration runs per-frame.

**Why it happens:**
`cv2.getPerspectiveTransform` requires exactly 4 point correspondences and computes the unique homography that maps them. It does not validate that the result is geometrically reasonable (e.g., that the mapped pitch boundary covers a plausible field area). If even one of the 4 keypoints is misidentified — a common occurrence at difficult camera angles — the resulting transform warps all positions incorrectly.

**How to avoid:**
After computing the perspective transform from keypoints, validate the result with a sanity check before using it: map the 4 pixel corners back through the transform and confirm they land within ±2m of their expected real-world coordinates. Additionally, check that the transformed bounding box of a mid-pitch player is within the 68×105m pitch dimensions. Reject and fall back to the proportional estimated vertices if validation fails, logging a warning. For a coaching demo, validate calibration on each clip by checking that max player speed is below 40 km/h and that no transformed position exceeds pitch boundaries.

**Warning signs:**
- Player speeds return to ~268 km/h ghost values (same symptom as estimated vertex error, but now from bad keypoints).
- `position_transformed` values outside [0, 105] for x or [0, 68] for y.
- Heatmap positions cluster in corners of the pitch visualization rather than in the field of play area actually visible in the clip.

**Phase to address:** Pitch keypoint calibration phase — validation must be gated before the calibrated transform is used for any downstream calculation.

**Coaching-demo bar:** All player positions in `positions.json` must fall within pitch boundaries. Max recorded speed must be < 40 km/h for any single clip. Validate both before uploading to the demo site.

---

### Pitfall V2-6: Perspective Transform From a Partial Pitch View Cannot Recover Full-Pitch Coordinates

**What goes wrong:**
The current `ViewTransformer` maps a visible section of the pitch (estimated 23.32 m length, 68 m width) to real-world metres. This works for the visible clip area. Pitch keypoint calibration for a full-match context requires knowing which part of the full 105m pitch is visible. If the calibration model returns keypoints for only a half or third of the pitch, the resulting coordinate system is local to that section. Two clips with different camera positions will have incompatible coordinate systems — player positions in clip 1 cannot be compared to positions in clip 2. Heatmaps from two clips cannot be merged without re-projection.

**Why it happens:**
Broadcast cameras typically show one half or a section of the pitch. Keypoint models trained on SoccerNet data (which often covers full broadcast frames) may identify the circle, penalty arc, and corner flags, but the estimated focal length and full pitch registration may be approximate if only one end is visible.

**How to avoid:**
For the coaching demo, treat each clip's coordinate space as independent unless the same camera shot covers the same field region throughout. Do not attempt to merge heatmaps across clips with different camera positions. Label heatmaps with the approximate pitch region covered. Defer multi-clip coordinate stitching to a future phase.

**Warning signs:**
- Heatmaps from two clips show all activity on the same half of the pitch visualization (camera never panned to the other half).
- `court_length` in `ViewTransformer` is 23.32m but keypoint model reports the full 105m pitch region — coordinate values exceed the current target vertex space.

**Phase to address:** Pitch keypoint calibration phase — document coordinate system scope and do not imply full-pitch tracking if camera only shows a section.

---

### Pitfall V2-7: ByteTrack Max-Age and Lost-Track Buffer Tuning Is Camera-Dependent

**What goes wrong:**
ByteTrack's `track_buffer` (number of frames a track is held open after the tracked object disappears) defaults to 30 frames in supervision. For a 25 fps clip, that is 1.2 seconds. For NC State footage filmed at a higher frame rate or with more camera cuts, the buffer may be too short (ID re-assigned too quickly after a player exits frame) or too long (stale tracks from a player who left are matched to a newly arriving player, causing ID fusion). Both cause ID switches. ID switches in the player list silently corrupt: team assignment (new ID gets re-assigned to team based on first appearance), possession history, speed accumulation, and heatmap contribution.

**Why it happens:**
The current code initializes `sv.ByteTrack()` with no parameters (`tracker.py` line 15), accepting supervision's defaults. Defaults are tuned for pedestrian tracking in surveillance video, not for sports broadcast cameras with frequent panning and partial occlusions. NC State footage characteristics (frame rate, typical player-in-frame duration, frequency of full-body occlusion) are not accounted for.

**How to avoid:**
Run a diagnostic pass on the two existing NC State clips: count the number of unique track IDs that appear in each clip. For a 90-second clip at 25 fps with 22 players on the field, a well-tuned tracker should produce 22–30 unique IDs (some splits are inevitable). If the count exceeds 50, the buffer is too short. Tune `track_buffer`, `lost_track_buffer`, and `minimum_matching_threshold` on the NC State clips specifically before adding event detection on top of tracking. Document the tuned values in the codebase with the reasoning.

**Warning signs:**
- Unique track ID count significantly exceeds 22 per clip (can be measured from `tracks['players']` dictionary keys across all frames).
- Speed labels on the annotated video jump to 0 for a player and restart accumulation mid-clip (a new ID was issued to the same physical player).
- Distance values in the stats JSON are lower than plausible (fragmented tracks accumulate less distance per fragment than the full run).

**Phase to address:** Tracking stability phase — must be resolved before event detection and before per-player heatmaps (ghost player IDs corrupt heatmap data).

**Coaching-demo bar:** Unique track IDs per 90-second clip should not exceed 35. Annotated video should show the same ID number on the same physical player for the duration they are visible in the clip.

---

### Pitfall V2-8: Per-Player Heatmap Generated for Ghost Players Appears as Confetti

**What goes wrong:**
Each unique ByteTrack track ID becomes a distinct player in `positions.json` (exported by `export_positions` in `main.py`). If the tracker produces 60 unique IDs for 22 physical players, the per-player heatmap generator will produce 60 heatmaps — most of which contain 1–5 position points. A heatmap with 3 positions will render as 3 blobs of Gaussian kernel smear, randomly scattered across the pitch. These look like confetti rather than a player movement pattern. Including them in the demo destroys the feature's credibility.

**Why it happens:**
`export_positions` currently filters by `pos is not None and team is not None` but does not filter by minimum observation count. Any track ID that appeared in even one frame with a valid position and team assignment will generate a record. Ghost players created by brief false-positive detections or split tracks contribute data proportional to their frame count, which is often very small.

**How to avoid:**
Filter `positions.json` records at heatmap generation time: only generate a per-player heatmap for track IDs that appear in at least N position samples. N = 30 samples (at 1 Hz export, 30 seconds of continuous tracking) is a reasonable floor — any player active for under 30 seconds either is a ghost or played a trivial role. Add a parameter to the heatmap script for `--min-samples` with a default of 30. Label per-player heatmaps with the number of seconds tracked, so a coach understands a limited-sample heatmap. Do not show per-player heatmaps for players with under 60 seconds of data on the coaching demo.

**Warning signs:**
- More than 25 player heatmaps generated for a 90-second clip.
- Any per-player heatmap shows fewer than 5 distinct position clusters.
- Heatmap blobs appear near the edge of the pitch or outside pitch boundaries (ghost positions from badly calibrated frames).

**Phase to address:** Per-player heatmap phase — filtering must be implemented before any heatmaps are exported to the demo site.

**Coaching-demo bar:** Display at most 11 per-player heatmaps per team. Only show players with 60+ seconds of tracked data. Include sample count ("tracked for 74 seconds") on each heatmap tile.

---

### Pitfall V2-9: KMeans Team Assignment Cached by Track ID Corrupts New Players After ID Switches

**What goes wrong:**
`TeamAssigner.get_player_team` caches team assignments by track ID in `players_team_dict` (`team_assigner.py` line 78–90). This is correct and efficient when track IDs are stable. But after a ByteTrack ID switch, the new track ID (say, ID 47 replacing physical player previously tracked as ID 12) gets re-assigned on first appearance in the new ID. If the first frame that ID 47 appears is a partial view, a motion blur frame, or a frame where the player is obscured by another player, `get_player_color` may read the wrong color and permanently cache the wrong team for that ID. That wrong team assignment persists for all subsequent frames with ID 47, including possession tracking and assist detection.

**Why it happens:**
The cache-on-first-appearance strategy is intentional (avoids re-running KMeans every frame) but fragile under ID switches. The v1.0 pipeline accepts this because team assignment errors are self-contained to the visual overlay. In v2.0, wrong team assignment directly corrupts: shot detection (shot attributed to wrong team), assist detection (assist credited to wrong team), and per-player heatmaps labeled with wrong team colors.

**How to avoid:**
After tracking stability improvements reduce ID switch frequency, add a confidence check at team assignment: run `get_player_color` on the first 3 frames a new track ID appears, majority-vote the cluster assignment, and only cache after 3 consistent assignments. For any track ID where the first 3 frames disagree, flag the assignment as uncertain and exclude that player from event attribution until a stable team is determined. This is more expensive but prevents one bad frame from corrupting all downstream data for that player.

**Warning signs:**
- Possession total for one team exceeds 70% in clips where teams appear balanced visually.
- A physical player visually identifiable by jersey appears with both Team 1 and Team 2 ellipse colors across the clip.
- Shot events in the stats JSON show more shots from the defensive team than the attacking team.

**Phase to address:** Tracking stability phase (reduces the frequency) + pass/shot detection phase (adds a guard against wrong-team attribution).

---

### Pitfall V2-10: mplsoccer Heatmap Gaussian Sigma Is Not Scale-Normalized to Pitch Coordinates

**What goes wrong:**
The current team heatmaps use `gaussian_filter` from `scipy.ndimage` applied to a binned statistic grid. The Gaussian sigma is expressed in grid bins, not in real-world metres. If the view transformer changes coordinate scale (pre-calibration vs. post-calibration produce different coordinate ranges), the same sigma value creates a visually different heatmap even for identical player movement patterns. Specifically: if calibration corrects a systematic scale error (e.g., the estimated vertices produced a 40% smaller effective pitch), all positions shift and the relative density changes. A heatmap tuned to look good with the old scale will appear over-smoothed or under-smoothed with calibrated coordinates.

**How to avoid:**
Express the Gaussian sigma in metres, then convert to bins at heatmap-generation time based on the `bins` parameter: `sigma_bins = sigma_metres / (pitch_length / n_bins_x)`. This ensures consistent smoothing regardless of coordinate system changes. Update the heatmap generation script to accept `--sigma-metres` rather than a raw bin count. Re-validate heatmap visual quality after pitch keypoint calibration is complete.

**Warning signs:**
- After calibration, player heatmaps look dramatically more or less smooth than before with the same parameters.
- Central midfielders show heatmap coverage that spills into the penalty box or off the pitch edges.
- The pitch visualization shows the Gaussian blobs exceeding the mplsoccer pitch boundary lines.

**Phase to address:** Per-player heatmap phase, with re-check required after pitch calibration is integrated.

---

## Moderate Pitfalls

### Pitfall V2-11: Camera Movement Correction Applied Before Event Detection Introduces Artifacts at Camera Cuts

**What goes wrong:**
The camera movement estimator uses Lucas-Kanade optical flow on static pitch regions. At a hard camera cut (abrupt switch from one camera angle to another), the optical flow tracking fails — `cv2.calcOpticalFlowPyrLK` returns large, erroneous flow vectors. These are partially suppressed by the `minimum_distance = 5` threshold, but a hard cut produces flow vectors that are large enough to pass the threshold. The resulting `camera_movement[frame_num]` at the cut frame is wrong, and `position_adjusted` for that frame is wrong. Ball position adjusted by an incorrect camera correction at a cut will produce a phantom velocity spike — which triggers a false pass or shot event.

**How to avoid:**
Detect hard camera cuts (frame-to-frame pixel difference above a threshold, or optical flow coherence below a threshold) and mark those frames as `cut=True` in the camera movement array. Pass and shot detection must exclude velocity calculations that span a cut frame. Ball interpolation already handles these (linear interpolation across cuts is no worse than current behavior), but event detection must not fire across cuts.

**Warning signs:**
- Pass events appear at exact camera cut boundaries in the annotated video.
- Camera movement values spike to values > 100 pixels in a single frame (far larger than realistic pan motion).

**Phase to address:** Pass/shot detection phase — camera cut detection is a prerequisite.

---

### Pitfall V2-12: Possession Smoothing Threshold Conflicts With Pass Detection Timing

**What goes wrong:**
The current possession logic uses a 15-frame smoothing threshold: a team must control the ball for 15 consecutive frames before possession is officially transferred (`main.py` lines 119–148). Pass detection operates on raw ball position and velocity, not on smoothed possession state. A pass that is short and quick (ball transfers in 5–8 frames) will be detected by the pass detector (velocity spike + change in nearest-player) but the possession counter will not register a transfer during that window. This creates a disagreement: the pass event log says "Player A passed to Player B at frame 120" but the possession stats still show Team 1 in possession from frame 115 to frame 150 because the smoothing threshold was not met.

**How to avoid:**
Pass detection and possession tracking must share a common ground-truth possession state. Either: (1) run pass detection on raw detections before the 15-frame smoothing is applied and accept that pass events may not align with possession stats, making this explicit to coaches ("pass events and possession % are computed independently"), or (2) reduce the smoothing threshold for possessions that are interrupted by a confirmed pass event. Option 1 is simpler and honest. Option 2 creates tight coupling that is fragile.

**Warning signs:**
- Pass event log contains passes between two players on the same team according to possession stats.
- Possession % for a team changes by less than 1% in a clip with 10+ detected passes.

**Phase to address:** Pass/shot detection phase — document the independence explicitly in the stats JSON schema.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coded velocity threshold for pass/shot | Faster to implement | Breaks across clips with different zoom or pre-calibration coordinates | Never in production; only for initial prototyping with one specific clip |
| Detect events before calibration is complete | Can ship event detection sooner | All coordinate-based thresholds will require re-tuning after calibration | Only acceptable if events are labeled "approximate — calibration pending" |
| Per-player heatmaps without minimum-sample filtering | Simpler implementation | Ghost player heatmaps corrupt demo; coaching credibility lost | Never for coaching demo |
| Reuse `players_team_dict` cache across multiple video files | Avoids re-running team assignment | Wrong team assignments when processing a second clip where jersey appearances differ | Never — clear cache between clips |
| Skip camera cut detection for event detection | Saves one preprocessing step | False pass/shot events at every hard cut | Only acceptable if demo clips have no camera cuts |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Pass detection on interpolated ball positions | Running velocity trigger over full ball track including interpolated frames | Tag interpolated frames; skip velocity calculations spanning those frames |
| Pitch keypoint → ViewTransformer | Passing keypoints directly to `pixel_vertices` without validating the resulting homography | Validate by round-tripping corner points through the transform; check speed < 40 km/h post-calibration |
| ByteTrack → event detection | Assuming track IDs are stable enough for assist attribution without measuring ID switch rate | Count unique IDs per clip; tune `track_buffer` before adding event detection |
| Per-player heatmap → demo site | Exporting all track IDs regardless of sample count | Filter by minimum observation count (≥ 30 samples at 1 Hz) before generating heatmap PNGs |
| Team assignment cache + ID switches | Caching team by first-appearance frame which may be a bad frame | Multi-frame majority vote before caching team for a new ID |
| Event stats JSON → site manifest | Adding new event fields to stats JSON without updating site manifest schema | Update manifest.json schema and site Astro components simultaneously |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running KMeans team assignment on every frame for re-ID recovery | 10–30 second processing time increase per clip | Cache by ID; only re-run on truly new IDs after majority-vote period | Clips > 500 frames with frequent ID switches |
| Per-frame pitch keypoint inference (if model runs on every frame) | Pipeline processing time increases 5–10× | Run keypoint calibration once per clip or per scene segment; cache homography | Any clip > 100 frames with per-frame keypoint model |
| Generating per-player heatmap PNG for every unique track ID | 60+ PNG files for a single clip; heatmap generation dominates wall time | Filter to minimum-sample players before generating; generate lazily | Clips with > 40 unique IDs (common without tracking stability fixes) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Pass detection:** Interpolated frames are tagged and excluded from velocity triggers. Verify: run pipeline on a clip where ball exits frame for 5+ seconds; confirm no pass events fire during that window.
- [ ] **Shot detection:** All detected shots originate in the attacking half and point toward the goal mouth. Verify: review every shot event location in transformed coordinates; none should have x < 52.5m (center line) for the attacking team.
- [ ] **Assist detection:** Assist attribution requires the same track ID from pass to shot with no intervening ID switch. Verify: check that assisting player ID matches the passer ID in the pass event log for the same frame window.
- [ ] **Pitch keypoint calibration:** Post-calibration, all `position_transformed` values are within pitch boundaries ([0,105] x [0,68]). Max player speed < 40 km/h. Verify before uploading any clip.
- [ ] **Tracking stability:** Unique track ID count per 90-second clip is ≤ 35. Verify by computing `len(set(all_track_ids_across_frames))` from `tracks['players']`.
- [ ] **Per-player heatmaps:** No heatmap generated for players with < 30 position samples. Verify: check that the number of heatmap PNGs matches the number of players in stats JSON with > 30 seconds of data.
- [ ] **Heatmap coordinate scale:** All heatmap positions fall within the mplsoccer pitch boundary. Verify: run `assert all(0 <= x <= 105 and 0 <= y <= 68 for x, y in positions)` before rendering.
- [ ] **Event stats in JSON:** New `events` field added to stats JSON is present in the site manifest for each clip. Verify: load site locally; event section displays without JS errors or missing data.
- [ ] **Team assignment stability:** No player visually switches team color ellipse across the clip duration. Verify by watching the annotated video at 2× speed with attention to ellipse colors.
- [ ] **Camera cut handling:** No pass/shot event fires at the exact frame boundary of a camera cut. Verify: identify cut frames manually; check event timestamps do not match.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| False positives from interpolated-frame events | LOW | Add interpolation tag to ball track; re-run event detection; no re-tracking required |
| Bad pitch keypoint calibration on one clip | LOW | Fall back to proportional estimated vertices for that clip; label results as "approximate"; re-run downstream |
| Ghost player heatmaps already uploaded to demo | LOW | Regenerate heatmap PNGs with minimum-sample filter; re-upload to GitHub Release; update manifest |
| Assist misattribution due to ID switches | MEDIUM | Fix tracking stability; re-run full pipeline on the clip; re-export stats and re-upload |
| Wrong team assignment cached for a split track | LOW | Clear `players_team_dict`; re-process clip; takes < 10 minutes |
| Event velocity threshold wrong for a clip | LOW | Adjust threshold per-clip at detection time; no retraining required; re-run event detection pass only |
| Per-player heatmap coordinate scale wrong post-calibration | LOW | Recalculate sigma in metres; regenerate PNGs; re-upload |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pass detection on interpolated frames (V2-1) | Pass/shot detection | No pass events during known ball-out-of-frame windows |
| Velocity threshold not clip-portable (V2-2) | Pass/shot detection | Pass count within 15% of manual count on two different clips |
| Shot/clearance conflation (V2-3) | Pass/shot detection (after calibration) | Zero shot events in defensive third; shot count < 15 per 90-second clip |
| Assist breaks on ID switches (V2-4) | Tracking stability (prerequisite); assist detection (implementation) | Assist ID matches pass event passer ID in frame log |
| Silent keypoint calibration failure (V2-5) | Pitch keypoint calibration | All positions within pitch bounds; max speed < 40 km/h |
| Partial-pitch coordinate scope (V2-6) | Pitch keypoint calibration | Heatmaps labeled with clip camera region; no multi-clip merging attempted |
| ByteTrack buffer mis-tuning (V2-7) | Tracking stability | Unique IDs per 90-second clip ≤ 35 |
| Ghost player heatmaps (V2-8) | Per-player heatmap | Max 11 per-team heatmaps; all with ≥ 60 seconds tracked |
| Team assignment cache corruption (V2-9) | Tracking stability + pass/shot detection | No player shows dual team colors in annotated video |
| Gaussian sigma not scale-normalized (V2-10) | Per-player heatmap (re-check after calibration) | Heatmap smoothing visually consistent pre- and post-calibration |
| Camera cut false events (V2-11) | Pass/shot detection | No events at cut frame boundaries |
| Possession/pass state conflict (V2-12) | Pass/shot detection | Stats JSON documents independence explicitly; coaches briefed |

---

## Sources

- [Event detection in football: Improving the reliability of match analysis — PMC/PLOS One](https://pmc.ncbi.nlm.nih.gov/articles/PMC11025972/) — MEDIUM confidence (peer-reviewed, 2024)
- [Automatic event detection in football using tracking data — MIT/Sports Engineering](https://dspace.mit.edu/bitstream/handle/1721.1/145347/12283_2022_Article_381.pdf) — MEDIUM confidence
- [PathCRF: Ball-Free Soccer Event Detection via Possession Path Inference — arXiv 2602.12080](https://arxiv.org/html/2602.12080) — MEDIUM confidence (2025)
- [Enhancing Soccer Camera Calibration Through Keypoint Exploitation — arXiv 2410.07401](https://arxiv.org/html/2410.07401v1) — HIGH confidence (2024)
- [Camera Calibration in Sports with Keypoints — Roboflow Blog](https://blog.roboflow.com/camera-calibration-sports-computer-vision/) — MEDIUM confidence
- [TVCalib: Camera Calibration for Sports Field Registration — mm4spa.github.io](https://mm4spa.github.io/tvcalib/) — HIGH confidence
- [Automating assist identification in football — Springer Sports Engineering 2025](https://link.springer.com/article/10.1007/s12283-025-00533-4) — HIGH confidence (peer-reviewed, 2025)
- [ByteTrack ID Reassignment Discussion — Ultralytics GitHub #19784](https://github.com/orgs/ultralytics/discussions/19784) — HIGH confidence
- [Update ByteTrack to include ReID — roboflow/supervision #1545](https://github.com/roboflow/supervision/issues/1545) — HIGH confidence
- [Global Tracklet Association for Multi-Object Tracking in Sports — arXiv 2411.08216](https://arxiv.org/html/2411.08216) — MEDIUM confidence (2024)
- [mplsoccer Heatmap Documentation — mplsoccer.readthedocs.io](https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_heatmap.html) — HIGH confidence
- Codebase direct inspection: `tracker.py`, `view_transformer.py`, `speed_and_distance_estimator.py`, `team_assigner.py`, `player_ball_assigner.py`, `camera_movement_estimator.py`, `main.py` — HIGH confidence (first-party)

---

## v1.0 Pitfalls (Retained)

The pitfalls below were researched for v1.0 (2026-03-16) and remain valid. They are not repeated in detail but are preserved for reference.

| Pitfall | Status in v2.0 |
|---------|----------------|
| GitHub Pages serves LFS pointer files | Resolved — GitHub Releases CDN in use |
| AVI output cannot play in browser | Resolved — pipeline outputs MP4 |
| Repository size exceeds 1 GB limit | Ongoing — monitor as new clips are added |
| Speed/distance wrong from pipeline bugs | Resolved (v1.0 bugs fixed); ghost speeds remain from estimated vertices — v2.0 calibration addresses this |
| Team color assignment fails on bad frame 0 | Ongoing — same risk in v2.0 |
| YOLO domain shift on NC State footage | Ongoing — model unchanged in v2.0 |
| Technical metrics shown to coaches | Ongoing — UX discipline required for new event stats |

Full v1.0 pitfall details are in git history (commit prior to 2026-03-24).

---

*Pitfalls research for: soccer video analysis — v2.0 feature additions*
*Researched: 2026-03-24*

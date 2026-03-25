# Stack Research

**Domain:** Soccer video analysis pipeline — v2.0 feature additions
**Researched:** 2026-03-24
**Confidence:** HIGH for tracking stability and individual heatmaps (existing libs, extend only); MEDIUM for pitch calibration (model choice depends on dataset); MEDIUM for event detection (rule-based logic, no new lib needed)

---

## Context

The v1.0 pipeline is complete and validated. This research covers **only** what is needed for the four new v2.0 capabilities:

1. Pass / shot / assist event detection
2. Pitch keypoint calibration (replacing estimated perspective vertices)
3. ByteTrack ID-switch reduction and tracking stability
4. Individual player heatmaps (static PNG per player; interactive stretch goal)

The existing stack (`ultralytics>=8.0.0`, `supervision>=0.18.0`, `opencv-python-headless>=4.8.0`, `numpy>=1.24.0`, `pandas>=2.0.0`, `scikit-learn>=1.3.0`, `mplsoccer>=1.6.0`) is not replaced. Every decision below is an **addition** or a **configuration change** to that foundation.

---

## Recommended Stack

### Core Technologies (Existing — Do Not Change)

| Technology | Installed Version | Role in v2.0 |
|------------|------------------|--------------|
| ultralytics | >=8.0.0 | YOLO11 detection — unchanged; YOLO11 keypoint pose model added for pitch calibration |
| supervision | 0.27.0.post2 | ByteTrack already here; tune parameters for stability (no library change) |
| opencv-python-headless | >=4.8.0 | `cv2.findHomography`, `cv2.perspectiveTransform` already used; no new calls needed |
| mplsoccer | >=1.6.0 | Already generates team heatmaps; per-player PNGs use same `Pitch` + `bin_statistic` API |
| pandas | >=2.0.0 | Already tracks positions; event detection uses existing per-frame DataFrame logic |

### New Additions

| Library | Version | Purpose | Why This, Not Something Else |
|---------|---------|---------|------------------------------|
| `sports` (roboflow/sports) | `git+https://github.com/roboflow/sports.git` | `SoccerPitchConfiguration` — defines 32 canonical pitch keypoint coordinates as the reference frame for homography | No pip release yet; install from source. Provides the pitch template (real-world coordinates of each keypoint) that pairs with the YOLO keypoint model output. Avoids hardcoding a lookup table manually. |
| No new library for event detection | — | Rule-based pass/shot/assist logic written in Python using existing `tracks` dict + ball positions | Academic benchmarks show rule-based systems achieve F-score 0.93 for passes, 0.95 for shots — good enough; no ML event model needed for v2.0 scope |
| No new library for individual heatmaps | — | `mplsoccer.Pitch.bin_statistic` + `pitch.heatmap` already used for team heatmaps; per-player loop uses identical API | mplsoccer 1.6.1 already installed and supports per-player filtering; adding a loop is 20 lines of code, not a new dependency |
| No new library for tracking stability | — | `sv.ByteTrack` parameter tuning: raise `minimum_consecutive_frames`, tune `lost_track_buffer` | Already in supervision 0.27; no separate tracker library needed |

---

## Detailed Decisions by Feature Area

### 1. Pass / Shot / Assist Event Detection

**Decision: Rule-based Python logic. No new library.**

The existing pipeline already produces, per frame:
- Ball position (interpolated, in both pixel and transformed meter coordinates)
- Per-player `track_id`, team assignment, foot position, ball possession flag
- 15-frame possession smoothing

Events can be derived from possession-change transitions in the existing `tracks` data structure:

- **Pass:** Possession transfers from player A to player B on the **same team**
- **Shot:** Ball possession ends with no immediate teammate pickup (ball leaves the pitch region, or possession is lost without opponent pickup)
- **Assist:** The last completed pass to a player who then records a shot within a configurable window (default: 5 seconds / ~125 frames)

This approach is consistent with published rule-based methods that achieve F-score ≥ 0.86 for passes and 0.95 for shots on tracking data. No external event detection library is warranted at v2.0 scope.

**What to build:** A new `event_detector/` module, ~150–200 LOC, reading the existing `tracks` dict and outputting `events.json` alongside the existing `stats.json`.

**Confidence:** MEDIUM. Rule-based accuracy degrades when tracking is noisy (ID switches cause false possession changes). Tracking stability (feature 3) must be addressed first to get clean input to event detection.

---

### 2. Pitch Keypoint Calibration

**Decision: YOLO11 keypoint model (fine-tuned on Roboflow football-field-detection dataset) + `roboflow/sports` pitch config + `cv2.findHomography`.**

**Problem:** The current `ViewTransformer` uses four hardcoded estimated vertices, producing wildly incorrect speed estimates (reported ~268 km/h ghost speeds). Real calibration detects ~32 pitch keypoints per frame and computes a robust homography.

**Two-component approach:**

**Component A — Keypoint Detection Model**

Use a YOLO11-pose model fine-tuned on the Roboflow `football-field-detection` dataset (32 keypoints, publicly available at `universe.roboflow.com/roboflow-jvuqo/football-field-detection-f07vi`). The model outputs per-keypoint (x, y, confidence) for each visible keypoint in a frame.

- Why YOLO11-pose specifically: already using `ultralytics` in the pipeline; YOLO11-pose inference fits naturally into the existing `model.predict()` batch loop; avoids adding a separate inference framework
- Why the Roboflow dataset: 32 semantically labeled keypoints; free download; used by the roboflow/sports reference implementation; compatible with YOLO keypoint format

**Component B — Homography Computation**

`cv2.findHomography` (already in OpenCV) takes the visible detected keypoints (source points in pixel coordinates) and their known real-world positions from the `SoccerPitchConfiguration` (destination points in meters), and returns the 3x3 homography matrix. This replaces the current `cv2.getPerspectiveTransform` call that uses four estimated points.

```python
# Conceptual replacement in view_transformer.py
import supervision as sv
from sports.configs.soccer import SoccerPitchConfiguration

config = SoccerPitchConfiguration()
# keypoints from YOLO11-pose output: shape (32, 3) — x, y, conf
# filter to confident keypoints only (conf > 0.5)
src_pts = detected_keypoints[confident_mask][:, :2]
dst_pts = config.vertices[confident_mask]  # real-world meter coords
H, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC)
```

**`findHomography` advantage over `getPerspectiveTransform`:** Accepts any number of point correspondences (not exactly 4), uses RANSAC to reject outlier keypoints, and produces a more accurate homography even when some keypoints are partially occluded.

**Installation:**
```bash
pip install git+https://github.com/roboflow/sports.git
```

**Confidence:** MEDIUM. The Roboflow model is well-documented and actively used in the roboflow/sports reference examples. Main risk: the pre-trained model may need fine-tuning on NC State footage if the camera angle or pitch markings differ significantly from training data.

---

### 3. ByteTrack ID-Switch Reduction

**Decision: Parameter tuning only. No new library.**

The current `sv.ByteTrack()` is instantiated with defaults. Supervision 0.27 (installed) exposes these constructor parameters:

| Parameter | Default | Recommended for Soccer | Effect |
|-----------|---------|----------------------|--------|
| `track_activation_threshold` | 0.25 | 0.3–0.4 | Higher = only confident detections start tracks; reduces ghost player IDs |
| `lost_track_buffer` | 30 | 60–90 (at 25 fps) | Frames to hold a lost track before discarding; reduces ID switches during brief occlusions |
| `minimum_matching_threshold` | 0.8 | 0.8–0.9 | IoU threshold for matching; higher = fewer wrong matches between nearby players |
| `minimum_consecutive_frames` | 1 | 3–5 | Track must appear in N consecutive frames before being emitted; eliminates single-frame ghost detections |
| `frame_rate` | 30 | Set to actual video fps | Scales `lost_track_buffer` duration correctly |

**What to change:**
```python
# In trackers/tracker.py — replace sv.ByteTrack() with:
self.tracker = sv.ByteTrack(
    track_activation_threshold=0.35,
    lost_track_buffer=75,           # ~3 seconds at 25 fps
    minimum_matching_threshold=0.85,
    minimum_consecutive_frames=3,
    frame_rate=fps                  # pass actual fps from video metadata
)
```

**Why not switch to BoT-SORT:** BoT-SORT adds camera motion compensation (useful when camera pans significantly) but requires ReID features — either a separate ReID model (more latency, more dependencies) or visual appearance embeddings (not supported out of the box in supervision's ByteTrack). For a static broadcast camera, ByteTrack with tuned parameters is sufficient. BoT-SORT is the right call only if camera motion compensation proves inadequate after tuning.

**Why not the separate `roboflow/trackers` library:** It is a newer, modular re-implementation but is pre-1.0 and adds installation complexity. supervision 0.27 ByteTrack with parameter tuning has zero new dependencies.

**Confidence:** HIGH. Parameters are documented in supervision GitHub issues and confirmed in multiple community discussions.

---

### 4. Individual Player Heatmaps

**Primary (static PNG — do in v2.0):**

**Decision: `mplsoccer` — already installed. No new library.**

The existing `generate_heatmaps.py` already uses `mplsoccer.Pitch.bin_statistic` and `pitch.heatmap` for team-level heatmaps. Per-player heatmaps use the same API, filtered by `track_id`:

```python
# Conceptual pattern — same API as team heatmaps
pitch = Pitch(pitch_type='custom', pitch_length=105, pitch_width=68)
fig, ax = pitch.draw()
player_positions = positions_df[positions_df['track_id'] == pid]
bs = pitch.bin_statistic(player_positions['x'], player_positions['y'],
                          statistic='count', bins=(16, 12))
pitch.heatmap(bs, ax=ax, cmap='hot')
fig.savefig(f'player_{pid}_heatmap.png', dpi=100, bbox_inches='tight')
```

Output: one PNG per player per clip. Naming convention: `player_{track_id}_{team}_heatmap.png`.

The `positions.json` (1Hz export, already produced) provides input. No format changes needed.

**Stretch goal (interactive player-toggle — defer to v2.1):**

**Decision: Pre-render all per-player PNGs; use JavaScript image-swap on the static site.**

Do NOT add Plotly Dash, Folium, or any Python server for the interactive stretch goal. The site is static (GitHub Pages). The correct approach for a static site:
- Pre-render per-player PNGs in Python (same pipeline)
- On the Astro site, embed a player selector (HTML `<select>` or button group) that swaps the displayed `<img src>` using ~10 lines of vanilla JS

This gives the "interactive" experience without any server dependency. No new Python library needed. No new JS framework needed.

**Confidence:** HIGH. mplsoccer 1.6.1 API is stable and this is a direct extension of existing code.

---

## Installation Changes

The only new dependency is `roboflow/sports` (for pitch calibration):

```bash
# Add to requirements.txt
# sports — no PyPI release; install from source
# pip install git+https://github.com/roboflow/sports.git

# If fine-tuning the YOLO pitch keypoint model:
# No additional package — ultralytics already handles YOLO11-pose training
```

Updated `requirements.txt`:
```
ultralytics>=8.0.0
supervision>=0.27.0          # pin to confirmed-working version
opencv-python-headless>=4.8.0
numpy>=1.24.0
pandas>=2.0.0
scikit-learn>=1.3.0
mplsoccer>=1.6.0
pytest>=7.0.0
# Install separately (no PyPI release):
# pip install git+https://github.com/roboflow/sports.git
```

---

## Alternatives Considered

| Feature | Recommended | Alternative | Why Not |
|---------|-------------|-------------|---------|
| Pitch calibration model | YOLO11-pose + Roboflow football-field-detection dataset | SoccerNet sn-calibration (HRNetV2 backbone) | HRNetV2 is heavier, requires separate inference stack, not ultralytics-compatible; overkill for 1-2 week timeline |
| Pitch calibration model | YOLO11-pose | Manual 4-point vertex estimation (current) | Current approach causes ~268 km/h ghost speeds; inadequate for accurate event detection |
| Event detection | Rule-based Python | ML event classifier (action recognition model) | Requires labeled event data, training pipeline, GPU inference; F-score 0.93 from rules is sufficient for v2.0 demo |
| Tracking stability | ByteTrack parameter tuning | Switch to BoT-SORT | BoT-SORT needs ReID model (new dependency, latency); supervision's ByteTrack API exposes enough knobs to solve the ghost-player problem |
| Tracking stability | ByteTrack parameter tuning | Switch to `roboflow/trackers` library | Pre-1.0, no stability guarantee; supervision 0.27 ByteTrack already installed and sufficient |
| Interactive heatmaps | JS image-swap on static site | Plotly Dash / Folium server | Site is GitHub Pages (static); adding a server invalidates the entire hosting approach; defer real interactivity to Phase 2 web app |
| Individual player heatmaps | mplsoccer (existing) | matplotlib + scipy.stats.gaussian_kde directly | mplsoccer already installed, wraps the pitch drawing and bin_statistic correctly; no reason to bypass it |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SoccerNet `sn-calibration` repo | Standalone Python repo, not a pip package, requires HRNetV2 weights download, heavy setup; designed for research benchmarks not production pipelines | YOLO11-pose + Roboflow football-field-detection model (ultralytics-native) |
| `roboflow/trackers` (separate library) | Immature (pre-1.0), adds install complexity, duplicates supervision ByteTrack which is already installed at 0.27 | supervision `sv.ByteTrack` with tuned parameters |
| Plotly Dash / Folium for interactive heatmaps | Requires a running server — incompatible with GitHub Pages static hosting | JS `<img>` swap with pre-rendered PNGs |
| ML-based event detection (action recognition) | Requires labeled training data for NC State clips, GPU inference at runtime, 2–4 week integration; accuracy gain over rule-based is marginal for demo scope | Rule-based possession-change event logic |
| `cv2.getPerspectiveTransform` with 4 estimated points | Produces wildly inaccurate perspective mapping (ghost speeds); current behavior | `cv2.findHomography` with 32 YOLO-detected keypoints + RANSAC |

---

## Stack Patterns by Condition

**If the YOLO pitch keypoint model performs poorly on NC State footage (< 10 keypoints detected per frame with conf > 0.5):**
- Fall back to semi-automated calibration: detect keypoints, display to user for manual correction, then compute homography
- Or: fine-tune the Roboflow model on 50–100 annotated NC State frames using ultralytics YOLO11 training

**If tracking stability issues persist after ByteTrack tuning:**
- Profile which frames produce ID switches; if camera motion is the root cause, add BoT-SORT (pip install from roboflow/trackers, use camera motion compensation flag)
- If occlusion is the root cause, increase `lost_track_buffer` further (up to 5 seconds worth of frames)

**If per-player heatmaps produce noisy output (player tracked for < 30 seconds):**
- Apply minimum position count threshold before rendering heatmap (e.g., skip players with fewer than 30 recorded positions)
- Use larger bin size (`bins=(8, 6)` instead of `(16, 12)`) to smooth sparse data

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|----------------|-------|
| supervision | 0.27.0.post2 | ultralytics >=8.0.0 | Currently installed; `sv.ByteTrack` `minimum_consecutive_frames` confirmed available at this version |
| roboflow/sports | git main | supervision 0.27, ultralytics >=8.0.0, OpenCV >=4.8 | No version pinning possible (no PyPI release); pin via git commit hash in production |
| mplsoccer | >=1.6.0 | matplotlib >=3.5, numpy >=1.21 | `bin_statistic` and `heatmap` API stable since 1.1; no breaking changes expected |
| ultralytics | >=8.0.0 | YOLO11-pose task | YOLO11-pose requires ultralytics >=8.1.0; confirm with `pip show ultralytics` |

---

## Sources

- Supervision trackers docs: `supervision.roboflow.com/trackers/` — ByteTrack parameter names and defaults confirmed
- GitHub issue `roboflow/supervision#1044` — `minimum_consecutive_frames` parameter confirmed, community validation of parameter tuning for ID switch reduction
- GitHub discussion `roboflow/supervision#1001` — community-documented parameter ranges for sport tracking scenarios
- Roboflow blog "Camera Calibration in Sports with Keypoints" (`blog.roboflow.com/camera-calibration-sports-computer-vision/`) — YOLO keypoint + findHomography pattern, 32-keypoint dataset reference (MEDIUM confidence — blog, not official docs)
- Roboflow Universe `football-field-detection-f07vi` — 32-keypoint soccer pitch model, actively maintained as of 2025
- `github.com/roboflow/sports` — `SoccerPitchConfiguration`, soccer pitch annotation utilities; install via git (no PyPI)
- Springer article "Automatic event detection in football using tracking data" (2022) — rule-based F-scores: passes 0.93, shots 0.95 (MEDIUM confidence — academic, not implementation docs)
- mplsoccer docs `mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_heatmap.html` — `bin_statistic` + `heatmap` API confirmed for per-player use (HIGH confidence — official docs)

---

*Stack research for: Korner Flags v2.0 — event detection, pitch calibration, tracking stability, individual heatmaps*
*Researched: 2026-03-24*

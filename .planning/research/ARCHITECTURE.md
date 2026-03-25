# Architecture Research

**Domain:** Soccer video analysis pipeline — v2.0 feature integration
**Researched:** 2026-03-24
**Confidence:** HIGH — direct codebase reading + verified external sources

## Standard Architecture

### System Overview: v1.0 (Current State)

```
┌──────────────────────────────────────────────────────────────────┐
│                         main.py (CLI)                            │
│  argparse → orchestrates all modules in sequence                 │
├──────────────────────────────────────────────────────────────────┤
│                       DETECTION LAYER                            │
│  ┌───────────────────────┐   ┌──────────────────────────────┐    │
│  │  Tracker              │   │  CameraMovementEstimator      │    │
│  │  YOLO + ByteTrack     │   │  optical flow (Lucas-Kanade) │    │
│  │  → tracks{}           │   │  → camera_movement_per_frame │    │
│  └──────────┬────────────┘   └──────────────┬───────────────┘    │
│             │                               │                    │
├─────────────▼───────────────────────────────▼────────────────────┤
│                       COORDINATE LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  ViewTransformer                                           │   │
│  │  Estimated pixel_vertices → getPerspectiveTransform()     │   │
│  │  → position_transformed (meters) written into tracks{}    │   │
│  └───────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                       ANALYTICS LAYER                            │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ TeamAssigner │  │ PlayerBallAssigner│  │SpeedAndDistance   │   │
│  │ KMeans color │  │ → has_ball flag  │  │Estimator          │   │
│  │ → team 1 / 2 │  │ → team_ball_     │  │→ speed, distance  │   │
│  └──────────────┘  │   control[]      │  └───────────────────┘   │
│                    └──────────────────┘                          │
├──────────────────────────────────────────────────────────────────┤
│                       OUTPUT LAYER                               │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ draw_annotations │  │ _stats.json    │  │ _positions.json │   │
│  │ annotated .mp4   │  │ possession,    │  │ 1Hz per-player  │   │
│  │                  │  │ speed, dist    │  │ coords          │   │
│  └──────────────────┘  └────────────────┘  └─────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│         generate_heatmaps.py (separate CLI script)               │
│  positions.json → mplsoccer → _heatmap_team1.png + team2.png     │
└──────────────────────────────────────────────────────────────────┘
```

### System Overview: v2.0 Target

```
┌──────────────────────────────────────────────────────────────────┐
│                  main.py (CLI) — modified                        │
│  + --calibrate flag  + EventDetector call  + expanded JSON       │
├──────────────────────────────────────────────────────────────────┤
│              COORDINATE LAYER — modified with new front-end      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  PitchCalibrator (NEW MODULE)                             │   │
│  │  YOLOv8-keypoint pitch model → 32-point field detection   │   │
│  │  → calibrated pixel_vertices OR None (fallback)           │   │
│  └─────────────────────────────┬─────────────────────────────┘   │
│                                │                                 │
│  ┌─────────────────────────────▼─────────────────────────────┐   │
│  │  ViewTransformer — accepts calibrated_vertices arg        │   │
│  │  (existing fallback to estimated vertices if None)        │   │
│  └───────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│              DETECTION LAYER — parameter tuning only             │
│  ┌───────────────────────┐   ┌──────────────────────────────┐    │
│  │  Tracker              │   │  CameraMovementEstimator      │    │
│  │  ByteTrack params     │   │  (unchanged)                  │    │
│  │  tuned for stability  │   │                               │    │
│  └───────────────────────┘   └──────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                   ANALYTICS LAYER — new module added             │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ TeamAssigner │  │ PlayerBallAssigner│  │SpeedAndDistance   │   │
│  │ (unchanged)  │  │ (unchanged)       │  │Estimator          │   │
│  └──────────────┘  └──────────────────┘  │(unchanged)        │   │
│                                          └───────────────────┘   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  EventDetector (NEW MODULE)                               │   │
│  │  consumes: tracks{}, team_ball_control[], video_info{}    │   │
│  │  → events[] list: passes, shots, assists per frame        │   │
│  └───────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                    OUTPUT LAYER — expanded                       │
│  ┌──────────────────┐  ┌──────────────────────────┐             │
│  │ draw_annotations │  │ _stats.json — expanded   │             │
│  │ + draw_events()  │  │ + events[] array          │             │
│  │ (event labels on │  │ + per-player pass/shot/   │             │
│  │  annotated video)│  │   assist counts           │             │
│  └──────────────────┘  │ + heatmap_url per player  │             │
│                        └──────────────────────────┘             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  generate_heatmaps.py — extended                          │   │
│  │  + --per-player flag → _heatmap_player_{id}.png per player│   │
│  └───────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                   site/ (Astro, GitHub Pages) — expanded         │
│  manifest.json — no schema change required                       │
│  [slug].astro — import EventsTable + PlayerHeatmapGrid           │
│  EventsTable.astro (NEW component)                               │
│  PlayerHeatmapGrid.astro (NEW component)                         │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Existing Modules: Change Summary

| Module | Current Responsibility | v2.0 Change |
|--------|----------------------|-------------|
| `main.py` | CLI orchestration, JSON export | Add `--calibrate` flag; call PitchCalibrator before ViewTransformer; call EventDetector after possession tracking; pass `events[]` to `generate_stats()`; add ghost-player filter in stats |
| `trackers/tracker.py` | YOLO detection, ByteTrack, annotation drawing | Tune ByteTrack constructor params (`match_thresh`, `track_buffer`); add `draw_events(frames, events)` method for in-video event labels |
| `view_transformer/view_transformer.py` | Perspective transform using estimated vertices | Already accepts `pixel_vertices` param — no logic change needed; just pass calibrated vertices from PitchCalibrator when available |
| `generate_heatmaps.py` | Team-level PNG heatmaps from positions.json | Add `--per-player` flag; filter positions.json by `player_id`; generate one PNG per player in same style as team heatmaps |
| `player_ball_assigner/player_ball_assigner.py` | Ball-to-nearest-player assignment | No change — EventDetector reads the `has_ball` flag it sets |
| `speed_and_distnace_estimator/` | Speed/distance calculation | No change |
| `camera_movement_estimator/` | Optical flow camera pan | No change |
| `team_assigner/team_assigner.py` | KMeans jersey color clustering | No change |

### New Modules

| Module | Responsibility | Key Inputs | Key Outputs |
|--------|---------------|------------|-------------|
| `pitch_calibrator/pitch_calibrator.py` | Run YOLOv8-keypoint pitch model on first 3-5 frames; select 4 well-spaced, high-confidence corner keypoints; return calibrated homography source vertices | `video_frames[:5]`, `model_path` | `np.ndarray` shape (4,2) or `None` on failure |
| `event_detector/event_detector.py` | Detect passes, shots, assists using a deterministic state machine over possession changes and ball trajectory | `tracks{}`, `team_ball_control[]`, `video_info{}` | `events[]` list of dicts with `frame_num`, `type`, `player_id`, `team`, optional `to_player_id` |

## Recommended Project Structure

```
Korner flag/
├── main.py                              # CLI — add --calibrate, EventDetector, expanded stats
├── generate_heatmaps.py                 # add --per-player flag
│
├── trackers/
│   └── tracker.py                       # tune ByteTrack params; add draw_events()
│
├── pitch_calibrator/                    # NEW
│   ├── __init__.py
│   └── pitch_calibrator.py
│
├── event_detector/                      # NEW
│   ├── __init__.py
│   └── event_detector.py
│
├── view_transformer/
│   └── view_transformer.py              # no logic change; existing pixel_vertices param used
│
├── player_ball_assigner/                # unchanged
├── camera_movement_estimator/           # unchanged
├── speed_and_distnace_estimator/        # unchanged
├── team_assigner/                       # unchanged
├── utils/                               # unchanged
│
├── models/
│   ├── best.pt                          # existing player/ball detection
│   └── pitch_keypoints.pt               # NEW: YOLOv8-keypoint pitch model
│                                        # source: roboflow-jvuqo/football-field-detection-f07vi
│
├── site/
│   └── src/
│       ├── components/
│       │   ├── EventsTable.astro        # NEW: renders events[] from stats JSON
│       │   └── PlayerHeatmapGrid.astro  # NEW: renders per-player heatmap PNGs
│       │   ├── PossessionBar.astro      # unchanged
│       │   ├── PlayerStatsTable.astro   # unchanged
│       │   └── ComingSoonCards.astro    # remove or repurpose
│       └── pages/clips/[slug].astro     # import + use two new components
│
└── tests/
    ├── test_event_detector.py           # NEW
    ├── test_pitch_calibrator.py         # NEW
    └── (existing tests unchanged)
```

### Structure Rationale

- **`pitch_calibrator/` as its own module:** Follows the project's existing one-concern-per-module convention. Calibration is a distinct pre-processing step with its own model weight dependency. Isolating it means the fallback to estimated vertices stays cleanly in ViewTransformer without entangling logic.
- **`event_detector/` as its own module:** Event detection is stateful (needs lookback across frames for assist linkage), depends on fully-enriched tracks, and will have its own test suite. Adding it to tracker.py would create a god class.
- **`generate_heatmaps.py` stays as a top-level script:** Per-player heatmaps are post-processing that mirrors existing team heatmap logic. A `--per-player` flag is minimally invasive and fits the script's existing CLI design.
- **New Astro components are additive:** `EventsTable` and `PlayerHeatmapGrid` import into `[slug].astro` without touching `PossessionBar` or `PlayerStatsTable`.

## Architectural Patterns

### Pattern 1: Staged Track Enrichment (existing, unchanged)

**What:** Each analytics module writes new keys into the `tracks{}` dict in-place. `main.py` calls modules in sequence. Each module reads only the keys written by prior modules.

**When to use:** Any new analytics that need per-frame, per-player data follow this pattern. This is the project's existing data contract.

**Existing key chain in `tracks["players"][frame_num][player_id]`:**
```
bbox                 ← Tracker
position             ← Tracker.add_position_to_track()
position_adjusted    ← CameraMovementEstimator
position_transformed ← ViewTransformer
speed, distance      ← SpeedAndDistanceEstimator
team, team_color     ← TeamAssigner
has_ball             ← PlayerBallAssigner
```

**EventDetector does NOT add to tracks{}** — events are point-in-time occurrences (frame_num, player_id, type) rather than per-frame properties. EventDetector returns a separate `events[]` list to avoid bloating the tracks structure with sparse data.

### Pattern 2: Fallback-First Calibration

**What:** PitchCalibrator attempts automatic keypoint detection on the first 3-5 frames. If fewer than 4 high-confidence, geometrically distinct keypoints are found, it logs a warning and returns `None`. ViewTransformer then falls back to its existing proportional vertex estimation — the pipeline completes with the old behavior rather than hard-erroring.

**When to use:** Enabled by `--calibrate` CLI flag. Without the flag, the entire calibration branch is skipped and existing behavior is completely unchanged. This protects existing clip processing.

**Trade-offs:** Ghost speeds (~268 km/h) persist on failed calibration, but the pipeline never blocks on a bad frame. For NC State clips with standard broadcast camera angles, keypoint detection should succeed on the first frame.

### Pattern 3: Possession-Change State Machine for Event Detection

**What:** EventDetector makes a single forward pass over `team_ball_control[]` and `tracks{}`. It maintains a small state object and fires events deterministically:

```
State: { possessing_player_id, possessing_team, possession_start_frame }

For each frame f:

  If team_ball_control[f] != team_ball_control[f-1]:
    → PASS event: passer = previous possessing player,
                  receiver = current possessing player
    If ball velocity vector at frame f-3..f points toward goal area
    (position_transformed delta, threshold ~15 km/h, direction ±30 deg of goal):
      → SHOT event for current possessing player
      If last event within 90 frames was a PASS by a different player:
        → ASSIST event for the passer

  Ball velocity check (independent of possession change):
    If speed > 25 km/h AND direction toward goal AND no SHOT in last 30 frames:
      → SHOT event (catches shots that don't result in possession transfer)
```

**Why deterministic, not ML:** All required data (`position_transformed`, `team_ball_control`, `has_ball`) already exists in the tracks dict. A rules-based state machine adds zero new model dependencies and runs in O(frames) time. ML shot classification requires labeled training data this project does not have. Accuracy is limited but sufficient for a coaching demo.

**Trade-offs:** Misses shots on goal with no possession change (e.g., ball deflects off goalkeeper without being claimed). False positives on long clearances near the goal third. Threshold tuning is required per clip.

## Data Flow

### v2.0 Full Pipeline Sequence

```
CLI args (--input, --calibrate, --confidence, ...)
    |
    v
read_video() → video_frames[], video_info{}
    |
    |-- [if --calibrate] ──────────────────────────────────────────┐
    |                                                              │
    |   PitchCalibrator.detect_keypoints(video_frames[:5])        │
    |   → calibrated_vertices (np.ndarray) OR None                │
    |   ← ─────────────────────────────────────────────────────────┘
    v
Tracker.get_object_tracks() → tracks{}  [bbox per frame]
    |
    v
Tracker.add_position_to_track(tracks) → tracks[...]["position"]
    |
    v
CameraMovementEstimator.get_camera_movement()
CameraMovementEstimator.add_adjust_position_to_tracks()
    → tracks[...]["position_adjusted"]
    |
    v
ViewTransformer(pixel_vertices=calibrated_vertices or estimated)
ViewTransformer.add_transformered_position_to_tracks()
    → tracks[...]["position_transformed"]
    |
    v
Tracker.interpolate_ball_positions()
    |
    v
SpeedAndDistanceEstimator.add_speed_and_distance_to_tracks()
    → tracks[...]["speed", "distance"]
    |
    v
TeamAssigner.assign_teams() / get_player_team()
    → tracks["players"][f][id]["team", "team_color"]
    |
    v
PlayerBallAssigner.assign_ball_to_player() per frame
    → tracks["players"][f][id]["has_ball"]
    → team_ball_control[] array
    |
    v
EventDetector.detect_events(tracks, team_ball_control, video_info)  [NEW]
    → events[] = [{ frame_num, type, player_id, team, ... }, ...]
    |
    v
tracker.draw_annotations(frames, tracks, team_ball_control)
tracker.draw_events(output_frames, events)  [NEW method]
camera_movement_estimator.draw_camera_movement(...)
speed_and_distance_estimator.draw_speed_and_distance(...)
    |
    v
save_video() → _annotated.mp4
generate_stats(tracks, team_ball_control, video_info, events)  [modified]
    → _stats.json  [expanded schema]
export_positions(tracks, video_info)  → _positions.json  [unchanged]

--- separate post-processing run ---

generate_heatmaps.py --positions _positions.json
    → _heatmap_team1.png, _heatmap_team2.png  [existing]

generate_heatmaps.py --positions _positions.json --per-player
    → _heatmap_player_{id}.png per active player  [new]
```

### JSON Schema Changes

**v1.0 `_stats.json` schema:**
```json
{
  "video": { "fps", "resolution", "total_frames", "duration_seconds" },
  "possession": { "team_1_percent", "team_2_percent" },
  "players": {
    "7": { "team", "distance_m", "max_speed_kmh", "avg_speed_kmh" }
  }
}
```

**v2.0 `_stats.json` schema** (additive — no breaking changes to existing fields):
```json
{
  "video": { "fps", "resolution", "total_frames", "duration_seconds" },
  "possession": { "team_1_percent", "team_2_percent" },
  "players": {
    "7": {
      "team": 1,
      "distance_m": 74.2,
      "max_speed_kmh": 22.1,
      "avg_speed_kmh": 8.9,
      "passes": 3,
      "shots": 1,
      "assists": 1,
      "heatmap_url": "/data/clip_heatmap_player_7.png"
    }
  },
  "events": [
    {
      "frame_num": 312,
      "time_seconds": 12.5,
      "type": "pass",
      "player_id": 7,
      "team": 1,
      "to_player_id": 12
    },
    {
      "frame_num": 580,
      "time_seconds": 23.2,
      "type": "shot",
      "player_id": 12,
      "team": 1,
      "on_target": true
    },
    {
      "frame_num": 575,
      "time_seconds": 23.0,
      "type": "assist",
      "player_id": 7,
      "team": 1,
      "assisted_player_id": 12
    }
  ]
}
```

**`manifest.json` schema: no change required.** Per-player heatmap URLs live inside each player's entry in `_stats.json`, which `[slug].astro` already imports at build time. The manifest stays clip-level metadata only.

### Ghost Player Filtering (stats generation change)

The current stats JSON contains 40+ player IDs for a 30-second clip, many with zero distance and zero speed. These are ByteTrack ID switches where the same physical player got re-identified with a new ID. This is visible in the existing `08fd33_4_annotated_stats.json` (players 103, 135, 139, etc.).

**Fix:** Add minimum-frame filter in `generate_stats()`. Exclude any `player_id` that appeared in fewer than `fps * 1` frames (~25 frames at 25fps = 1 second). This is a single-line filter in the existing stats loop — no module needed:

```python
# Only include players with sufficient tracked duration
MINIMUM_FRAMES = round(video_info['fps'] * 1.0)
player_frame_counts = Counter(
    pid for frame_track in tracks['players'] for pid in frame_track
)
valid_pids = {pid for pid, count in player_frame_counts.items()
              if count >= MINIMUM_FRAMES}
```

Apply `valid_pids` filter when building the `players{}` dict. Combined with ByteTrack stability tuning, this removes most ghost entries.

## Integration Points

### New Module Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `main.py` → `PitchCalibrator` | Direct call; returns `np.ndarray` or `None` | Only called when `--calibrate` flag set; `None` triggers existing fallback in ViewTransformer |
| `PitchCalibrator` → `ViewTransformer` | `ViewTransformer(pixel_vertices=calibrated_vertices)` | `ViewTransformer.__init__` already accepts `pixel_vertices` param — zero interface change needed |
| `main.py` → `EventDetector` | Direct call after possession tracking loop; receives fully-enriched `tracks`, `team_ball_control`, `video_info` | Must run after PlayerBallAssigner and TeamAssigner so `has_ball` and `team` keys exist |
| `EventDetector` → annotation drawing | `events[]` list passed to new `Tracker.draw_events(frames, events)` method | Additive — existing `draw_annotations()` signature unchanged |
| `generate_stats()` → `events[]` | Add `events=None` default parameter; include in returned dict | Backward-compatible — existing callers unaffected |
| `generate_heatmaps.py` → per-player PNGs | `--per-player` flag iterates unique `player_id` values in positions.json | Existing `--positions` behavior unchanged |
| `[slug].astro` → `EventsTable.astro` | Astro component import; reads `stats.events[]` | `stats` JSON already imported at build time; no new fetch needed |
| `[slug].astro` → `PlayerHeatmapGrid.astro` | Reads `stats.players[id].heatmap_url` | New field in expanded stats JSON |

### Tracking Stability: Parameter Change Location

ByteTrack is instantiated in `Tracker.__init__()` as:
```python
self.tracker = sv.ByteTrack()
```

The fix is a 3-parameter change at this single instantiation site. Recommended values based on supervision community findings and soccer player tracking research:

| Parameter | Current | Recommended | Effect |
|-----------|---------|-------------|--------|
| `match_thresh` | default (0.8) | 0.85 | Higher value reduces ID switches when players cross each other |
| `track_buffer` | default (30) | 60 | At 25fps = 2.4 seconds; keeps IDs alive through brief occlusions |
| `track_activation_threshold` | default | 0.35 | Reduces ghost player creation from low-confidence detections |

No new module, no new test, no interface change — three constructor arguments.

### Site Integration: What Changes in `[slug].astro`

The page currently imports: `VideoPlayer`, `PossessionBar`, `PlayerStatsTable`, `ComingSoonCards`.

v2.0 changes:
- Import and render `EventsTable` (reads `stats.events[]`)
- Import and render `PlayerHeatmapGrid` (reads per-player heatmap URLs from `stats.players`)
- Remove or repurpose `ComingSoonCards` (its placeholder cards become real features)
- `PlayerStatsTable` can be extended to show pass/shot/assist columns or left unchanged

## Scaling Considerations

This is a batch-processing local CLI tool, not a multi-user service. Scale means video length and clip count, not concurrent users.

| Scale | Architecture Adjustment |
|-------|-------------------------|
| Short clips < 60s (current) | No changes — full video in RAM is fine |
| Full 90-min match | `read_video()` loads all frames into RAM; at 1080p this is ~50GB. Chunked frame streaming via generator needed. Not a v2.0 concern. |
| 10+ clips on site | Batch shell script calling `main.py` per clip; no architectural change. |

### First Bottleneck

RAM consumption from `read_video()` loading all frames at once. Not an issue for the current 30-second NC State clips. Flag as a phase-3 concern when full match processing is needed.

## Anti-Patterns

### Anti-Pattern 1: Adding Event Detection Logic Inside tracker.py

**What people do:** Bolt event detection onto the Tracker class because it "knows" about detections.

**Why it's wrong:** Tracker already handles detection, tracking, and annotation drawing. Events require enriched tracks (team assigned, position_transformed populated) that are added by modules that run after Tracker. Adding event logic to tracker.py means it would receive incomplete data or the module would need to be invoked a second time. It creates a 500+ line god class with four distinct concerns.

**Do this instead:** New `event_detector/` module that runs after all track enrichment is complete (after PlayerBallAssigner in main.py's sequence). Tracker's only event-related responsibility is the new `draw_events()` method, which is annotation drawing — already its domain.

### Anti-Pattern 2: Re-running Pitch Calibration Every Frame

**What people do:** Call pitch keypoint detection on every video frame for dynamic homography updates.

**Why it's wrong:** YOLOv8 keypoint inference runs ~50-100ms per frame on CPU. For a 750-frame clip (30s at 25fps) this adds 37-75 seconds of overhead. The pitch geometry does not change during a clip; the camera pan is already compensated by CameraMovementEstimator.

**Do this instead:** Run pitch keypoint detection on the first 3-5 frames only. Average the confident keypoint positions. Use the result as a fixed homography for the entire clip. If keypoints vary significantly across the first 5 frames (camera still panning), take the median.

### Anti-Pattern 3: Ghost Player Accumulation in Per-Player Heatmaps

**What currently happens:** 40+ player IDs accumulate in stats JSON due to ByteTrack ID switches. If per-player heatmaps are generated without filtering, the output directory fills with 40 heatmap PNGs for a 30-second clip where at most 22 real players appear.

**Why it's wrong:** Ghost IDs produce heatmaps with 1-3 data points that look like a single dot on the pitch. They inflate output file count and confuse the site display.

**Do this instead:** Apply the minimum-frame filter (1 second of tracked duration) in both `generate_stats()` and in `generate_heatmaps.py --per-player`. Only generate heatmap PNGs for player IDs that survived the filter. This is a filter on the `positions.json` data, not a change to the tracking logic.

### Anti-Pattern 4: Storing Per-Player Heatmap Paths in manifest.json

**What people do:** Add `heatmap_player_7_url`, `heatmap_player_12_url`, etc. as top-level clip fields in manifest.json.

**Why it's wrong:** Player IDs are not stable across clips. Adding individual player URL fields creates a large manifest that must be manually updated per clip. With 10+ tracked players per clip the manifest becomes unwieldy.

**Do this instead:** Store `heatmap_url` inside each player's entry in `_stats.json` (`players["7"]["heatmap_url"]`). The `[slug].astro` page already imports the stats JSON at build time — no manifest change required, no new fetch needed.

### Anti-Pattern 5: Making Calibration Mandatory

**What people do:** Fail the pipeline if PitchCalibrator cannot find reliable keypoints.

**Why it's wrong:** The pitch keypoint model may fail on non-standard camera angles, partially visible pitches, or heavy fisheye distortion. A hard failure on calibration would block the entire pipeline for clips that would otherwise process fine with estimated vertices.

**Do this instead:** PitchCalibrator returns `None` on failure and logs a warning. ViewTransformer falls back to estimated proportional vertices. Ghost speeds may persist but the pipeline completes. This is the existing v1.0 behavior — calibration is an upgrade, not a requirement.

## Build Order (Recommended)

Dependencies determine order. Each step produces clean inputs for the next.

```
Step 1: Tracking Stability
  → tune ByteTrack params in Tracker.__init__()
  → add minimum-frame ghost filter in generate_stats()
  → cleaner tracks{}, fewer ghost IDs in all downstream outputs

Step 2: Pitch Calibration
  → create pitch_calibrator/ module
  → add pitch_keypoints.pt model to models/
  → add --calibrate flag to main.py
  → accurate position_transformed values; ghost speeds eliminated
  → depends on Step 1 (clean tracks improve calibration keypoint selection)

Step 3: Individual Player Heatmaps
  → add --per-player flag to generate_heatmaps.py
  → apply minimum-frame filter (from Step 1) to avoid ghost-player PNGs
  → can be developed in parallel with Step 2 (no dependency on calibration)

Step 4: Event Detection
  → create event_detector/ module
  → add EventDetector call to main.py after possession loop
  → add draw_events() to tracker.py
  → expand _stats.json schema with events[] and per-player event counts
  → depends on Steps 1 + 2 for clean tracks and accurate coordinates
  → depends on Step 1 ghost filter (ghost player events are noise)

Step 5: Site Updates
  → create EventsTable.astro and PlayerHeatmapGrid.astro
  → modify [slug].astro to import new components
  → depends on Steps 3 + 4 (final stats JSON schema + per-player heatmap PNGs)
```

**Rationale:** Steps 1 and 2 are foundational because they fix the data quality problems (ghost IDs, phantom 268 km/h speeds) that corrupt every downstream feature. Building event detection on top of unreliable tracks produces unreliable events. Step 3 (player heatmaps) is independent and can be built in parallel. Step 5 (site) is always last because it depends on the final output file formats from all pipeline steps.

## Sources

- Direct codebase analysis: `trackers/tracker.py`, `main.py`, `view_transformer/view_transformer.py`, `player_ball_assigner/player_ball_assigner.py`, `generate_heatmaps.py`, `site/src/pages/clips/[slug].astro`, `site/public/data/08fd33_4_annotated_stats.json`
- [roboflow/sports — pitch keypoint detection, ViewTransformer](https://github.com/roboflow/sports) (MEDIUM confidence — repo confirmed via search; exact API not directly inspected)
- [Roboflow blog — Camera Calibration in Sports with Keypoints](https://blog.roboflow.com/camera-calibration-sports-computer-vision/) (MEDIUM confidence)
- [Roboflow Universe — football-field-detection keypoint model](https://universe.roboflow.com/roboflow-jvuqo/football-field-detection-f07vi) (MEDIUM confidence)
- [roboflow/supervision discussion — How to improve ByteTrack performance](https://github.com/roboflow/supervision/discussions/1001) (HIGH confidence — official repo discussion)
- [Improved ByteTrack for Soccer Multi-Player Tracking](https://github.com/ruiqiRichard/Improved_ByteTrack_for_Soccer_Multi-Player_Tracking) (MEDIUM confidence)
- [Springer — Automatic event detection in football using tracking data](https://link.springer.com/article/10.1007/s12283-022-00381-6) (HIGH confidence — peer-reviewed) — deterministic possession-change event detection
- [SoccerNet Camera Calibration — Keypoint Exploitation](https://arxiv.org/html/2410.07401v1) (HIGH confidence — arxiv preprint)
- [mplsoccer heatmap documentation](https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_heatmap.html) (HIGH confidence — official docs)

---
*Architecture research for: Korner Flags v2.0 feature integration*
*Researched: 2026-03-24*

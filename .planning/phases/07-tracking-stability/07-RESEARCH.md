# Phase 7: Tracking Stability - Research

**Researched:** 2026-03-25
**Domain:** supervision ByteTrack tuning + ghost track filtering in Python
**Confidence:** HIGH

## Summary

Phase 7 has two independent but complementary tasks: (1) tune `sv.ByteTrack()` parameters so fewer fragmented IDs are created in the first place, and (2) add a post-tracking ghost filter that removes any remaining short-lived track IDs from the full tracks dict before anything downstream runs.

The installed supervision version is **0.27.0.post2**, which exposes a five-parameter `ByteTrack` constructor. The most important finding is that supervision's `minimum_consecutive_frames` parameter provides a *tracker-internal* mechanism that suppresses a track from appearing in output until it has been continuously detected for N frames. Setting this to a value between 3 and 5 eliminates a large class of ghost tracks at the source, before they ever reach the tracks dict. The residual ghost tracks (players who appear briefly after e.g. an occlusion re-entry) are handled by the separate post-processing filter required by D-03.

The `lost_track_buffer` parameter controls how many frames a lost track is held alive in the Kalman filter before its ID is retired. The default of 30 (meaning 30 real-world frames at 30 fps baseline) is generally appropriate for broadcast soccer but can be verified against the NC State clip's actual FPS.

**Primary recommendation:** Set `minimum_consecutive_frames=3`, `lost_track_buffer=30`, `frame_rate=<actual_video_fps>` in `sv.ByteTrack()` as the starting-point tuning. Implement a separate `filter_ghost_tracks(tracks, min_consecutive_frames=10)` utility in `utils/` to satisfy TRACK-01 exactly.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use published supervision/broadcast-footage recommended defaults as the starting point (track_buffer=30, match_thresh=0.8 or equivalent). No extended empirical trial runs.
- **D-02:** After applying published values, run once on the NC State clip and check unique ID count against the ≤35 target. If already passing, ship it. If not, do one tuning pass before moving on.
- **D-03:** Filter ghost tracks in a post-tracking pass, immediately after `get_object_tracks()` returns and before any downstream processing (speed/distance, team assignment, stats, positions). Everything downstream receives clean IDs automatically.
- **D-04:** Ghost threshold is **10 consecutive frames** — any track_id that appears in fewer than 10 consecutive frames is removed from the tracks dict.
- **D-05:** Filtering applies to player tracks only (referees are not mentioned in success criteria and have less impact on downstream stats).
- **D-06:** Hardcode the 10-frame threshold as a constant (matches TRACK-01 exactly). No CLI arg — can be promoted later if needed.
- **D-07:** Document the staleness risk in the `--use-stubs` help text: "Delete stubs/ after changing ByteTrack parameters or confidence threshold." No code change required.

### Claude's Discretion
- Exact supervision `ByteTrack()` constructor parameters to set (researcher should verify current supervision API — done, see Standard Stack)
- Whether to implement ghost filtering as a standalone `filter_ghost_tracks(tracks, min_frames=10)` utility or a method on the `Tracker` class
- Whether to log a warning when ghost tracks are removed (count + IDs removed)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRACK-01 | Pipeline filters ghost tracks (< 10 consecutive frames) from all downstream outputs (stats, heatmaps, events) | Ghost filtering algorithm documented in Architecture Patterns; post-tracking insertion point confirmed in main.py line ~72 |
| TRACK-02 | ByteTrack configured with tuned parameters (track_buffer, match_thresh) to reduce mid-clip ID switches on broadcast footage | All five supervision ByteTrack constructor parameters documented with verified defaults and recommended starting values |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| supervision | 0.27.0.post2 (installed) | ByteTrack tracker, `sv.ByteTrack()` | Already in project; verified installed |
| Python stdlib `collections` | — | `defaultdict`, for consecutive-run counting in ghost filter | No new dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Python stdlib `warnings` or `print` | — | Logging removed ghost track IDs | Claude's discretion item |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Standalone `filter_ghost_tracks()` in `utils/` | Method on `Tracker` class | Utility function is easier to unit-test and keeps `Tracker` focused on detection/annotation; either is acceptable per D-03 |
| Post-tracking filter | `minimum_consecutive_frames` alone | `minimum_consecutive_frames` only suppresses tracks on initial activation, not re-entry ghost fragments; both are needed |

**Installation:** No new packages required. All dependencies already installed.

**Version verification (confirmed from live environment):**
```
supervision 0.27.0.post2
```

---

## Architecture Patterns

### ByteTrack Constructor Parameters (supervision 0.27.0.post2)

Verified from `inspect.signature(sv.ByteTrack.__init__)` on the installed library:

| Parameter | Default | Meaning | Recommended Starting Value |
|-----------|---------|---------|---------------------------|
| `track_activation_threshold` | 0.25 | Minimum detection confidence to create a new track | 0.25 (keep default; confidence filtering is at YOLO level) |
| `lost_track_buffer` | 30 | Frames a lost track persists before retirement (normalized to 30fps baseline) | 30 (keep default; scales correctly with `frame_rate`) |
| `minimum_matching_threshold` | 0.8 | IoU threshold for associating detections to existing tracks | 0.8 (keep default per D-01) |
| `frame_rate` | 30 | Video FPS used to scale `lost_track_buffer` | Pass actual video FPS from `video_info['fps']` |
| `minimum_consecutive_frames` | 1 | Frames an object must be continuously detected before its ID is emitted | 3 (see reasoning below) |

**Important note on parameter naming:** supervision 0.27.0.post2 uses `track_activation_threshold` (not `track_thresh`), `lost_track_buffer` (not `track_buffer`), and `minimum_matching_threshold` (not `match_thresh`). These are supervision's renamed equivalents to the original ByteTrack paper terminology. The CONTEXT.md D-01 values map as: `track_buffer=30` → `lost_track_buffer=30`, `match_thresh=0.8` → `minimum_matching_threshold=0.8`.

**How `minimum_consecutive_frames` works (verified from STrack source):**

When a new detection appears, it starts as an unconfirmed track (`is_activated = False`). On each subsequent frame where the same object is continuously detected, `tracklet_len` increments. When `tracklet_len == minimum_consecutive_frames`, `is_activated` flips to `True` and the track receives an external ID that appears in output. Tracks that disappear before reaching the threshold are silently dropped — they never receive an ID and never appear in the tracks dict.

Setting `minimum_consecutive_frames=3` means a player must appear in 3 consecutive frames (~0.1 seconds at 30fps) before getting an ID. This eliminates detection artifacts from single-frame occlusion boundary crossings without penalizing genuine player appearances. A value of 5 is an alternative if 3 is insufficient.

**TRACK-02 constructor call:**
```python
# Source: verified from supervision 0.27.0.post2 inspect.signature
self.tracker = sv.ByteTrack(
    track_activation_threshold=0.25,
    lost_track_buffer=30,
    minimum_matching_threshold=0.8,
    frame_rate=fps,                    # pass actual video fps at construction
    minimum_consecutive_frames=3,
)
```

The `frame_rate` parameter requires the video FPS at tracker construction time, so `Tracker.__init__` must accept `fps` and pass it through.

### Ghost Filter Algorithm (TRACK-01)

The `tracks` dict structure (from tracker.py):
```python
tracks = {
    "players": [
        {track_id: {"bbox": [...], ...}},  # frame 0
        {track_id: {"bbox": [...], ...}},  # frame 1
        ...
    ],
    "referees": [...],
    "ball": [...]
}
```

Ghost detection requires counting **consecutive** frames, not total appearances. A track that appears in frames 0-8, disappears, then reappears in frames 50-58 has two independent runs of 9 frames each — both would be removed by a 10-consecutive-frame threshold. If the filter only counted total occurrences (0-8 + 50-58 = 18 total) it would incorrectly keep these.

**Algorithm: consecutive run detection**
```python
# Source: derived from tracks dict structure documented in 07-CONTEXT.md
MIN_CONSECUTIVE_FRAMES = 10

def filter_ghost_tracks(tracks: dict, min_consecutive_frames: int = MIN_CONSECUTIVE_FRAMES) -> dict:
    """
    Remove player track_ids that never appear in min_consecutive_frames
    consecutive frames. Applies to 'players' only (D-05).
    Returns the mutated tracks dict.
    """
    player_frames = tracks["players"]
    num_frames = len(player_frames)

    # Collect all unique player track_ids
    all_ids = set()
    for frame in player_frames:
        all_ids.update(frame.keys())

    ghost_ids = set()
    for tid in all_ids:
        max_run = 0
        current_run = 0
        for frame in player_frames:
            if tid in frame:
                current_run += 1
                max_run = max(max_run, current_run)
            else:
                current_run = 0
        if max_run < min_consecutive_frames:
            ghost_ids.add(tid)

    # Remove ghost ids from every frame
    if ghost_ids:
        for frame in player_frames:
            for tid in ghost_ids:
                frame.pop(tid, None)

    return tracks
```

Complexity: O(F * P) where F = frame count and P = unique player IDs. For a 90-second clip at 30fps (2700 frames) with ~50 unique IDs (before filtering), this is ~135,000 iterations — negligible.

**Insertion point in main.py (confirmed from code review):**
```python
# main.py — between line 72 and 75
tracks = tracker.get_object_tracks(
    video_frames,
    read_from_stub=args.use_stubs,
    stub_path=stub_path
)

# INSERT HERE — before add_position_to_track
tracks = filter_ghost_tracks(tracks)  # or filter_ghost_tracks(tracks) if mutating in place

# Get object positions
tracker.add_position_to_track(tracks)
```

### Ghost Filter Placement and Stub Cache Interaction

The ghost filter runs AFTER the stub load path (D-07). The stub stores raw detection output. The filter runs on the in-memory tracks dict in the pipeline, regardless of whether stubs were used. This is correct — stubs remain valid across reruns even after adjusting the filter threshold.

**Stub documentation update** (D-07 — code change is argparse help text only):
```python
parser.add_argument('--use-stubs', action='store_true',
    help='Use cached stub files if available (for development only). '
         'Delete stubs/ after changing ByteTrack parameters or confidence threshold.')
```

### Recommended Project Structure Change

No new directories. New file location:
```
utils/
├── video_utils.py        # existing
├── bbox_utils.py         # existing
└── track_utils.py        # NEW — filter_ghost_tracks() + MIN_CONSECUTIVE_FRAMES constant
```

`track_utils.py` is exported from `utils/__init__.py` alongside the existing utils.

### Where `frame_rate` Gets Passed to ByteTrack

Current `Tracker.__init__` signature: `def __init__(self, model_path, conf=0.1)`. ByteTrack is created with `sv.ByteTrack()` (no args). To pass `frame_rate`, the constructor must accept it:

```python
def __init__(self, model_path, conf=0.1, fps=30):
    self.model = YOLO(model_path)
    self.tracker = sv.ByteTrack(
        frame_rate=fps,
        minimum_consecutive_frames=3,
    )
    self.conf = conf
```

`main.py` already has `video_info['fps']` available before constructing `Tracker`. The call becomes:
```python
tracker = Tracker(args.model, conf=args.confidence, fps=video_info['fps'])
```

### Anti-Patterns to Avoid

- **Total frame count instead of consecutive run:** Checking `len([f for f in frames if tid in f]) < 10` will incorrectly keep players who appear briefly in two separate windows. Must count consecutive runs.
- **Filtering before stub save:** The stub must capture raw detections so it stays valid across threshold changes. Filter runs after stub load.
- **Mutating tracks during iteration:** Build the set of ghost IDs first, then remove in a second pass. Do not remove while iterating.
- **Applying ghost filter to referees or ball:** D-05 specifies players only. Ball uses track_id=1 (hardcoded) and is not subject to ghost filtering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Kalman filter prediction for lost tracks | Custom state estimator | `sv.ByteTrack` built-in | ByteTrack's Kalman filter handles motion prediction during occlusion; re-implementing would require matrix math and tuning the noise covariance |
| IoU matching between detections and tracks | Custom distance matrix | `sv.ByteTrack` built-in | Linear assignment over IoU matrix is already implemented and tested |
| Track lifetime management | Manual dict of frame counts | supervision `lost_track_buffer` parameter | The buffer handles frame-rate-normalized track expiry; hand-rolling this would diverge from the Kalman state |

**Key insight:** The only custom code needed is the post-tracking ghost filter — a simple consecutive-run counter. Everything tracking-related is already handled by supervision.

---

## Common Pitfalls

### Pitfall 1: minimum_consecutive_frames Does Not Solve Re-Entry Ghosts
**What goes wrong:** Setting `minimum_consecutive_frames=10` in `sv.ByteTrack()` and assuming ghost tracks are fully handled.
**Why it happens:** `minimum_consecutive_frames` only prevents IDs from being emitted during initial activation. If a legitimate track is lost and a ghost track re-appears, the re-activation path uses `re_activate()` which bypasses the consecutive frame gate entirely — the track is immediately marked active again.
**How to avoid:** Always run the post-tracking filter (D-03/D-04) in addition to setting `minimum_consecutive_frames`. The two mechanisms complement each other.
**Warning signs:** Unique ID count is still high even after setting `minimum_consecutive_frames`.

### Pitfall 2: frame_rate Default of 30 Scaling lost_track_buffer Incorrectly
**What goes wrong:** Video is 25fps but `frame_rate=30` (the default) is used. The internal `max_time_lost = int(frame_rate / 30.0 * lost_track_buffer)` computes `int(30/30.0 * 30) = 30` frames instead of the correct `int(25/30.0 * 30) = 25` frames.
**Why it happens:** `sv.ByteTrack()` is called with no arguments (current state of tracker.py line 15), so `frame_rate` defaults to 30 regardless of actual video FPS.
**How to avoid:** Pass actual FPS from `video_info['fps']` to `Tracker.__init__` and then to `sv.ByteTrack(frame_rate=fps)`.
**Warning signs:** Track IDs flickering more than expected on a 25fps clip; players re-appearing with new IDs after brief occlusions.

### Pitfall 3: Stub Cache Silently Preserves Old ByteTrack Output
**What goes wrong:** Developer changes ByteTrack parameters, re-runs with `--use-stubs`, and sees no improvement.
**Why it happens:** `get_object_tracks()` returns early from the pickle stub before ByteTrack is called at all. The new parameters have no effect.
**How to avoid:** Delete `stubs/tracks_stubs.pkl` after any change to ByteTrack parameters or `--confidence`. Document this in the help text (D-07).
**Warning signs:** No change in unique ID count despite parameter changes when using `--use-stubs`.

### Pitfall 4: Ghost Filter Removes Ball or Referees
**What goes wrong:** `filter_ghost_tracks` is applied to all track types, removing referee IDs or the ball (ID=1).
**Why it happens:** Generic loop over `tracks.items()` without restricting to `players`.
**How to avoid:** Ghost filter explicitly targets only `tracks["players"]` (D-05).
**Warning signs:** Ball disappears from annotated video; no possession tracking output.

### Pitfall 5: Counting Total Appearances Instead of Consecutive Runs
**What goes wrong:** A player with ID 42 appears in frames 0-7 (8 frames) and then again in frames 200-208 (9 frames) — 17 total appearances but never 10 consecutive. A filter using `sum > 10` would keep this ghost.
**Why it happens:** Mistaking TRACK-01's "fewer than 10 consecutive frames" for "fewer than 10 total frames."
**How to avoid:** Use the consecutive run algorithm shown in Architecture Patterns. Test with a fabricated tracks dict that has a split-appearance player.
**Warning signs:** Unique ID count doesn't drop as much as expected; ghost IDs with split appearances remain in stats JSON.

---

## Code Examples

### Verified: ByteTrack Constructor Signature
```python
# Source: inspect.signature(sv.ByteTrack.__init__) on installed supervision 0.27.0.post2
sv.ByteTrack(
    track_activation_threshold: float = 0.25,
    lost_track_buffer: int = 30,
    minimum_matching_threshold: float = 0.8,
    frame_rate: int = 30,
    minimum_consecutive_frames: int = 1,
)
```

### Verified: How minimum_consecutive_frames Gates Activation
```python
# Source: inspect.getsource(sv.tracker.byte_tracker.single_object_track.STrack)
# In STrack.update():
if self.tracklet_len == self.minimum_consecutive_frames:
    self.is_activated = True
    if self.external_track_id == self.external_id_counter.NO_ID:
        self.external_track_id = self.external_id_counter.new_id()
```

### Verified: update_with_detections Only Emits Activated Tracks
```python
# Source: inspect.getsource(sv.ByteTrack) - update_with_tensors output filter
output_stracks = [track for track in self.tracked_tracks if track.is_activated]
```

### Existing Test Pattern (from tests/test_stats.py)
```python
# Pattern for building synthetic tracks dict for unit testing
def _make_tracks(num_frames=75):
    players = []
    for f in range(num_frames):
        frame = {}
        frame[1] = {'speed': 5.0, 'distance': f * 0.5, 'team': 1}
        players.append(frame)
    return {'players': players, 'ball': [{} for _ in range(num_frames)]}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sv.ByteTrack()` with no params | `sv.ByteTrack(frame_rate=fps, minimum_consecutive_frames=N)` | supervision added `minimum_consecutive_frames` in v0.18+ (issue #1044) | Built-in ghost suppression on initial activation; no custom code needed for that case |
| Manual track ID fragmentation counting | Post-tracking consecutive run filter | N/A — supervision has no built-in post-hoc filter | Custom filter needed; straightforward to implement |

**Deprecated/outdated:**
- `sv.ByteTrack()` with no arguments: still works but misses `frame_rate` scaling and `minimum_consecutive_frames` suppression — both are now standard practice.

---

## Open Questions

1. **Optimal `minimum_consecutive_frames` value for NC State clips**
   - What we know: 3 frames (~0.1s at 30fps) is a reasonable starting point to suppress single-frame artifacts. No published community consensus on sports footage specifically.
   - What's unclear: Whether NC State clips have enough detection noise to warrant 3 vs. 1; only D-02's empirical check will confirm.
   - Recommendation: Start with 3. If the unique ID count check (D-02) passes, ship it. If not, tune to 5 in the single allowed tuning pass.

2. **Whether `minimum_consecutive_frames` interacts with re-activation (re-entry) path**
   - What we know: From STrack source, `re_activate()` does NOT check `minimum_consecutive_frames` — it immediately marks the track active. So re-entry ghosts bypass the gate.
   - What's unclear: How frequently re-entry ghosts occur on NC State clips; this determines how much work the post-tracking filter does vs. how much `minimum_consecutive_frames` handles.
   - Recommendation: Implement both mechanisms as planned; post-tracking filter is the definitive safety net.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies beyond already-installed libraries; supervision 0.27.0.post2 and all other required packages are confirmed installed).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (pytest.ini exists at project root, testpaths = tests) |
| Config file | `C:/Korner flag/pytest.ini` |
| Quick run command | `pytest tests/test_ghost_filter.py -x` |
| Full suite command | `pytest tests/ -x` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | Ghost track IDs (< 10 consecutive frames) absent from players dict after filter | unit | `pytest tests/test_ghost_filter.py -x` | Wave 0 |
| TRACK-01 | Split-appearance track (8 frames + gap + 9 frames) is removed (consecutive, not total) | unit | `pytest tests/test_ghost_filter.py::test_split_appearance_removed -x` | Wave 0 |
| TRACK-01 | Track with exactly 10 consecutive frames is kept | unit | `pytest tests/test_ghost_filter.py::test_boundary_kept -x` | Wave 0 |
| TRACK-01 | Filter does not touch referees or ball | unit | `pytest tests/test_ghost_filter.py::test_players_only -x` | Wave 0 |
| TRACK-02 | ByteTrack constructor uses correct parameters | unit | `pytest tests/test_tracker_init.py -x` | Wave 0 |
| TRACK-02 | Unique player ID count ≤ 35 on NC State clip (90-second segment) | smoke (manual) | run pipeline + count `len(stats['players'])` | manual |

### Sampling Rate
- **Per task commit:** `pytest tests/test_ghost_filter.py -x`
- **Per wave merge:** `pytest tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_ghost_filter.py` — covers TRACK-01 (ghost filter logic, boundary conditions, players-only constraint)
- [ ] `tests/test_tracker_init.py` — covers TRACK-02 (ByteTrack parameter configuration)
- [ ] No framework install needed — pytest already in use

---

## Sources

### Primary (HIGH confidence)
- `inspect.signature(sv.ByteTrack.__init__)` on installed supervision 0.27.0.post2 — parameter names, defaults, types
- `inspect.getsource(sv.tracker.byte_tracker.single_object_track.STrack)` — `minimum_consecutive_frames` activation gate logic, `re_activate()` bypass behavior
- `inspect.getsource(sv.ByteTrack)` — `update_with_tensors` output filter, `is_activated` gating
- `C:/Korner flag/trackers/tracker.py` — current `sv.ByteTrack()` call (line 15), `Tracker.__init__` signature
- `C:/Korner flag/main.py` — pipeline call order, insertion point at line ~72-75
- `C:/Korner flag/speed_and_distnace_estimator/speed_and_distance_estimator.py` — `total_distance[object][track_id]` accumulation pattern
- `C:/Korner flag/tests/test_stats.py` — existing test patterns for tracks dict construction

### Secondary (MEDIUM confidence)
- [supervision Trackers docs](https://supervision.roboflow.com/trackers/) — parameter descriptions (confirmed against installed source)
- [GitHub issue #1044: add minimum_consecutive_frames](https://github.com/roboflow/supervision/issues/1044) — feature origin and intent
- [GitHub issue #1805: lost_track_buffer semantics](https://github.com/roboflow/supervision/issues/1805) — frame_rate normalization confirmed: `max_time_lost = int(frame_rate / 30.0 * lost_track_buffer)`
- [supervision discussion #1001: ByteTrack performance](https://github.com/roboflow/supervision/discussions/1001) — community usage patterns

### Tertiary (LOW confidence)
- No soccer-specific published ByteTrack parameter recommendations were found from official sources. Community examples vary widely. The D-01 starting values (lost_track_buffer=30, minimum_matching_threshold=0.8) align with supervision defaults and are the only community-consistent baseline.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from installed library via inspect
- Architecture patterns: HIGH — ByteTrack source inspected directly; ghost filter algorithm derived from confirmed tracks dict structure
- Pitfalls: HIGH for stubs/frame_rate (code-verified); MEDIUM for re-entry ghost frequency (requires empirical check per D-02)

**Research date:** 2026-03-25
**Valid until:** 2026-06-25 (supervision API is stable; 90-day window before re-verification needed)

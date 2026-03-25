# Phase 7: Tracking Stability - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce ByteTrack ID fragmentation and eliminate ghost tracks from all pipeline outputs (stats JSON, positions.json, annotated video). Players are tracked with stable IDs across the full clip. New capabilities (calibration, event detection, heatmaps) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### ByteTrack parameter tuning
- **D-01:** Use published supervision/broadcast-footage recommended defaults as the starting point (track_buffer=30, match_thresh=0.8 or equivalent). No extended empirical trial runs.
- **D-02:** After applying published values, run once on the NC State clip and check unique ID count against the ≤35 target. If already passing, ship it. If not, do one tuning pass before moving on.

### Ghost filtering
- **D-03:** Filter ghost tracks in a post-tracking pass, immediately after `get_object_tracks()` returns and before any downstream processing (speed/distance, team assignment, stats, positions). Everything downstream receives clean IDs automatically.
- **D-04:** Ghost threshold is **10 consecutive frames** — any track_id that appears in fewer than 10 consecutive frames is removed from the tracks dict.
- **D-05:** Filtering applies to player tracks only (referees are not mentioned in success criteria and have less impact on downstream stats).

### Ghost threshold configurability
- **D-06:** Hardcode the 10-frame threshold as a constant (matches TRACK-01 exactly). No CLI arg — can be promoted later if needed.

### Stub cache handling
- **D-07:** Document the staleness risk in the `--use-stubs` help text: "Delete stubs/ after changing ByteTrack parameters or confidence threshold." No code change required.

### Claude's Discretion
- Exact supervision `ByteTrack()` constructor parameters to set (researcher should verify current supervision API)
- Whether to implement ghost filtering as a standalone `filter_ghost_tracks(tracks, min_frames=10)` utility or a method on the `Tracker` class
- Whether to log a warning when ghost tracks are removed (count + IDs removed)

</decisions>

<specifics>
## Specific Ideas

- Success criteria is concrete: ≤35 unique player track IDs for a 90-second segment on either NC State clip (down from current inflated count)
- Ghost tracks defined as track_ids appearing in fewer than 10 **consecutive** frames (not 10 total frames)
- Speed/distance fragmentation fix is a side effect of ghost filtering — once ghost IDs are removed before the speed estimator runs, accumulation per physical player should be correct automatically

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Tracking Stability — TRACK-01 (ghost filtering spec) and TRACK-02 (ByteTrack tuning spec)
- `.planning/ROADMAP.md` §Phase 7 — Success criteria (≤35 unique IDs, no ghost entries in JSON outputs, correct speed/distance accumulation, team color not corrupted by ghost re-entry frames)

### Existing pipeline code
- `trackers/tracker.py` — ByteTrack initialization (line 15: `sv.ByteTrack()`, no params), `get_object_tracks()` — insertion point for ghost filtering
- `main.py` — Pipeline call order: tracks → add_position → camera_movement → view_transformer → interpolate_ball → speed_distance → team_assigner → export. Ghost filter must go immediately after `get_object_tracks()` (line ~68–72).
- `speed_and_distnace_estimator/speed_and_distance_estimator.py` — Accumulates `total_distance[object][track_id]` per track_id. Ghost IDs must be removed before this runs or fragmentation persists.
- `main.py::generate_stats()` — Iterates all track_ids in player frames. Ghost IDs removed upstream = clean stats automatically.
- `main.py::export_positions()` — Same: ghost IDs removed upstream = clean positions.json automatically.

No external specs or ADRs beyond the requirements and roadmap files listed above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/bbox_utils.py` — Geometry helpers (center, foot position, distance, width). Ghost filtering doesn't need these but they're established patterns for any new utility functions.

### Established Patterns
- Stub caching via pickle in `get_object_tracks()` — ghost filter must run AFTER stub load, not before, so stubs remain useful across reruns.
- `tracks` dict structure: `{"players": [{track_id: {"bbox": [...], ...}}, ...], "referees": [...], "ball": [...]}` — filtering removes track_ids from the dict values entirely.

### Integration Points
- `tracker.get_object_tracks()` return value in `main.py` line ~68 — insert ghost filter call here, before `tracker.add_position_to_track(tracks)` on line ~75.
- The ghost filter receives the full `tracks` dict and returns a cleaned version (or mutates in place — either pattern is fine).

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-tracking-stability*
*Context gathered: 2026-03-25*

# cv-code-review — Pre-PR CV Code Review Skill

## When to Use
Before opening any PR that touches CV code paths (detection, tracking,
homography, analytics, team assignment, speed/distance).

## Checklist

### Coordinate Systems
- [ ] All distance/speed/heatmap calculations use `pitch_xy` (meters), never raw `bbox` pixels
- [ ] No coordinate system mixing — pixel coords stay in drawing functions only
- [ ] Homography output validated against known pitch dimensions (105m × 68m)

### Tensor Shapes & Device
- [ ] No implicit shape assumptions — log shapes on first run if unsure
- [ ] All tensors on the same device (CPU vs GPU consistent)
- [ ] BGR vs RGB correct at each boundary (OpenCV = BGR, YOLO = RGB)

### Frame Indexing
- [ ] No off-by-one errors in frame ranges or sliding windows
- [ ] `frame_idx` in `TrackedObject` matches the actual video frame number
- [ ] Interpolation does not extrapolate beyond clip boundaries

### Tracker Config
- [ ] ByteTrack / BoT-SORT config matches the documented settings
- [ ] `track_id` is stable across occlusions — spot-check on smoke clip
- [ ] Re-ID threshold not too aggressive (causes ID switches) or too loose (merges players)

### Performance
- [ ] No per-frame Python loops where numpy/vectorized ops work
- [ ] Batch inference used for YOLO — not frame-by-frame `.predict()`
- [ ] No unnecessary full-frame copies inside tight loops

### Lane Boundaries
- [ ] Lane B code does not import from `trackers/`, `camera_movement_estimator/`, or `view_transformer/`
- [ ] Lane A code does not perform analytics (speed, possession, team assignment)
- [ ] `TrackedObject` is the only cross-lane data structure

### Contract
- [ ] Any `TrackedObject` field change is documented in `docs/decisions/` and Obsidian

## Output Format
Return a numbered list of issues with `file:line` references and severity:
- **BLOCK** — must fix before merge
- **WARN** — should fix, can merge with justification
- **NIT** — optional cleanup

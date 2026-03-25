---
phase: 7
slug: tracking-stability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (pytest.ini at project root, testpaths = tests) |
| **Config file** | `pytest.ini` |
| **Quick run command** | `pytest tests/test_ghost_filter.py -x` |
| **Full suite command** | `pytest tests/ -x` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_ghost_filter.py -x`
- **After every plan wave:** Run `pytest tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | TRACK-01 | unit | `pytest tests/test_ghost_filter.py -x` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 0 | TRACK-02 | unit | `pytest tests/test_tracker_init.py -x` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 1 | TRACK-02 | unit | `pytest tests/test_tracker_init.py -x` | ❌ W0 | ⬜ pending |
| 7-01-04 | 01 | 1 | TRACK-01 | unit | `pytest tests/test_ghost_filter.py -x` | ❌ W0 | ⬜ pending |
| 7-01-05 | 01 | 2 | TRACK-01 | unit | `pytest tests/test_ghost_filter.py::test_split_appearance_removed -x` | ❌ W0 | ⬜ pending |
| 7-01-06 | 01 | 2 | TRACK-01 | smoke (manual) | `python main.py --input <clip> && python -c "import json; d=json.load(open('...stats.json')); print(len(d['players']))"` | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_ghost_filter.py` — stubs for TRACK-01 (ghost filter logic, boundary conditions, players-only constraint, split-appearance handling)
- [ ] `tests/test_tracker_init.py` — stubs for TRACK-02 (ByteTrack parameter configuration, frame_rate passthrough)

*No framework install needed — pytest already in use.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ≤35 unique player IDs on NC State clip (90s segment) | TRACK-02 / SC-1 | Requires full pipeline run + inspection of stats JSON | Run `python main.py --input <nc_state_clip.mp4>`, then `python -c "import json; d=json.load(open('output_videos/..._stats.json')); print(len(d['players']))"`; count must be ≤35 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

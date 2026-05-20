"""
Cross-lane contract for Korner Flag.

TrackedObject is the shared dataclass between:
  Lane A (detection/tracking/calibration) — produces TrackedObject
  Lane B (analytics) — consumes TrackedObject, never touches CV code
  Lane C (dashboard/pipeline/eval) — consumes TrackedObject for exports

Changing this requires team agreement documented in docs/decisions/
AND in the Obsidian vault under korner-flag/decisions/.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class TrackedObject:
    track_id: int        # stable across occlusions (BoT-SORT ReID)
    class_id: int        # player=0, ball=1, ref=2, goalkeeper=3
    bbox: tuple          # x1, y1, x2, y2 in frame pixels
    pitch_xy: tuple      # x, y in real-world meters (homography output)
    confidence: float
    frame_idx: int
    team_id: int | None  # assigned by Lane B downstream


# class_id constants — use these instead of raw integers
CLASS_PLAYER = 0
CLASS_BALL = 1
CLASS_REF = 2
CLASS_GOALKEEPER = 3

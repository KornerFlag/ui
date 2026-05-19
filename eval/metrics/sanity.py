"""Sanity threshold metrics for a pipeline `tracks` dict.

These are smoke checks, not full evaluation — they catch wonky-speed and
teleport bugs (the #1 source of bad analytics) before they reach the dashboard.
"""

from __future__ import annotations

import math
from collections import defaultdict


MAX_SPEED_KMH_THRESHOLD = 40.0
MAX_TELEPORT_M_THRESHOLD = 15.0


def _positions_per_track(player_frames: list[dict]) -> dict[int, list[tuple[int, tuple[float, float]]]]:
    """Group (frame_idx, position) tuples by track_id, ordered by frame."""
    by_track: dict[int, list[tuple[int, tuple[float, float]]]] = defaultdict(list)
    for frame_idx, frame in enumerate(player_frames):
        for track_id, info in frame.items():
            pos = info.get("position_transformed")
            if pos is None:
                continue
            by_track[track_id].append((frame_idx, (float(pos[0]), float(pos[1]))))
    return by_track


def compute_sanity_metrics(tracks: dict, fps: float = 30.0) -> dict:
    player_frames = tracks.get("players", [])
    by_track = _positions_per_track(player_frames)

    max_speed_kmh = 0.0
    max_teleport_m = 0.0
    num_negative_pitch_xy = 0

    for entries in by_track.values():
        for frame_idx, (x, y) in entries:
            if x < 0 or y < 0:
                num_negative_pitch_xy += 1

        for prev, curr in zip(entries, entries[1:]):
            prev_idx, prev_pos = prev
            curr_idx, curr_pos = curr
            dx = curr_pos[0] - prev_pos[0]
            dy = curr_pos[1] - prev_pos[1]
            distance_m = math.hypot(dx, dy)

            if distance_m > max_teleport_m:
                max_teleport_m = distance_m

            # Skip speed calc if the track was lost for >1 frame — the gap isn't a real velocity.
            frame_gap = curr_idx - prev_idx
            if frame_gap == 1:
                speed_kmh = distance_m * fps * 3.6
                if speed_kmh > max_speed_kmh:
                    max_speed_kmh = speed_kmh

    passes = (
        max_speed_kmh < MAX_SPEED_KMH_THRESHOLD
        and max_teleport_m < MAX_TELEPORT_M_THRESHOLD
        and num_negative_pitch_xy == 0
    )

    return {
        "max_speed_kmh": max_speed_kmh,
        "max_teleport_m": max_teleport_m,
        "num_negative_pitch_xy": num_negative_pitch_xy,
        "frames_evaluated": len(player_frames),
        "tracks_evaluated": len(by_track),
        "passes": passes,
    }

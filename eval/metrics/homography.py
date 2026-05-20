"""Homography reprojection error metric.

Given ground-truth pitch keypoints (pixel coords + known real-world meter coords),
project the pixel coords through the active ViewTransformer and measure the
euclidean error in meters against the known world position.

Ground-truth format (per clip):

    clip_dir/
        keypoints/
            <frame_stem>.json   # {"keypoint_name": [pixel_x, pixel_y], ...}
        keypoints_world.json    # {"keypoint_name": [x_m, y_m], ...}  shared across frames

`keypoints_world.json` is the fixed real-world pitch layout — one file per clip
documents which named landmarks were annotated. Keypoint names without a world
entry are skipped (with a warning) rather than failing the run.

If `keypoints/` is missing, the metric returns status='skipped' instead of
raising — Week 1 ships the harness without keypoint GT, Week 2 fills it in.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import numpy as np


def _load_world_keypoints(clip_dir: Path) -> dict[str, tuple[float, float]] | None:
    world_file = clip_dir / "keypoints_world.json"
    if not world_file.exists():
        return None
    raw = json.loads(world_file.read_text())
    return {name: (float(xy[0]), float(xy[1])) for name, xy in raw.items()}


def _load_frame_keypoints(frame_file: Path) -> dict[str, tuple[float, float]]:
    raw = json.loads(frame_file.read_text())
    return {name: (float(xy[0]), float(xy[1])) for name, xy in raw.items()}


def compute_homography_metrics(
    view_transformer: Any,
    clip_dir: str,
) -> dict:
    clip = Path(clip_dir)
    keypoints_dir = clip / "keypoints"
    world = _load_world_keypoints(clip)

    if not keypoints_dir.is_dir() or world is None:
        return {
            "status": "skipped",
            "reason": "no keypoint ground truth in clip (expected keypoints/ and keypoints_world.json)",
        }

    errors_m: list[float] = []
    per_keypoint_errors: dict[str, list[float]] = {}
    num_frames = 0
    num_keypoints_seen = 0
    num_keypoints_unmapped = 0
    unmapped_names: set[str] = set()

    for frame_file in sorted(keypoints_dir.glob("*.json")):
        frame_kps = _load_frame_keypoints(frame_file)
        if not frame_kps:
            continue
        num_frames += 1

        for name, pixel_xy in frame_kps.items():
            if name not in world:
                num_keypoints_unmapped += 1
                unmapped_names.add(name)
                continue

            num_keypoints_seen += 1
            pixel_arr = np.array([pixel_xy[0], pixel_xy[1]], dtype=np.float32)
            projected = view_transformer.transform_point(pixel_arr)
            proj_x, proj_y = float(projected[0][0]), float(projected[0][1])
            world_x, world_y = world[name]
            err = math.hypot(proj_x - world_x, proj_y - world_y)

            errors_m.append(err)
            per_keypoint_errors.setdefault(name, []).append(err)

    if not errors_m:
        return {
            "status": "skipped",
            "reason": "no usable (frame_keypoint, world_keypoint) pairs found",
            "num_frames": num_frames,
            "num_keypoints_unmapped": num_keypoints_unmapped,
        }

    mean_err = sum(errors_m) / len(errors_m)
    sorted_errs = sorted(errors_m)
    median_err = sorted_errs[len(sorted_errs) // 2]
    max_err = max(errors_m)

    per_kp_mean = {
        name: sum(vals) / len(vals) for name, vals in per_keypoint_errors.items()
    }

    passes = mean_err < 0.5  # plan gate: mean reprojection error < 0.5 m

    return {
        "status": "ok",
        "mean_error_m": mean_err,
        "median_error_m": median_err,
        "max_error_m": max_err,
        "num_frames": num_frames,
        "num_keypoints_evaluated": num_keypoints_seen,
        "num_keypoints_unmapped": num_keypoints_unmapped,
        "unmapped_keypoint_names": sorted(unmapped_names),
        "per_keypoint_mean_error_m": per_kp_mean,
        "passes": passes,
    }

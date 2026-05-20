"""Korner Flag eval harness — entry point.

Usage:
    python -m eval.run_eval --clip <clip_dir> [--model models/best.pt] [--tracks-stub stubs/tracks.pkl]

`clip_dir` must contain `images/` and `labels/` (YOLO format) for detection mAP.
Optional inputs activate further metrics:
  - keypoints/ + keypoints_world.json under clip_dir  → homography reprojection
  - --tracks-stub pointing to a pipeline tracks pickle → sanity thresholds

Tracking metrics (IDF1/MOTA) are stubbed until annotated tracking GT exists.
"""

from __future__ import annotations

import argparse
import json
import pickle
from datetime import datetime, timezone
from pathlib import Path

from eval.metrics.detection import compute_detection_metrics
from eval.metrics.homography import compute_homography_metrics
from eval.metrics.sanity import compute_sanity_metrics


def _load_tracks(stub_path: Path) -> dict | None:
    if not stub_path.exists():
        return None
    with open(stub_path, "rb") as f:
        return pickle.load(f)


def run(
    clip: str,
    model: str,
    conf: float,
    output: str,
    tracks_stub: str | None,
    skip_detection: bool,
    fps: float,
) -> dict:
    clip_dir = Path(clip)
    results: dict = {
        "model": model,
        "clip": str(clip_dir),
        "conf": conf,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "metrics": {},
    }

    if skip_detection:
        results["metrics"]["detection"] = {"status": "skipped"}
    else:
        results["metrics"]["detection"] = compute_detection_metrics(
            model_path=model,
            clip_dir=str(clip_dir),
            conf=conf,
        )

    tracks = _load_tracks(Path(tracks_stub)) if tracks_stub else None

    if tracks is None:
        results["metrics"]["sanity"] = {
            "status": "skipped",
            "reason": "no --tracks-stub provided",
        }
    else:
        results["metrics"]["sanity"] = compute_sanity_metrics(tracks, fps=fps)

    if tracks is None:
        results["metrics"]["homography"] = {
            "status": "skipped",
            "reason": "no tracks provided; ViewTransformer pipeline not run",
        }
    else:
        from view_transformer.view_transformer import ViewTransformer

        view_transformer = ViewTransformer()
        results["metrics"]["homography"] = compute_homography_metrics(
            view_transformer=view_transformer,
            clip_dir=str(clip_dir),
        )

    results["metrics"]["tracking"] = {
        "status": "not_implemented",
        "reason": "IDF1/MOTA pending tracking GT annotation (Week 1 deliverable)",
    }

    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    return results


def _print_summary(results: dict) -> None:
    print(f"clip:  {results['clip']}")
    print(f"model: {results['model']}")
    print(f"conf:  {results['conf']}")
    print("-- metrics --")
    for name, m in results["metrics"].items():
        status = m.get("status", "ok")
        if status == "ok" or status not in ("skipped", "not_implemented"):
            if name == "detection":
                print(
                    f"  detection  map50={m.get('map50', float('nan')):.4f}  "
                    f"map50_95={m.get('map50_95', float('nan')):.4f}  "
                    f"images={m.get('num_images', 0)}"
                )
            elif name == "sanity":
                print(
                    f"  sanity     max_speed={m.get('max_speed_kmh', float('nan')):.1f}km/h  "
                    f"max_teleport={m.get('max_teleport_m', float('nan')):.2f}m  "
                    f"passes={m.get('passes')}"
                )
            elif name == "homography":
                print(
                    f"  homography mean_err={m.get('mean_error_m', float('nan')):.3f}m  "
                    f"max_err={m.get('max_error_m', float('nan')):.3f}m  "
                    f"passes={m.get('passes')}"
                )
            else:
                print(f"  {name}: {m}")
        else:
            reason = m.get("reason", "")
            print(f"  {name}: {status} ({reason})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Korner Flag evaluation harness.")
    parser.add_argument("--clip", required=True, type=str,
                        help="Directory with images/ and labels/ (and optionally keypoints/)")
    parser.add_argument("--model", default="models/best.pt", type=str)
    parser.add_argument("--output", default="eval/results.json", type=str)
    parser.add_argument("--conf", default=0.1, type=float)
    parser.add_argument("--tracks-stub", default=None, type=str,
                        help="Optional pipeline tracks .pkl for sanity + homography metrics")
    parser.add_argument("--skip-detection", action="store_true",
                        help="Skip detection mAP (e.g. when only iterating sanity checks)")
    parser.add_argument("--fps", default=30.0, type=float,
                        help="Clip frame rate for sanity speed calc")
    args = parser.parse_args()

    results = run(
        clip=args.clip,
        model=args.model,
        conf=args.conf,
        output=args.output,
        tracks_stub=args.tracks_stub,
        skip_detection=args.skip_detection,
        fps=args.fps,
    )
    _print_summary(results)
    print(f"\nfull results -> {args.output}")


if __name__ == "__main__":
    main()

"""Detection mAP metric against YOLO-format ground truth.

Computes mAP@0.5, mAP@0.5:0.95, and mAP@0.75 across a clip directory containing
images/ and labels/ subdirectories (Roboflow / Ultralytics standard layout).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import supervision as sv
from supervision.metrics import MeanAveragePrecision, MetricTarget
from ultralytics import YOLO


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")


def _read_yolo_labels(label_path: Path, img_w: int, img_h: int) -> sv.Detections:
    """Parse a YOLO-format label file into pixel-space Detections."""
    if not label_path.exists() or label_path.stat().st_size == 0:
        return sv.Detections.empty()

    xyxy_rows: list[list[float]] = []
    class_ids: list[int] = []
    for line in label_path.read_text().splitlines():
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        cls = int(parts[0])
        cx, cy, bw, bh = (float(v) for v in parts[1:5])
        x1 = (cx - bw / 2) * img_w
        y1 = (cy - bh / 2) * img_h
        x2 = (cx + bw / 2) * img_w
        y2 = (cy + bh / 2) * img_h
        xyxy_rows.append([x1, y1, x2, y2])
        class_ids.append(cls)

    if not xyxy_rows:
        return sv.Detections.empty()

    return sv.Detections(
        xyxy=np.asarray(xyxy_rows, dtype=np.float32),
        class_id=np.asarray(class_ids, dtype=int),
    )


def compute_detection_metrics(
    model_path: str,
    clip_dir: str,
    conf: float = 0.001,
) -> dict:
    # conf is the *eval* confidence floor, not a demo/inference threshold. Keep it
    # near zero so the full precision-recall tail is captured and mAP stays
    # comparable across model versions (matches Ultralytics `val`). On the v1
    # baseline the difference vs conf=0.1 is tiny (+0.0017 map50), but a future
    # model with a different confidence distribution could diverge — pin it.
    clip = Path(clip_dir)
    images_dir = clip / "images"
    labels_dir = clip / "labels"

    if not images_dir.is_dir():
        raise FileNotFoundError(f"images/ not found under {clip}")
    if not labels_dir.is_dir():
        raise FileNotFoundError(f"labels/ not found under {clip}")

    model = YOLO(model_path)
    metric = MeanAveragePrecision(metric_target=MetricTarget.BOXES)

    image_paths = sorted(
        p for p in images_dir.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS
    )

    num_images = 0
    num_predictions = 0
    num_ground_truth = 0
    num_skipped_missing_labels = 0

    for image_path in image_paths:
        label_path = labels_dir / f"{image_path.stem}.txt"
        if not label_path.exists():
            num_skipped_missing_labels += 1
            continue

        result = model.predict(source=str(image_path), conf=conf, verbose=False)[0]
        img_h, img_w = result.orig_shape

        predictions = sv.Detections.from_ultralytics(result)
        ground_truth = _read_yolo_labels(label_path, img_w, img_h)

        metric.update(predictions, ground_truth)

        num_images += 1
        num_predictions += len(predictions)
        num_ground_truth += len(ground_truth)

    if num_images == 0:
        raise RuntimeError(
            f"No image/label pairs evaluated in {clip} "
            f"({num_skipped_missing_labels} images had no matching label file)"
        )

    map_result = metric.compute()

    return {
        "map50": float(map_result.map50),
        "map50_95": float(map_result.map50_95),
        "map75": float(map_result.map75),
        "num_images": num_images,
        "num_predictions": num_predictions,
        "num_ground_truth": num_ground_truth,
        "num_skipped_missing_labels": num_skipped_missing_labels,
    }

"""Train YOLOv8 on the football-players-detection-3zvbc Roboflow dataset.

Produces the initial `models/best.pt` for the Korner Flag pipeline. Designed to
run unmodified in Google Colab (T4/L4 GPU) and locally (with a CUDA GPU).

Colab workflow:

    1. Open https://colab.research.google.com → New notebook.
    2. Runtime → Change runtime type → Hardware accelerator: T4 GPU (free) or L4.
    3. In a cell:

        !git clone https://github.com/KrishNaikGaunekar/Korner-Flags_stats.git
        %cd Korner-Flags_stats
        !pip install -q ultralytics roboflow

    4. In the next cell:

        from google.colab import userdata  # or set inline if you prefer
        import os
        os.environ["ROBOFLOW_API_KEY"] = userdata.get("ROBOFLOW_API_KEY")
        !python training/train_yolov8.py --epochs 50

       (Store the key via the key icon in Colab's left sidebar so it doesn't end up
       in the notebook.)

    5. After 45-90 min, download the best checkpoint:

        from google.colab import files
        files.download("runs/detect/korner-flag-v1/weights/best.pt")

    6. Locally: place the downloaded file at `models/best.pt`.

Local workflow (CUDA GPU required):

    $env:ROBOFLOW_API_KEY = "<your key>"
    python training/train_yolov8.py --epochs 50

If you already have the dataset on disk, pass --data to skip the Roboflow download:

    python training/train_yolov8.py --data training/football-players-detection-1/data.yaml --epochs 50
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def _resolve_data_yaml(args: argparse.Namespace) -> str:
    if args.data:
        if not Path(args.data).exists():
            raise SystemExit(f"--data path does not exist: {args.data}")
        return args.data

    key = args.roboflow_key or os.environ.get("ROBOFLOW_API_KEY")
    if not key:
        raise SystemExit(
            "No --data and no Roboflow API key found. "
            "Either pass --data <path/to/data.yaml> or set ROBOFLOW_API_KEY env var "
            "(or pass --roboflow-key)."
        )

    from roboflow import Roboflow

    rf = Roboflow(api_key=key)
    project = rf.workspace("roboflow-jvuqo").project("football-players-detection-3zvbc")
    version = project.version(1)
    dataset = version.download("yolov8")
    data_yaml = Path(dataset.location) / "data.yaml"
    print(f"Dataset downloaded to {dataset.location}")
    return str(data_yaml)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLOv8 on the soccer dataset.")
    parser.add_argument("--data", default=None,
                        help="Path to data.yaml. If omitted, downloads from Roboflow.")
    parser.add_argument("--roboflow-key", default=None,
                        help="Roboflow API key (or set ROBOFLOW_API_KEY env var).")
    parser.add_argument("--model", default="yolov8m.pt",
                        help="Pretrained backbone (n/s/m/l/x). Default m is the sweet spot.")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--name", default="korner-flag-v1",
                        help="Run name; output lands in runs/detect/<name>/weights/best.pt")
    parser.add_argument("--device", default=None,
                        help="cuda device id or 'cpu'. Default: auto-detect.")
    parser.add_argument("--patience", type=int, default=20,
                        help="Early-stopping patience in epochs.")
    args = parser.parse_args()

    data_yaml = _resolve_data_yaml(args)

    from ultralytics import YOLO

    model = YOLO(args.model)

    train_kwargs = dict(
        data=data_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        name=args.name,
        patience=args.patience,
        plots=True,
        seed=42,
    )
    if args.device is not None:
        train_kwargs["device"] = args.device

    results = model.train(**train_kwargs)

    weights_dir = Path(results.save_dir) / "weights"
    print()
    print(f"Training complete. Best weights: {weights_dir / 'best.pt'}")
    print(f"Last weights: {weights_dir / 'last.pt'}")
    print()
    print("Next step: copy best.pt to models/best.pt in the repo, then run:")
    print("    python -m eval.run_eval --clip training/football-players-detection-1/football-players-detection-1/test")


if __name__ == "__main__":
    main()

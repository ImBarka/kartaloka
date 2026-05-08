"""
Train YOLOv8-OBB on the Directional Arrows dataset.

Usage:
    python ml/scripts/train.py [--epochs N] [--batch N] [--imgsz N] [--device cuda|cpu]

Outputs:
    ml/runs/train/<name>/weights/best.pt   — best checkpoint
    ml/runs/train/<name>/weights/last.pt   — final checkpoint
"""

import argparse
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[2]
DATA_YAML = ROOT / "data.yaml"
RUNS_DIR = ROOT / "ml" / "runs"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="yolov8n-obb.pt",
                   help="Base model (yolov8n/s/m/l/x-obb.pt)")
    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--device", default="0",
                   help="cuda device index or 'cpu'")
    p.add_argument("--name", default="kartaloka-obb",
                   help="Run name under ml/runs/train/")
    p.add_argument("--patience", type=int, default=30,
                   help="Early-stopping patience (epochs)")
    return p.parse_args()


def main():
    args = parse_args()

    if not DATA_YAML.exists():
        raise FileNotFoundError(
            f"{DATA_YAML} not found. Run ml/scripts/prepare_dataset.py first."
        )

    model = YOLO(args.model)

    results = model.train(
        data=str(DATA_YAML),
        task="obb",
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        project=str(RUNS_DIR / "train"),
        name=args.name,
        exist_ok=True,
        patience=args.patience,
        # Augmentation (already augmented in dataset — keep light)
        degrees=8,
        translate=0.1,
        scale=0.3,
        fliplr=0.5,
        mosaic=0.5,
        # Logging
        plots=True,
        save=True,
        save_period=10,
        verbose=True,
    )

    best = Path(results.save_dir) / "weights" / "best.pt"
    print(f"\n[train] Best checkpoint: {best}")
    print(f"[train] mAP50: {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")


if __name__ == "__main__":
    main()

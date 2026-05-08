"""
Evaluate a trained model on the test split.

Usage:
    python ml/scripts/evaluate.py [--weights path/to/best.pt]
"""

import argparse
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = ROOT / "ml" / "runs" / "train" / "kartaloka-obb" / "weights" / "best.pt"
DATA_YAML = ROOT / "data.yaml"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--weights", default=str(DEFAULT_WEIGHTS))
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--device", default="0")
    return p.parse_args()


def main():
    args = parse_args()
    weights = Path(args.weights)
    if not weights.exists():
        raise FileNotFoundError(f"Weights not found: {weights}")

    model = YOLO(str(weights))
    metrics = model.val(
        data=str(DATA_YAML),
        split="test",
        imgsz=args.imgsz,
        device=args.device,
        plots=True,
        save_json=True,
        project=str(ROOT / "ml" / "runs" / "eval"),
        name="kartaloka-test",
        exist_ok=True,
        verbose=True,
    )

    print("\n=== Test Results ===")
    print(f"mAP50:      {metrics.box.map50:.4f}")
    print(f"mAP50-95:   {metrics.box.map:.4f}")
    print(f"Precision:  {metrics.box.mp:.4f}")
    print(f"Recall:     {metrics.box.mr:.4f}")


if __name__ == "__main__":
    main()

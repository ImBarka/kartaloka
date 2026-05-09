"""
Export trained best.pt → ONNX for deployment.

Usage:
    python ml/scripts/export.py [--weights path/to/best.pt] [--imgsz 640]

Output:
    ml/runs/export/best.onnx
"""

import argparse
import shutil
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEIGHTS = ROOT / "ml" / "runs" / "train" / "kartaloka-obb" / "weights" / "best.pt"
EXPORT_DIR = ROOT / "ml" / "runs" / "export"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--weights", default=str(DEFAULT_WEIGHTS))
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--half", action="store_true",
                   help="FP16 export (faster inference, requires GPU at runtime)")
    return p.parse_args()


def main():
    args = parse_args()
    weights = Path(args.weights)
    if not weights.exists():
        raise FileNotFoundError(
            f"Weights not found: {weights}\n"
            "Run ml/scripts/train.py first."
        )

    model = YOLO(str(weights))
    model.export(
        format="onnx",
        imgsz=args.imgsz,
        half=args.half,
        dynamic=False,       # static shapes — simpler for web API
        simplify=True,       # onnx-simplifier pass
        opset=17,
    )

    # Move .onnx next to weights → ml/runs/export/
    onnx_src = weights.with_suffix(".onnx")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    onnx_dst = EXPORT_DIR / "best.onnx"
    shutil.copy2(onnx_src, onnx_dst)
    print(f"[export] ONNX saved to: {onnx_dst}")


if __name__ == "__main__":
    main()

"""
Kartaloka CV inference API — FastAPI server.

Accepts an image (multipart or base64 JSON), runs YOLOv8-OBB inference,
and returns detected arrow cards sorted left-to-right, ready for the
algorithm panel on the website.

Start:
    cd ml
    uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload

Test:
    curl -F "file=@/path/to/image.jpg" http://localhost:8000/detect
"""

import base64
import io
from pathlib import Path
from typing import List

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from ultralytics import YOLO

# ── Model loading ────────────────────────────────────────────────
import os

ROOT = Path(__file__).resolve().parents[2]
# MODEL_PATH env var dipakai saat deploy via Docker / cloud
DEFAULT_WEIGHTS = Path(
    os.environ.get("MODEL_PATH") or
    ROOT / "ml" / "runs" / "export" / "best.onnx"
)

_model: YOLO | None = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        weights = DEFAULT_WEIGHTS
        if not weights.exists():
            raise RuntimeError(
                f"Model weights not found at {weights}. "
                "Train the model first: python ml/scripts/train.py"
            )
        _model = YOLO(str(weights), task="obb")
    return _model


# ── Map class index → Kartaloka direction ───────────────────────
# Dataset classes: 0=down, 1=left, 2=right, 3=up
# Kartaloka directions: class -> arah mata angin
# 0=down->Selatan, 1=left->Barat, 2=right->Timur, 3=up->Utara
CLASS_TO_DIR = {
    0: {"dir": "back",    "label": "SELATAN"},
    1: {"dir": "left",    "label": "BARAT"},
    2: {"dir": "right",   "label": "TIMUR"},
    3: {"dir": "forward", "label": "UTARA"},
}


# ── Pydantic schemas ─────────────────────────────────────────────
class DetectedCard(BaseModel):
    index: int          # left-to-right order (1-based)
    dir: str            # forward | back | left | right
    label: str          # UTARA | SELATAN | BARAT | TIMUR
    conf: float         # 0–1 confidence
    cx: float           # centre-x in image (0–1 normalised)
    cy: float           # centre-y in image (0–1 normalised)


class DetectResponse(BaseModel):
    count: int
    cards: List[DetectedCard]


class Base64Request(BaseModel):
    image: str          # base64-encoded image (with or without data-URI prefix)


# ── App ──────────────────────────────────────────────────────────
app = FastAPI(title="Kartaloka CV API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_inference(image: Image.Image, conf_threshold: float = 0.4) -> DetectResponse:
    model = get_model()
    results = model.predict(
        source=np.array(image.convert("RGB")),
        conf=conf_threshold,
        verbose=False,
    )

    cards: List[DetectedCard] = []
    result = results[0]
    h, w = result.orig_shape

    if result.obb is not None and len(result.obb) > 0:
        boxes = result.obb.xywhr.cpu().numpy()     # (N, 5): cx,cy,w,h,rotation
        confs = result.obb.conf.cpu().numpy()
        classes = result.obb.cls.cpu().numpy().astype(int)

        for cx_px, cy_px, _bw, _bh, _rot, conf, cls in zip(
            boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3], boxes[:, 4],
            confs, classes
        ):
            mapping = CLASS_TO_DIR.get(cls)
            if mapping is None:
                continue
            cards.append(DetectedCard(
                index=0,            # filled after sorting
                dir=mapping["dir"],
                label=mapping["label"],
                conf=float(conf),
                cx=float(cx_px / w),
                cy=float(cy_px / h),
            ))

    # Sort left-to-right by normalised cx
    cards.sort(key=lambda c: c.cx)
    for i, card in enumerate(cards, start=1):
        card.index = i

    return DetectResponse(count=len(cards), cards=cards)


# ── Routes ───────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/detect", response_model=DetectResponse)
async def detect_file(
    file: UploadFile = File(...),
    conf: float = 0.4,
):
    """Accept a multipart image upload and return detected cards."""
    data = await file.read()
    try:
        image = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot decode image.")
    return _run_inference(image, conf_threshold=conf)


@app.post("/detect/base64", response_model=DetectResponse)
def detect_base64(
    payload: Base64Request,
    conf: float = 0.4,
):
    """Accept a base64-encoded image (from browser webcam canvas) and return detected cards."""
    raw = payload.image
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        image = Image.open(io.BytesIO(base64.b64decode(raw)))
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot decode base64 image.")
    return _run_inference(image, conf_threshold=conf)


@app.get("/")
def root():
    return {
        "name": "Kartaloka CV API",
        "endpoints": {
            "POST /detect":         "Upload image file → detected cards",
            "POST /detect/base64":  "Base64 image → detected cards",
            "GET  /health":         "Health check",
        },
    }

"""
Kumpulkan foto kartu fisik dari webcam untuk dataset training.

Cara pakai:
    python ml/scripts/collect_data.py --class up
    python ml/scripts/collect_data.py --class down
    python ml/scripts/collect_data.py --class left
    python ml/scripts/collect_data.py --class right

Kontrol:
    SPACE  — ambil foto
    A      — auto-capture setiap 1.5 detik (toggle)
    Q/ESC  — selesai

Nama kelas sesuai dataset asli:
    up    = Utara
    down  = Selatan
    right = Timur
    left  = Barat
"""

import cv2
import argparse
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLASSES = ["up", "down", "left", "right"]
CLASS_LABEL = {"up": "UTARA", "down": "SELATAN", "left": "BARAT", "right": "TIMUR"}


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--class", dest="cls", choices=CLASSES, required=True,
                   help="Kelas kartu: up/down/left/right")
    p.add_argument("--cam", type=int, default=0, help="Index kamera (default: 0)")
    p.add_argument("--out", type=str, default=None,
                   help="Folder output (default: raw_data/<class>/)")
    return p.parse_args()


def main():
    args = parse_args()
    out_dir = Path(args.out) if args.out else ROOT / "raw_data" / args.cls
    out_dir.mkdir(parents=True, exist_ok=True)

    # Hitung foto yang sudah ada
    existing = list(out_dir.glob("*.jpg"))
    count = len(existing)

    label = CLASS_LABEL[args.cls]
    print(f"\n=== Kumpul data: {args.cls} ({label}) ===")
    print(f"Output: {out_dir}")
    print(f"Sudah ada: {count} foto")
    print(f"\nKontrol: SPACE=ambil foto  A=auto-capture  Q/ESC=selesai\n")

    cap = cv2.VideoCapture(args.cam, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("ERROR: Kamera tidak bisa dibuka.")
        return

    auto_mode = False
    last_auto = 0
    AUTO_INTERVAL = 1.5  # detik

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        display = frame.copy()
        h, w = display.shape[:2]

        # Overlay info
        cv2.rectangle(display, (0, 0), (w, 50), (0, 0, 0), -1)
        cv2.putText(display, f"Kelas: {args.cls} ({label})  |  Foto: {count}",
                    (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if auto_mode:
            cv2.rectangle(display, (0, h-40), (w, h), (0, 180, 0), -1)
            cv2.putText(display, "AUTO ON — tahan kartu diam",
                        (10, h-12), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Panduan frame tengah
        cx, cy = w // 2, h // 2
        bw, bh = int(w * 0.4), int(h * 0.6)
        cv2.rectangle(display,
                      (cx - bw//2, cy - bh//2),
                      (cx + bw//2, cy + bh//2),
                      (0, 255, 0), 2)
        cv2.putText(display, "Letakkan kartu di sini",
                    (cx - bw//2, cy - bh//2 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 1)

        cv2.imshow(f"Kartaloka — Kumpul Data [{label}]", display)

        # Auto capture
        if auto_mode and (time.time() - last_auto) >= AUTO_INTERVAL:
            fname = out_dir / f"{args.cls}_{int(time.time()*1000)}.jpg"
            cv2.imwrite(str(fname), frame)
            count += 1
            last_auto = time.time()
            print(f"  [{count}] {fname.name}")

        key = cv2.waitKey(30) & 0xFF

        if key == ord(' '):  # SPACE — ambil foto
            fname = out_dir / f"{args.cls}_{int(time.time()*1000)}.jpg"
            cv2.imwrite(str(fname), frame)
            count += 1
            print(f"  [{count}] {fname.name}")
            # Flash effect
            flash = frame.copy()
            flash[:] = (255, 255, 255)
            cv2.addWeighted(frame, 0.3, flash, 0.7, 0, display)
            cv2.imshow(f"Kartaloka — Kumpul Data [{label}]", display)
            cv2.waitKey(80)

        elif key == ord('a'):  # A — toggle auto
            auto_mode = not auto_mode
            last_auto = time.time()
            print(f"  Auto-capture: {'ON' if auto_mode else 'OFF'}")

        elif key in (ord('q'), 27):  # Q / ESC — keluar
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nSelesai. Total {count} foto disimpan di: {out_dir}")


if __name__ == "__main__":
    main()

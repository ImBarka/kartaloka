"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowGlyph, InstructionCard, BatikOrnament, CameraIcon } from "./shared";

// ── CV API helpers ────────────────────────────────────────────
async function detectFromCanvas(canvas: HTMLCanvasElement, conf = 0.4): Promise<DetectedCard[]> {
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.9)
  );
  const fd = new FormData();
  fd.append("file", blob, "frame.jpg");
  fd.append("conf", String(conf));

  let res: Response;
  try {
    res = await fetch("/api/detect", { method: "POST", body: fd });
  } catch {
    throw new Error("API_OFFLINE");
  }

  if (res.status === 503) throw new Error("API_OFFLINE");
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error("API_OFFLINE");

  return (data.cards ?? []).map((c: { dir: Dir; label: string; conf: number }) => ({
    dir: c.dir as Dir,
    label: c.label,
    conf: c.conf,
  }));
}

const DESK_W = 580;
const DESK_H = 320;

type Dir = "forward" | "right" | "back" | "left";

interface Tile {
  id: string;
  dir: Dir;
  label: string;
  x: number;
  y: number;
  rot: number;
}

interface DetectedCard {
  dir: Dir;
  label: string;
  conf: number;
}

interface DetectionBox {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  conf: number;
}

const ARROW_KINDS = [
  { id: "utara",   dir: "forward" as Dir, label: "UTARA" },
  { id: "timur",   dir: "right"   as Dir, label: "TIMUR" },
  { id: "barat",   dir: "left"    as Dir, label: "BARAT" },
  { id: "selatan", dir: "back"    as Dir, label: "SELATAN" },
];

function seedTiles(): Tile[] {
  return [
    { id: "t1", dir: "right",   label: "TIMUR",   x: 60,  y: 220, rot: -4 },
    { id: "t2", dir: "right",   label: "TIMUR",   x: 150, y: 215, rot: 2  },
    { id: "t3", dir: "back",    label: "SELATAN",  x: 240, y: 220, rot: -2 },
    { id: "t4", dir: "back",    label: "SELATAN",  x: 340, y: 215, rot: 5  },
    { id: "t5", dir: "right",   label: "TIMUR",   x: 440, y: 220, rot: -3 },
  ];
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink-soft)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.1em",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

export default function CameraPanel() {
  const [tiles, setTiles] = useState<Tile[]>(seedTiles);
  const [mode, setMode] = useState<"simulated" | "live">("simulated");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detected, setDetected] = useState<DetectedCard[]>([]);
  const [boxes, setBoxes] = useState<DetectionBox[]>([]);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [apiErr, setApiErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    deskRect: DOMRect;
  } | null>(null);

  // Live camera
  useEffect(() => {
    if (mode !== "live") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStreamErr("Browser tidak mendukung kamera.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStreamErr(null);
      })
      .catch(() => {
        setStreamErr("Kamera ditolak atau tidak tersedia. Gunakan mode Simulasi.");
        setMode("simulated");
      });
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  const onTileMouseDown = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      const tile = tiles.find((t) => t.id === id);
      if (!tile) return;
      const desk = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
      const offsetX = e.clientX - desk.left - tile.x;
      const offsetY = e.clientY - desk.top - tile.y;
      dragRef.current = { id, offsetX, offsetY, deskRect: desk };

      const onMove = (ev: MouseEvent) => {
        const r = dragRef.current!.deskRect;
        const nx = Math.max(0, Math.min(DESK_W - 70, ev.clientX - r.left - dragRef.current!.offsetX));
        const ny = Math.max(0, Math.min(DESK_H - 90, ev.clientY - r.top - dragRef.current!.offsetY));
        setTiles((ts) => ts.map((t) => (t.id === id ? { ...t, x: nx, y: ny } : t)));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        dragRef.current = null;
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [tiles]
  );

  const rotateTile = (id: string) => {
    const order: Dir[] = ["forward", "right", "back", "left"];
    const labels: Record<Dir, string> = {
      forward: "UTARA",
      right: "TIMUR",
      back: "SELATAN",
      left: "BARAT",
    };
    setTiles((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const next = order[(order.indexOf(t.dir) + 1) % 4];
        return { ...t, dir: next, label: labels[next] };
      })
    );
  };

  const addTile = (kind: (typeof ARROW_KINDS)[number]) => {
    const id = "t" + Math.random().toString(36).slice(2, 7);
    setTiles((ts) => [
      ...ts,
      {
        id,
        dir: kind.dir,
        label: kind.label,
        x: 30 + Math.random() * (DESK_W - 130),
        y: 30 + Math.random() * 100,
        rot: (Math.random() - 0.5) * 10,
      },
    ]);
  };

  const removeTile = (id: string) => setTiles((ts) => ts.filter((t) => t.id !== id));
  const resetDesk = () => {
    setTiles(seedTiles());
    setDetected([]);
    setBoxes([]);
  };

  const scanSimulated = () => {
    const sorted = [...tiles].sort((a, b) => a.x - b.x);
    let i = 0;
    const tick = () => {
      if (i >= sorted.length) {
        setTimeout(() => {
          setScanning(false);
          setDetected(
            sorted.map((t) => ({
              dir: t.dir,
              label: t.label,
              conf: 0.92 + Math.random() * 0.07,
            }))
          );
        }, 350);
        return;
      }
      const t = sorted[i];
      setBoxes((prev) => [
        ...prev,
        { id: t.id, x: t.x, y: t.y, dir: t.dir, conf: 0.92 + Math.random() * 0.07 },
      ]);
      setScanProgress(((i + 1) / sorted.length) * 100);
      i++;
      setTimeout(tick, 320);
    };
    setTimeout(tick, 400);
  };

  const scanLive = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setApiErr("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
      setScanning(false);
      return;
    }

    setApiErr(null);

    // Ambil 5 frame selama ~2.5 detik, pilih hasil dengan confidence tertinggi per posisi
    const FRAMES = 3;
    const INTERVAL_MS = 400;
    const allResults: DetectedCard[][] = [];

    try {
      for (let i = 0; i < FRAMES; i++) {
        setScanProgress(Math.round(((i + 1) / FRAMES) * 90));
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
        try {
          const cards = await detectFromCanvas(canvas, 0.4);
          if (cards.length > 0) allResults.push(cards);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg === "API_OFFLINE") throw new Error("API_OFFLINE");
        }
        if (i < FRAMES - 1) await new Promise((r) => setTimeout(r, INTERVAL_MS));
      }

      setScanProgress(100);

      if (allResults.length === 0) {
        setApiErr("Tidak ada kartu terdeteksi. Pastikan kartu terlihat jelas di kamera dan pencahayaan cukup.");
        setDetected([]);
        return;
      }

      // Pilih frame dengan jumlah kartu terbanyak, lalu confidence tertinggi
      allResults.sort((a, b) => b.length - a.length || b[0].conf - a[0].conf);
      const best = allResults[0];

      // Dedup: hapus deteksi yang arah dan confidence-nya sangat mirip (kartu sama terdeteksi 2x)
      const deduped: DetectedCard[] = [];
      for (const card of best) {
        const dup = deduped.find(
          (d) => d.dir === card.dir && Math.abs(d.conf - card.conf) < 0.1
        );
        if (!dup) deduped.push(card);
      }
      setDetected(deduped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setApiErr(
        msg === "API_OFFLINE"
          ? "Server CV tidak berjalan. Jalankan: uvicorn ml.api.server:app --port 8001"
          : "Deteksi gagal. Coba lagi."
      );
      setDetected([]);
    } finally {
      setScanProgress(100);
      setScanning(false);
    }
  };

  const scan = () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    setDetected([]);
    setBoxes([]);
    setApiErr(null);

    if (mode === "live") {
      scanLive();
    } else {
      scanSimulated();
    }
  };

  const sendToAlgorithm = () => {
    if (!detected.length) return;
    if ((window as unknown as Record<string, unknown>).__kartalokaApplySequence) {
      (window as unknown as { __kartalokaApplySequence: (cards: { dir: Dir; label: string }[]) => void }).__kartalokaApplySequence(
        detected.map((d) => ({ dir: d.dir, label: d.label }))
      );
    }
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="kamera" style={{ background: "var(--bg-2)", position: "relative" }}>
      <BatikOrnament
        style={{ position: "absolute", top: 40, right: -80, width: 320, opacity: 0.05 }}
      />

      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 28, height: 1, background: "var(--sogan)" }} />
          <span className="eyebrow">Modul 2 · Computer Vision</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.3fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Left: copy */}
          <div>
            <h2
              style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                lineHeight: 1,
                fontWeight: 500,
              }}
            >
              Susun di meja,{" "}
              <em style={{ color: "var(--sogan)", fontStyle: "italic" }}>kamera membaca.</em>
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "var(--ink-soft)",
                lineHeight: 1.55,
                marginTop: 18,
                maxWidth: 460,
              }}
            >
              Inilah inti Kartaloka. Pelajar menyusun kartu instruksi <strong>fisik</strong> di
              atas meja. Kamera memindai, model deteksi mengenali setiap kartu beserta arahnya,
              dan urutan dikirim ke algoritma — semua otomatis.
            </p>

            {/* Mode toggle */}
            <div style={{ marginTop: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Mode Kamera
              </div>
              <div
                style={{
                  display: "inline-flex",
                  padding: 4,
                  borderRadius: 999,
                  background: "rgba(26,20,16,0.06)",
                  border: "1px solid var(--line-soft)",
                }}
              >
                <ModeBtn active={mode === "simulated"} onClick={() => setMode("simulated")}>
                  ⌗ Simulasi Meja
                </ModeBtn>
                <ModeBtn active={mode === "live"} onClick={() => setMode("live")}>
                  ◉ Kamera Langsung
                </ModeBtn>
              </div>
              {streamErr && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    background: "rgba(184,92,56,0.1)",
                    color: "var(--sogan-2)",
                    borderRadius: 6,
                    border: "1px solid rgba(184,92,56,0.3)",
                  }}
                >
                  {streamErr}
                </div>
              )}
            </div>

            {/* Add tiles */}
            {mode === "simulated" && (
              <div style={{ marginTop: 24 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Tambah Kartu Fisik
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ARROW_KINDS.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => addTile(k)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "1.5px solid var(--line)",
                        background: "var(--paper)",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ArrowGlyph dir={k.dir} size={14} /> + {k.label}
                    </button>
                  ))}
                  <button
                    onClick={resetDesk}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1.5px dashed var(--line-soft)",
                      background: "transparent",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "var(--ink-mute)",
                    }}
                  >
                    ↺ Reset Meja
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: "var(--paper)",
                borderRadius: 12,
                border: "1px solid var(--line-soft)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    color: "var(--sogan)",
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                  }}
                >
                  HOW IT WORKS
                </span>
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                  lineHeight: 1.7,
                }}
              >
                <li>Pelajar menyusun kartu fisik dari kiri ke kanan.</li>
                <li>
                  Tekan <strong>Pindai</strong> — model CV menemukan dan mengenali tiap kartu.
                </li>
                <li>Urutan dikirim ke algoritma. Bidak bergerak di peta.</li>
              </ol>
            </div>
          </div>

          {/* Right: viewfinder */}
          <div className="paper-card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: scanning ? "var(--sogan)" : "#1f8a5b",
                    animation: scanning ? "floaty 0.6s infinite" : "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    color: "var(--ink-soft)",
                    fontWeight: 600,
                  }}
                >
                  KAMERA · {mode === "live" ? "LIVE FEED" : "SIMULASI MEJA"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--ink-mute)",
                }}
              >
                {tiles.length} objek terdeteksi
              </span>
            </div>

            {/* Viewfinder */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${DESK_W} / ${DESK_H}`,
                borderRadius: 12,
                overflow: "hidden",
                background: "#1a1410",
                border: "2px solid var(--line)",
              }}
            >
              {mode === "live" && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}

              {mode === "simulated" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(ellipse at 30% 30%, #d4a574 0%, #a87844 60%, #6b4a26 100%)",
                    backgroundImage: `
                      radial-gradient(ellipse at 30% 30%, rgba(255,235,200,0.4) 0%, transparent 50%),
                      repeating-linear-gradient(95deg, #8a5e30 0px, #6b4a26 2px, #8a5e30 8px)
                    `,
                  }}
                >
                  <svg
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", inset: 0, opacity: 0.3 }}
                  >
                    <defs>
                      <pattern id="wood" width="200" height="40" patternUnits="userSpaceOnUse">
                        <path
                          d="M0 5 Q 50 10, 100 5 T 200 5"
                          fill="none"
                          stroke="#3a2510"
                          strokeWidth="0.5"
                        />
                        <path
                          d="M0 25 Q 60 30, 120 25 T 200 25"
                          fill="none"
                          stroke="#3a2510"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#wood)" />
                  </svg>

                  {tiles.map((t) => (
                    <div
                      key={t.id}
                      onMouseDown={onTileMouseDown(t.id)}
                      onClick={(e) => {
                        if (e.detail === 2) rotateTile(t.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        removeTile(t.id);
                      }}
                      style={{
                        position: "absolute",
                        left: `${(t.x / DESK_W) * 100}%`,
                        top: `${(t.y / DESK_H) * 100}%`,
                        width: `${(70 / DESK_W) * 100}%`,
                        height: `${(90 / DESK_H) * 100}%`,
                        transform: `rotate(${t.rot}deg)`,
                        background: "var(--paper)",
                        border: "1.5px solid var(--line)",
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      title="Seret untuk pindah · Klik dua kali untuk putar · Klik kanan untuk hapus"
                    >
                      <ArrowGlyph dir={t.dir} size={26} />
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 8,
                          letterSpacing: "0.08em",
                          color: "var(--ink-soft)",
                          fontWeight: 700,
                        }}
                      >
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Scan overlay */}
              {scanning && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(to right, transparent, #0fff80, transparent)",
                      boxShadow: "0 0 12px #0fff80",
                      top: `${scanProgress}%`,
                      transition: "top .3s ease",
                    }}
                  />
                  {[
                    { top: 8, left: 8 },
                    { top: 8, right: 8 },
                    { bottom: 8, left: 8 },
                    { bottom: 8, right: 8 },
                  ].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 22,
                        height: 22,
                        borderColor: "#0fff80",
                        borderTop: i < 2 ? "2px solid" : "none",
                        borderBottom: i >= 2 ? "2px solid" : "none",
                        borderLeft: i % 2 === 0 ? "2px solid" : "none",
                        borderRight: i % 2 === 1 ? "2px solid" : "none",
                        ...p,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Detection boxes */}
              {boxes.map((b, i) => (
                <div
                  key={b.id}
                  style={{
                    position: "absolute",
                    left: `${(b.x / DESK_W) * 100}%`,
                    top: `${(b.y / DESK_H) * 100}%`,
                    width: `${(70 / DESK_W) * 100}%`,
                    height: `${(90 / DESK_H) * 100}%`,
                    border: "2px solid #0fff80",
                    boxShadow: "0 0 8px rgba(15,255,128,0.6)",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -22,
                      left: -2,
                      background: "#0fff80",
                      color: "#0a0a0a",
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 3,
                      letterSpacing: "0.1em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    #{i + 1} {b.dir.toUpperCase()} · {(b.conf * 100).toFixed(0)}%
                  </div>
                </div>
              ))}

              {/* HUD */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: "#0fff80",
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  background: "rgba(0,0,0,0.4)",
                  padding: "3px 6px",
                  borderRadius: 3,
                }}
              >
                ◉ REC · MODEL: kartaloka-yolo-v2
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: "#0fff80",
                  background: "rgba(0,0,0,0.4)",
                  padding: "3px 6px",
                  borderRadius: 3,
                }}
              >
                {scanning ? `SCANNING ${scanProgress.toFixed(0)}%` : "STANDBY"}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: "#0fff80",
                  background: "rgba(0,0,0,0.4)",
                  padding: "3px 6px",
                  borderRadius: 3,
                }}
              >
                640×480 · 30fps
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                {mode === "simulated" &&
                  "Seret kartu · Klik dua kali untuk putar · Klik kanan untuk hapus"}
                {mode === "live" && "Arahkan kamera ke susunan kartu fisikmu"}
              </div>
              <button
                onClick={scan}
                disabled={scanning || tiles.length === 0}
                className="btn btn--sogan"
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  opacity: scanning || tiles.length === 0 ? 0.5 : 1,
                }}
              >
                <CameraIcon /> {scanning ? "Memindai..." : "Pindai Sekarang"}
              </button>
            </div>

            {/* API error banner */}
            {apiErr && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(184,92,56,0.1)",
                  border: "1px solid rgba(184,92,56,0.35)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--sogan-2)",
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.05em",
                  lineHeight: 1.6,
                }}
              >
                ✕ {apiErr}
              </div>
            )}

            {/* Detected */}
            {detected.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "rgba(31,138,91,0.08)",
                  border: "1px solid rgba(31,138,91,0.3)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "#1f8a5b",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                    }}
                  >
                    ✓ TERDETEKSI · {detected.length} KARTU
                  </span>
                  <button
                    onClick={sendToAlgorithm}
                    className="btn btn--sogan"
                    style={{ padding: "8px 14px", fontSize: 12 }}
                  >
                    Kirim ke Algoritma →
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {detected.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 10px",
                        background: "var(--paper)",
                        border: "1px solid var(--line-soft)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "var(--sogan)",
                          color: "var(--paper)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                      <ArrowGlyph dir={d.dir} size={16} />
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {d.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--ink-mute)",
                        }}
                      >
                        {(d.conf * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Hidden canvas — used to capture a frame from the live webcam */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </section>
  );
}

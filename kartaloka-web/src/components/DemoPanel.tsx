"use client";

import { useState, useEffect, useRef } from "react";
import { InstructionCard, Pawn } from "./shared";

type Dir = "forward" | "right" | "back" | "left";
type Facing = "N" | "E" | "S" | "W";

// Arah kompas untuk label display
const FACING_LABEL: Record<Facing, string> = { N: "Utara", E: "Timur", S: "Selatan", W: "Barat" };

interface CardType {
  id: string;
  dir: Dir;
  label: string;
  desc: string;
}

interface SequenceCard extends CardType {
  uid: string;
}

interface PawnState {
  x: number;
  y: number;
  facing: Facing;
}

interface Point {
  x: number;
  y: number;
}

const CARD_TYPES: CardType[] = [
  { id: "utara", dir: "forward", label: "UTARA", desc: "Gerak ke Utara 100m" },
  { id: "timur", dir: "right", label: "TIMUR", desc: "Gerak ke Timur 100m" },
  { id: "barat", dir: "left", label: "BARAT", desc: "Gerak ke Barat 100m" },
  { id: "selatan", dir: "back", label: "SELATAN", desc: "Gerak ke Selatan 100m" },
];

const GRID_COLS = 9;
const GRID_ROWS = 7;
// Tugu (barat laut), Keraton (timur, agak selatan) — rute berliku: T2, S2, T2
// Tugu = kiri atas (utara), Keraton = kanan bawah (selatan) — sesuai peta Yogyakarta
const START: PawnState = { x: 1, y: 1, facing: "S" };
const KERATON: Point = { x: 6, y: 5 };

const LANDMARKS: Array<{ x: number; y: number; kind: string; name: string }> = [
  { x: 1, y: 1, kind: "tugu",       name: "Tugu" },
  { x: 3, y: 2, kind: "malioboro",  name: "Malioboro" },
  { x: 5, y: 4, kind: "beringharjo", name: "Beringharjo" },
  { x: 6, y: 5, kind: "keraton",    name: "Keraton" },
];

const OBSTACLES: Array<{ x: number; y: number; name: string }> = [
  { x: 1, y: 3, name: "Becak" },
  { x: 4, y: 5, name: "Andong" },
];

// Setiap kartu menggerakkan pawn satu kotak ke arah absolut (mata angin)
// forward=Utara(dy-1), back=Selatan(dy+1), right=Timur(dx+1), left=Barat(dx-1)
const DIR_DELTA: Record<Dir, { dx: number; dy: number; facing: Facing }> = {
  forward: { dx: 0,  dy: -1, facing: "N" },
  back:    { dx: 0,  dy:  1, facing: "S" },
  right:   { dx: 1,  dy:  0, facing: "E" },
  left:    { dx: -1, dy:  0, facing: "W" },
};

// ── Landmark SVG ───────────────────────────────────────────────
function LandmarkSVG({ kind }: { kind: string }) {
  const stroke = "var(--indigo)";
  if (kind === "tugu")
    return (
      <svg width="36" height="44" viewBox="0 0 36 44">
        <ellipse cx="18" cy="42" rx="10" ry="2" fill="rgba(0,0,0,0.15)" />
        <circle cx="18" cy="6" r="2" fill="var(--gold)" stroke={stroke} strokeWidth="1" />
        <path d="M18 8 L18 30" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 30 L22 30 L22 36 L14 36 Z" fill={stroke} />
        <path d="M12 36 L24 36 L26 40 L10 40 Z" fill={stroke} />
        <path d="M15 14 L21 14 M15 20 L21 20 M15 26 L21 26" stroke="var(--paper)" strokeWidth="1" />
      </svg>
    );
  if (kind === "keraton")
    return (
      <svg width="44" height="40" viewBox="0 0 44 40">
        <ellipse cx="22" cy="38" rx="15" ry="2" fill="rgba(0,0,0,0.15)" />
        <path
          d="M6 22 L22 6 L38 22 L34 22 L34 36 L10 36 L10 22 Z"
          fill={stroke}
          stroke={stroke}
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path d="M22 6 L22 14" stroke="var(--gold)" strokeWidth="1.5" />
        <circle cx="22" cy="5" r="1.5" fill="var(--gold)" />
        <rect x="19" y="26" width="6" height="10" fill="var(--paper)" />
        <rect x="11" y="24" width="5" height="6" fill="var(--paper)" />
        <rect x="28" y="24" width="5" height="6" fill="var(--paper)" />
      </svg>
    );
  if (kind === "malioboro")
    return (
      <svg width="32" height="36" viewBox="0 0 32 36">
        <ellipse cx="16" cy="34" rx="10" ry="1.5" fill="rgba(0,0,0,0.15)" />
        <path d="M16 8 L16 32" stroke={stroke} strokeWidth="2" />
        <circle cx="16" cy="6" r="3" fill="var(--gold)" stroke={stroke} strokeWidth="1.5" />
        <path d="M10 12 L22 12" stroke={stroke} strokeWidth="1.5" />
        <circle cx="10" cy="13" r="1.5" fill="var(--gold)" />
        <circle cx="22" cy="13" r="1.5" fill="var(--gold)" />
      </svg>
    );
  if (kind === "beringharjo")
    return (
      <svg width="36" height="32" viewBox="0 0 36 32">
        <ellipse cx="18" cy="30" rx="12" ry="1.5" fill="rgba(0,0,0,0.15)" />
        <path d="M4 12 L18 4 L32 12 L32 28 L4 28 Z" fill={stroke} stroke={stroke} strokeLinejoin="round" />
        <path d="M4 12 L32 12" stroke="var(--gold)" strokeWidth="1.5" />
        <rect x="14" y="18" width="8" height="10" fill="var(--paper)" />
        <rect x="7" y="16" width="4" height="4" fill="var(--paper)" />
        <rect x="25" y="16" width="4" height="4" fill="var(--paper)" />
      </svg>
    );
  return null;
}

// ── Big map ────────────────────────────────────────────────────
function BigMap({
  pawn,
  trail,
  crashCell,
}: {
  pawn: PawnState;
  trail: Point[];
  crashCell: Point | null;
}) {
  const cellPx = 100 / GRID_COLS;
  const rowPx = 100 / GRID_ROWS;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(165deg, #f7ecd2 0%, #ecdcae 60%, #e3cf94 100%)",
        border: "1px solid var(--line-soft)",
      }}
    >
      {/* Parchment texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          pointerEvents: "none",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><g fill='none' stroke='%235a3a1e' stroke-opacity='0.06'><circle cx='40' cy='40' r='1'/><circle cx='10' cy='20' r='0.8'/><circle cx='65' cy='15' r='0.8'/><circle cx='25' cy='65' r='0.8'/></g></svg>\")",
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${GRID_COLS * 10} ${GRID_ROWS * 10}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern id="bgrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="#5a3a1e"
              strokeOpacity="0.18"
              strokeWidth="0.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgrid)" />
        {trail.length > 1 && (
          <path
            d={`M ${trail.map((p) => `${p.x * 10 + 5} ${p.y * 10 + 5}`).join(" L ")}`}
            fill="none"
            stroke="var(--sogan)"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}
      </svg>

      {/* Coord labels */}
      {Array.from({ length: GRID_COLS }).map((_, i) => (
        <div
          key={`cx${i}`}
          style={{
            position: "absolute",
            left: `${i * cellPx + cellPx / 2}%`,
            top: 4,
            transform: "translateX(-50%)",
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "rgba(90,58,30,0.5)",
          }}
        >
          {i}
        </div>
      ))}
      {Array.from({ length: GRID_ROWS }).map((_, i) => (
        <div
          key={`cy${i}`}
          style={{
            position: "absolute",
            top: `${i * rowPx + rowPx / 2}%`,
            left: 4,
            transform: "translateY(-50%)",
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "rgba(90,58,30,0.5)",
          }}
        >
          {i}
        </div>
      ))}

      {/* Landmarks */}
      {LANDMARKS.map((lm, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${lm.x * cellPx + cellPx / 2}%`,
            top: `${lm.y * rowPx + rowPx / 2}%`,
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <LandmarkSVG kind={lm.kind} />
          <span
            style={{
              position: "absolute",
              top: "85%",
              whiteSpace: "nowrap",
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "var(--indigo)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              background: "var(--paper)",
              padding: "2px 6px",
              borderRadius: 3,
              border: "1px solid var(--line-soft)",
            }}
          >
            {lm.name}
          </span>
        </div>
      ))}

      {/* Obstacles */}
      {OBSTACLES.map((o, i) => (
        <div
          key={i}
          title={o.name}
          style={{
            position: "absolute",
            left: `${o.x * cellPx + cellPx / 2}%`,
            top: `${o.y * rowPx + rowPx / 2}%`,
            transform: "translate(-50%, -50%)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity:
              crashCell && crashCell.x === o.x && crashCell.y === o.y ? 1 : 0.85,
            filter:
              crashCell && crashCell.x === o.x && crashCell.y === o.y
                ? "drop-shadow(0 0 8px var(--sogan))"
                : "none",
          }}
        >
          <svg width="32" height="28" viewBox="0 0 32 28">
            <ellipse cx="16" cy="26" rx="12" ry="1.5" fill="rgba(0,0,0,0.15)" />
            <circle cx="8" cy="22" r="3" fill="none" stroke="var(--sogan-2)" strokeWidth="1.5" />
            <circle cx="24" cy="22" r="3" fill="none" stroke="var(--sogan-2)" strokeWidth="1.5" />
            <path d="M5 18 L27 18 L25 12 L7 12 Z" fill="var(--sogan-2)" />
            <path
              d="M11 12 L11 6 L21 6 L21 12"
              fill="none"
              stroke="var(--sogan-2)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      ))}

      {/* Pawn */}
      <div
        style={{
          position: "absolute",
          left: `${pawn.x * cellPx + cellPx / 2}%`,
          top: `${pawn.y * rowPx + rowPx / 2}%`,
          transform: "translate(-50%, -85%)",
          transition: "left .65s cubic-bezier(.4,.2,.2,1), top .65s cubic-bezier(.4,.2,.2,1)",
          zIndex: 5,
        }}
      >
        <Pawn />
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--indigo)",
            textAlign: "center",
            marginTop: 2,
            fontWeight: 700,
          }}
        >
          ↟ {FACING_LABEL[pawn.facing]}
        </div>
      </div>

      {/* Crash */}
      {crashCell && (
        <div
          style={{
            position: "absolute",
            left: `${crashCell.x * cellPx + cellPx / 2}%`,
            top: `${crashCell.y * rowPx + rowPx / 2}%`,
            transform: "translate(-50%, -50%)",
            fontSize: 28,
            animation: "floaty 0.6s infinite",
          }}
        >
          💥
        </div>
      )}

      {/* Compass */}
      <div style={{ position: "absolute", bottom: 12, right: 12, width: 56, height: 56 }}>
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="26" fill="var(--paper)" stroke="var(--line-soft)" />
          <g
            fontFamily="var(--mono)"
            fontSize="8"
            fontWeight="700"
            textAnchor="middle"
          >
            <text x="28" y="12" fill="var(--sogan)">
              U
            </text>
            <text x="28" y="50" fill="var(--ink-mute)">
              S
            </text>
            <text x="46" y="31" fill="var(--ink-mute)">
              T
            </text>
            <text x="10" y="31" fill="var(--ink-mute)">
              B
            </text>
          </g>
          <path d="M28 14 L31 28 L28 26 L25 28 Z" fill="var(--sogan)" />
          <path d="M28 42 L25 28 L28 30 L31 28 Z" fill="var(--ink-mute)" />
        </svg>
      </div>

      {/* Scale */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "var(--paper)",
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--line-soft)",
          fontFamily: "var(--mono)",
          fontSize: 9,
          color: "var(--ink-soft)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 32, height: 2, background: "var(--ink)" }} />
          <span>1 KOTAK = 100M</span>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────
type Status = "idle" | "running" | "success" | "crash" | "offmap";

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; col: string; text: string }> = {
    idle: { bg: "rgba(26,20,16,0.06)", col: "var(--ink-soft)", text: "SIAP" },
    running: { bg: "rgba(184,92,56,0.12)", col: "var(--sogan)", text: "◉ EKSEKUSI..." },
    success: { bg: "rgba(31,138,91,0.12)", col: "#1f8a5b", text: "✓ TIBA DI KERATON" },
    crash: { bg: "rgba(184,92,56,0.18)", col: "var(--sogan-2)", text: "✕ MENABRAK" },
    offmap: { bg: "rgba(184,92,56,0.18)", col: "var(--sogan-2)", text: "✕ KELUAR PETA" },
  };
  const m = map[status];
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.15em",
        padding: "6px 12px",
        borderRadius: 999,
        background: m.bg,
        color: m.col,
        fontWeight: 600,
      }}
    >
      {m.text}
    </span>
  );
}

function StatusMessage({
  status,
  sequence,
  pawn,
}: {
  status: Status;
  sequence: SequenceCard[];
  pawn: PawnState;
}) {
  let text: string | null = null,
    color = "var(--ink-soft)";
  if (status === "success") {
    text = "🏯 Selamat! Algoritmamu membawa bidak sampai Keraton dengan selamat.";
    color = "#1f8a5b";
  } else if (status === "crash") {
    text = "Aduh, bidak menabrak rintangan. Susun ulang kartu dan coba lagi (debug).";
    color = "var(--sogan-2)";
  } else if (status === "offmap") {
    text = "Bidak keluar peta! Periksa hitungan skala dan urutan kartu.";
    color = "var(--sogan-2)";
  } else if (status === "idle" && sequence.length > 0) {
    if (pawn.x !== START.x || pawn.y !== START.y) {
      text = "Algoritma selesai tapi belum sampai Keraton. Tambah atau ubah kartu.";
    }
  }
  if (!text) return null;
  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.5)",
        border: "1px solid var(--line-soft)",
        borderRadius: 8,
        fontSize: 14,
        color,
        fontFamily: "var(--sans)",
      }}
    >
      {text}
    </div>
  );
}

// ── Demo panel ─────────────────────────────────────────────────
export default function DemoPanel() {
  const [sequence, setSequence] = useState<SequenceCard[]>([
    { ...CARD_TYPES[1], uid: "a" }, // TIMUR
    { ...CARD_TYPES[1], uid: "b" }, // TIMUR
  ]);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [pawn, setPawn] = useState<PawnState>({ ...START });
  const [trail, setTrail] = useState<Point[]>([{ x: START.x, y: START.y }]);
  const [status, setStatus] = useState<Status>("idle");
  const [crashCell, setCrashCell] = useState<Point | null>(null);
  const dragSrc = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const reset = () => {
    setRunning(false);
    setStepIdx(-1);
    setPawn({ ...START });
    setTrail([{ x: START.x, y: START.y }]);
    setStatus("idle");
    setCrashCell(null);
  };

  // Expose global handler for camera panel
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__kartalokaApplySequence = (
      cards: Array<{ dir: Dir; label: string }>
    ) => {
      setSequence(
        cards.map((c, i) => ({
          id: c.dir,
          dir: c.dir,
          label: c.label,
          desc: "",
          uid: "cv" + i + Math.random().toString(36).slice(2, 5),
        }))
      );
      reset();
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__kartalokaApplySequence;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step runner
  useEffect(() => {
    if (!running) return;
    if (stepIdx >= sequence.length) {
      setRunning(false);
      if (pawn.x === KERATON.x && pawn.y === KERATON.y) setStatus("success");
      else setStatus("idle");
      return;
    }
    const t = setTimeout(() => {
      const card = sequence[stepIdx];
      const delta = DIR_DELTA[card.dir];
      const nx = pawn.x + delta.dx;
      const ny = pawn.y + delta.dy;
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) {
        setStatus("offmap");
        setCrashCell({ x: nx, y: ny });
        setRunning(false);
        return;
      }
      const obs = OBSTACLES.find((o) => o.x === nx && o.y === ny);
      if (obs) {
        setStatus("crash");
        setCrashCell({ x: nx, y: ny });
        setRunning(false);
        return;
      }
      setPawn({ x: nx, y: ny, facing: delta.facing });
      setTrail((prev) => [...prev, { x: nx, y: ny }]);
      setStepIdx((i) => i + 1);
    }, 700);
    return () => clearTimeout(t);
  }, [running, stepIdx, sequence, pawn]);

  const start = () => {
    if (!sequence.length) return;
    if (status !== "idle") reset();
    setStatus("running");
    setRunning(true);
    setStepIdx(0);
  };

  const addCard = (type: CardType) => {
    setSequence((seq) => [
      ...seq,
      { ...type, uid: Math.random().toString(36).slice(2, 8) },
    ]);
    if (status !== "idle") reset();
  };

  const removeCard = (uid: string) => {
    setSequence((seq) => seq.filter((c) => c.uid !== uid));
    if (status !== "idle") reset();
  };

  const clearAll = () => {
    setSequence([]);
    reset();
  };

  const onDragStart = (i: number) => () => {
    dragSrc.current = i;
  };
  const onDragEnter = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    dragOver.current = i;
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragSrc.current;
    if (from == null || from === i) return;
    setSequence((seq) => {
      const next = [...seq];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragSrc.current = null;
    if (status !== "idle") reset();
  };

  const loadHint = () => {
    // Rute Tugu (1,1) -> Keraton (6,5) hindari Becak(1,3) dan Andong(4,5):
    // T(2,1), S(2,2), T(3,2), T(4,2), S(4,3), S(4,4), T(5,4), T(6,4), S(6,5)
    setSequence(
      ["timur", "selatan", "timur", "timur", "selatan", "selatan", "timur", "timur", "selatan"].map((id, i) => ({
        ...(CARD_TYPES.find((c) => c.id === id) as CardType),
        uid: "h" + i,
      }))
    );
    reset();
  };

  return (
    <section id="demo" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 28, height: 1, background: "var(--sogan)" }} />
          <span className="eyebrow">Modul 1 · Demo Interaktif</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.4fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Left */}
          <div>
            <h2
              style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 1, fontWeight: 500 }}
            >
              Susun urutannya,{" "}
              <em style={{ color: "var(--sogan)", fontStyle: "italic" }}>jalankan</em>, lihat
              bidakmu menari di peta.
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
              Versi web dari Kartaloka. Seret kartu instruksi ke jalur algoritma — bidak akan
              mencoba tiba di Keraton dari Tugu Pal Putih. Kalau menabrak becak, ya…{" "}
              <em>debug</em>!
            </p>

            {/* Card palette */}
            <div style={{ marginTop: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Kartu Instruksi
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {CARD_TYPES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addCard(c)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <InstructionCard dir={c.dir} label={c.label} scale={1} />
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--ink-mute)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      + TAMBAH
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: map */}
          <div className="paper-card" style={{ position: "relative", padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="pill">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--sogan)",
                      display: "inline-block",
                    }}
                  />{" "}
                  PETA SUMBU FILOSOFI
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-mute)",
                  }}
                >
                  ({pawn.x}, {pawn.y}) · menghadap {FACING_LABEL[pawn.facing]}
                </span>
              </div>
              <StatusBadge status={status} />
            </div>
            <BigMap pawn={pawn} trail={trail} crashCell={crashCell} />
          </div>
        </div>

        {/* Sequence track */}
        <div className="paper-card" style={{ marginTop: 28, padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="eyebrow">Jalur Algoritma</span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--ink-mute)",
                }}
              >
                {sequence.length} kartu
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={loadHint}
                className="btn btn--ghost"
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                Beri Petunjuk
              </button>
              <button
                onClick={clearAll}
                className="btn btn--ghost"
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                Bersihkan
              </button>
              <button
                onClick={start}
                className="btn btn--sogan"
                style={{ padding: "10px 18px", fontSize: 14 }}
              >
                {status === "running" ? "■ Berhenti" : "▶ Eksekusi"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              minHeight: 110,
              padding: 16,
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(42,31,18,0.04) 8px, rgba(42,31,18,0.04) 16px)",
              border: "1.5px dashed var(--line-soft)",
              borderRadius: 12,
            }}
            onDragOver={onDragOver}
          >
            {/* Start */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--indigo)",
                  color: "var(--paper)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--serif)",
                  fontWeight: 600,
                }}
              >
                Tugu
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  color: "var(--ink-mute)",
                }}
              >
                START
              </div>
            </div>

            {sequence.length === 0 && (
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  color: "var(--ink-mute)",
                  fontSize: 18,
                }}
              >
                Klik kartu di atas untuk menambah, lalu seret untuk mengurutkan…
              </div>
            )}

            {sequence.map((c, i) => (
              <div
                key={c.uid}
                draggable
                onDragStart={onDragStart(i)}
                onDragEnter={onDragEnter(i)}
                onDrop={onDrop(i)}
                onClick={() => removeCard(c.uid)}
                title="Klik untuk hapus, atau seret untuk pindah"
                style={{ position: "relative" }}
              >
                <InstructionCard
                  dir={c.dir}
                  label={c.label}
                  index={i + 1}
                  faded={status !== "idle" && i >= stepIdx && status !== "running"}
                  dragging={status === "running" && i === stepIdx - 1}
                />
              </div>
            ))}

            {sequence.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--serif)",
                    fontWeight: 600,
                  }}
                >
                  Keraton
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--ink-mute)",
                  }}
                >
                  GOAL
                </div>
              </div>
            )}
          </div>

          <StatusMessage status={status} sequence={sequence} pawn={pawn} />
        </div>
      </div>
    </section>
  );
}

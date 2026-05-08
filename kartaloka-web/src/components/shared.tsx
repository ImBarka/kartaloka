"use client";

// ── Arrow glyph ──────────────────────────────────────────────
type Dir = "forward" | "right" | "back" | "left";
const ROT: Record<Dir, number> = { forward: 0, right: 90, back: 180, left: -90 };

export function ArrowGlyph({
  dir = "forward",
  size = 28,
  color = "#1a1410",
}: {
  dir?: Dir;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${ROT[dir]}deg)` }}
    >
      <g
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v15" />
        <path d="M6 10l6-6 6 6" />
      </g>
    </svg>
  );
}

// ── Instruction card ──────────────────────────────────────────
export function InstructionCard({
  dir,
  label,
  scale = 1,
  dragging = false,
  faded = false,
  index = null,
}: {
  dir: Dir;
  label: string;
  scale?: number;
  dragging?: boolean;
  faded?: boolean;
  index?: number | null;
}) {
  return (
    <div
      style={{
        width: 76 * scale,
        height: 100 * scale,
        background: "var(--paper)",
        border: "1.5px solid var(--line)",
        borderRadius: 10,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        boxShadow: dragging
          ? "0 16px 30px -12px rgba(26,20,16,0.35), 0 0 0 2px var(--sogan)"
          : "0 6px 14px -8px rgba(26,20,16,0.4)",
        opacity: faded ? 0.4 : 1,
        cursor: "grab",
        userSelect: "none",
        transform: dragging ? "rotate(-3deg) scale(1.05)" : "none",
        transition: "transform .15s ease, box-shadow .15s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 5,
          border: "1px solid var(--line-soft)",
          borderRadius: 6,
          pointerEvents: "none",
        }}
      />
      <ArrowGlyph dir={dir} size={32 * scale} />
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9 * scale,
          letterSpacing: "0.1em",
          color: "var(--ink-soft)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {index !== null && (
        <div
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--sogan)",
            color: "var(--paper)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid var(--paper)",
          }}
        >
          {index}
        </div>
      )}
    </div>
  );
}

// ── Logo ───────────────────────────────────────────────────────
export function KartalokaLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="var(--indigo)" stroke="var(--gold)" strokeWidth="1" />
      <g
        transform="translate(20 20)"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M0 -10 L0 5" />
        <path d="M-3 5 L3 5 L3 7 L-3 7 Z" fill="var(--paper)" />
        <circle cx="0" cy="-12" r="1.2" fill="var(--gold)" stroke="none" />
        <path d="M-9 0 L-6 0 M9 0 L6 0 M0 9 L0 7" />
      </g>
    </svg>
  );
}

// ── Header ─────────────────────────────────────────────────────
export function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        background: "rgba(250, 243, 227, 0.85)",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <KartalokaLogo size={36} />
          <div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Kartaloka
            </div>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, fontWeight: 500 }}>
          <a href="#demo" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            Demo
          </a>
          <a href="#kamera" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            Kamera Vision
          </a>
          <a href="#materi" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            Materi
          </a>
          <a href="#" className="btn btn--sogan" style={{ padding: "10px 18px", fontSize: 13 }}>
            <span>Masuk Kelas</span>
            <span style={{ fontFamily: "var(--mono)" }}>→</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

// ── Batik ornament ─────────────────────────────────────────────
export function BatikOrnament({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" style={style}>
      <g fill="none" stroke="var(--ink)" strokeWidth="1">
        {[80, 64, 48, 32, 16].map((r, i) => (
          <circle key={i} cx="100" cy="100" r={r} />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <path d="M100 20 Q 110 50, 100 80 Q 90 50, 100 20" />
            <circle cx="100" cy="35" r="3" />
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Pawn ───────────────────────────────────────────────────────
export function Pawn() {
  return (
    <svg width="22" height="32" viewBox="0 0 22 32">
      <ellipse cx="11" cy="29" rx="9" ry="2.5" fill="rgba(26,20,16,0.2)" />
      <path
        d="M11 4 C 7 4 5 7 6 11 L 5 14 L 7 14 L 6 19 L 4 24 L 18 24 L 16 19 L 15 14 L 17 14 L 16 11 C 17 7 15 4 11 4 Z"
        fill="var(--sogan)"
        stroke="var(--line)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="3.5" r="2" fill="var(--gold)" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}

// ── Camera icon ─────────────────────────────────────────────────
export function CameraIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

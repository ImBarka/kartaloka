"use client";

import { useState, useEffect } from "react";
import { ArrowGlyph, InstructionCard, BatikOrnament, Pawn } from "./shared";

// ── Squiggle underline ─────────────────────────────────────────
function UnderlineSquiggle() {
  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: 5,
      }}
    >
      <path
        d="M0 4 Q 12 0, 25 4 T 50 4 T 75 4 T 100 4"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Mini map for hero illustration ────────────────────────────
type Point = [number, number];

function MiniMap({ path, pawnIdx }: { path: Point[]; pawnIdx: number }) {
  const cols = 7,
    rows = 7;
  const cell = 100 / cols;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #f7ecd2 0%, #f0e0b8 100%)",
        border: "1px solid var(--line-soft)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${cols * 10} ${rows * 10}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern id="hgrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.08"
              strokeWidth="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hgrid)" />
        <path
          d={`M ${path.map(([x, y]) => `${x * 10 + 5} ${y * 10 + 5}`).join(" L ")}`}
          fill="none"
          stroke="var(--sogan)"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1.5 1"
          opacity="0.7"
        />
      </svg>

      {/* Tugu */}
      <MiniLandmark x={path[0][0]} y={path[0][1]} cell={cell} label="TUGU" isTugu />
      {/* Keraton */}
      <MiniLandmark
        x={path[path.length - 1][0]}
        y={path[path.length - 1][1]}
        cell={cell}
        label="KERATON"
        isTugu={false}
      />

      {/* Pawn */}
      <div
        style={{
          position: "absolute",
          left: `${path[pawnIdx][0] * cell + cell / 2}%`,
          top: `${path[pawnIdx][1] * cell + cell / 2}%`,
          transform: "translate(-50%, -50%)",
          transition: "left .8s ease-in-out, top .8s ease-in-out",
        }}
      >
        <Pawn />
      </div>

      {/* Compass */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          width: 36,
          height: 36,
          background: "var(--paper)",
          borderRadius: "50%",
          border: "1px solid var(--line-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--ink-soft)",
        }}
      >
        U
      </div>
    </div>
  );
}

function MiniLandmark({
  x,
  y,
  cell,
  label,
  isTugu,
}: {
  x: number;
  y: number;
  cell: number;
  label: string;
  isTugu: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x * cell + cell / 2}%`,
        top: `${y * cell + cell / 2}%`,
        transform: "translate(-50%, -50%)",
        width: 38,
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        {isTugu ? (
          <g fill="none" stroke="var(--indigo)" strokeWidth="1.4" strokeLinecap="round">
            <path d="M16 6 L16 22" />
            <path d="M13 22 L19 22 L19 25 L13 25 Z" fill="var(--indigo)" />
            <circle cx="16" cy="4" r="1.4" fill="var(--gold)" stroke="none" />
            <path d="M14.5 9 L17.5 9 M14.5 14 L17.5 14" />
          </g>
        ) : (
          <g fill="none" stroke="var(--indigo)" strokeWidth="1.4" strokeLinejoin="round">
            <path
              d="M6 24 L6 14 L16 8 L26 14 L26 24 Z"
              fill="var(--indigo)"
              stroke="var(--indigo)"
            />
            <path d="M14 24 L14 18 L18 18 L18 24" stroke="var(--paper)" />
            <path
              d="M9 16 L9 13 L11 13 L11 16 M21 16 L21 13 L23 13 L23 16"
              stroke="var(--paper)"
            />
          </g>
        )}
      </svg>
      <span
        style={{
          position: "absolute",
          top: "100%",
          whiteSpace: "nowrap",
          fontFamily: "var(--mono)",
          fontSize: 9,
          color: "var(--indigo)",
          marginTop: 2,
          fontWeight: 600,
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Hero illustration ─────────────────────────────────────────
function HeroIllustration({ tick }: { tick: number }) {
  const instructions: Array<{ dir: "forward" | "right"; label: string }> = [
    { dir: "forward", label: "UTARA" },
    { dir: "right",   label: "TIMUR" },
    { dir: "right",   label: "TIMUR" },
    { dir: "forward", label: "UTARA" },
    { dir: "right",   label: "TIMUR" },
  ];
  const path: Point[] = [
    [1, 1], [2, 1], [2, 2], [3, 2], [4, 2], [4, 3], [5, 3], [5, 4], [6, 4],
  ];
  const pawnIdx = Math.min(tick, path.length - 1);

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        background: "var(--paper)",
        borderRadius: 24,
        border: "1px solid var(--line-soft)",
        padding: 28,
        boxShadow:
          "0 30px 60px -30px rgba(26, 20, 16, 0.35), 0 1px 0 rgba(255,255,255,.6) inset",
      }}
    >
      <div className="corner-orn tl" />
      <div className="corner-orn tr" />
      <div className="corner-orn bl" />
      <div className="corner-orn br" />

      {/* Cards row */}
      <div style={{ position: "relative", height: "38%" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          {instructions.map((c, i) => (
            <div
              key={i}
              style={{
                transform: `translateY(${i === tick ? -6 : 0}px) rotate(${(i - 2) * 1.5}deg)`,
                transition: "transform .3s ease",
              }}
            >
              <InstructionCard
                dir={c.dir}
                label={c.label}
                scale={0.85}
              />
            </div>
          ))}
        </div>
        {/* Camera scan line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 2,
            background: "linear-gradient(to right, transparent, var(--sogan), transparent)",
            opacity: 0.5,
            transform: `translateY(${(tick - 2) * 12}px)`,
            transition: "transform .8s ease-in-out",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 8,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--sogan)",
            letterSpacing: "0.15em",
          }}
        >
          ◉ SCAN... {tick + 1}/5
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--ink-mute)",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
        <ArrowGlyph dir="forward" size={18} color="var(--sogan)" />
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em" }}>
          EKSEKUSI
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
      </div>

      {/* Map */}
      <div style={{ position: "relative", height: "calc(56% - 8px)" }}>
        <MiniMap path={path} pawnIdx={pawnIdx} />
      </div>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────
export default function Hero() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 9), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ paddingTop: 64, paddingBottom: 64, overflow: "hidden" }} className="batik-bg">
      <BatikOrnament
        style={{ position: "absolute", top: -30, right: -40, opacity: 0.08, width: 380 }}
      />
      <BatikOrnament
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          opacity: 0.06,
          width: 300,
          transform: "scaleX(-1)",
        }}
      />

      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Copy */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <span style={{ width: 32, height: 1, background: "var(--sogan)" }} />
              <span className="eyebrow">Media Belajar · Kelas 5 SD</span>
            </div>

            <h1 style={{ fontSize: "clamp(48px, 6vw, 84px)", lineHeight: 0.96, fontWeight: 500 }}>
              Belajar{" "}
              <em style={{ color: "var(--sogan)", fontStyle: "italic", fontWeight: 600 }}>
                algoritma
              </em>
              <br />
              dari{" "}
              <span style={{ position: "relative", display: "inline-block", paddingBottom: "0.08em" }}>
                Tugu
                <UnderlineSquiggle />
              </span>{" "}
              sampai{" "}
              <span style={{ position: "relative", display: "inline-block", paddingBottom: "0.08em" }}>
                Keraton.
                <UnderlineSquiggle />
              </span>
            </h1>

            <p
              style={{
                marginTop: 28,
                fontSize: 19,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
                maxWidth: 560,
              }}
            >
              Susun kartu arah di atas meja, biarkan kamera membaca, lalu lihat
              bidakmu berjalan dari Tugu ke Keraton. Belajar membaca peta dan
              berpikir runtut — seperti petualang sungguhan.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 36 }}>
              <a href="#demo" className="btn btn--sogan">
                <span>Mulai Petualangan</span>
                <span style={{ fontFamily: "var(--mono)" }}>→</span>
              </a>
              <a href="#kamera" className="btn btn--ghost">
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
                </svg>{" "}
                Lihat Kamera Vision
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 32, marginTop: 56, flexWrap: "wrap" }}>
              {[
                { n: "4 arah", l: "Utara · Selatan · Timur · Barat" },
                { n: "Kelas 5", l: "Materi IPS & Peta" },
                { n: "2,5 km", l: "Sumbu Filosofi" },
              ].map((s, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 32,
                      fontWeight: 600,
                      color: "var(--indigo)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      color: "var(--ink-mute)",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <HeroIllustration tick={tick} />
        </div>

        {/* Alur operasional */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 36,
            borderTop: "1px dashed var(--line-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <span className="eyebrow">Alur Operasional</span>
            <span style={{ height: 1, flex: 1, background: "var(--line-soft)" }} />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}
          >
            {[
              { num: "01", title: "Susun Kartu", body: "Tata kartu Utara, Selatan, Timur, atau Barat di meja dari kiri ke kanan." },
              { num: "02", title: "Pindai Kamera", body: "Kamera membaca susunan kartumu dan menyalin ke aplikasi secara otomatis." },
              { num: "03", title: "Lihat Peta", body: "Rute perjalanan dari Tugu ke Keraton muncul di peta Sumbu Filosofi." },
              { num: "04", title: "Jalankan", body: "Bidak bergerak mengikuti urutan kartumu — selangkah demi selangkah." },
              { num: "05", title: "Coba Lagi", body: "Salah arah? Susun ulang kartu dan coba rute yang berbeda." },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 20px 20px 0",
                  borderRight: i < 4 ? "1px solid var(--line-soft)" : "none",
                  paddingLeft: i > 0 ? 24 : 0,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--sogan)",
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 20,
                    fontWeight: 600,
                    marginTop: 6,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    lineHeight: 1.5,
                    marginTop: 6,
                  }}
                >
                  {s.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Header, KartalokaLogo } from "@/components/shared";
import Hero from "@/components/Hero";
import CameraPanel from "@/components/CameraPanel";
import DemoPanel from "@/components/DemoPanel";

function Footer() {
  return (
    <footer
      style={{
        padding: "40px 0 60px",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--bg)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <KartalokaLogo size={28} />
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>
              Kartaloka
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            fontFamily: "var(--mono)",
            letterSpacing: "0.1em",
          }}
        >
          © 2026 · MEDIA PEMBELAJARAN · TUGU → KERATON
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DemoPanel />
        <CameraPanel />
      </main>
      <Footer />
    </>
  );
}

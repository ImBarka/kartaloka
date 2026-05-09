import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kartaloka — Belajar Peta & Arah untuk Kelas 5 SD",
  description:
    "Susun kartu arah di meja, kamera membaca, lalu lihat bidakmu berjalan dari Tugu ke Keraton. Media belajar peta dan berpikir runtut untuk siswa kelas 5 SD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${cormorant.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="batik-bg">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  applicationName: "ShelfWise",
  title: "ShelfWise | YouCam Skin Analysis & Skincare Shelf Audit",
  description:
    "Connect YouCam V2.1 skin analysis with an ingredient-aware audit of the skincare products you already own. Build a more compatible routine and avoid unnecessary purchases.",
  keywords: [
    "ShelfWise",
    "YouCam V2.1",
    "skin analysis",
    "skincare routine",
    "INCI parser",
    "ingredient compatibility",
    "skincare shelf audit",
  ],
  openGraph: {
    title: "ShelfWise — Scan your skin. Audit your shelf.",
    description:
      "A skin-aware skincare shelf audit powered by YouCam V2.1 and an explainable ingredient-compatibility engine.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${jetbrains.variable} dark`}
    >
      <body className="min-h-screen bg-[#161310] text-[#F7F4EF] antialiased">
        {children}
      </body>
    </html>
  );
}

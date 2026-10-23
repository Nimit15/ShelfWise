import type { Metadata } from "next";
import {
  Inter,
  Cormorant_Garamond,
  Fira_Code,
} from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ShelfWise Atelier — Clinical Skin Analysis & Bio-Inventory Audit",
  description:
    "Luxury clinical skin analysis via Perfect Corp YouCam V2.1 API. 3D dermal telemetry, INCI formulation intelligence, and a verdict ledger — often Buy Nothing, ₹0 needed.",
  keywords:
    "skin analysis, skincare audit, ingredient conflict, YouCam API, clinical skincare, dermal telemetry",
  openGraph: {
    title: "ShelfWise Atelier — Clinical Skin Analysis & Bio-Inventory Audit",
    description:
      "A private clinical atelier for barrier harmony. 16-concern YouCam scan, 3D exploded dermal layers, INCI formulation studio.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${cormorant.variable} ${firaCode.variable} min-h-screen bg-[var(--ca-studiomid)] text-[var(--ca-paper)] antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
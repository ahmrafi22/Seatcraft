import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "SeatCraft — exam seat allocation",
    template: "%s · SeatCraft"
  },
  description:
    "SeatCraft lays out exam halls, spreads institutions apart and publishes a seat plan candidates can look up."
};

export const viewport: Viewport = {
  themeColor: "#131118",
  colorScheme: "dark"
};

/** The chrome-free root: fonts, tokens and the aurora. The workspace shell lives in (workspace). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

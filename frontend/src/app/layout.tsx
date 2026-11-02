import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { getSession } from "@/lib/session";

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh">
          <Sidebar session={session} />
          <div className="flex min-w-0 flex-1 flex-col lg:pl-[244px]">
            {children}
            <div className="h-24 lg:hidden" />
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}

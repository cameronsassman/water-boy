import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SACS Junior Water Polo Tournament 2026",
  description: "Official tournament hub — live scores, standings and teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Navbar />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
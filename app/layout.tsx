// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { PerformanceProvider } from "@/components/performance/PerformanceContext";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SACS Junior Water Polo Tournament 2025",
  description: "Official tournament hub — live scores, standings, teams and brackets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <PerformanceProvider>
          <Navbar />
          <main>{children}</main>
          <PerformanceMonitor />
        </PerformanceProvider>
      </body>
    </html>
  );
}
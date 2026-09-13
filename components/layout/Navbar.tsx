"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; live?: boolean };

const publicLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/standings", label: "Standings" },
  { href: "/teams", label: "Teams" },
];

const adminLinks: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/scorer", label: "Live Scoring", live: true },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/bracket", label: "Bracket" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isScorer = pathname.startsWith("/scorer");
  const links = isAdmin ? adminLinks : publicLinks;

  if (isScorer) return null;

  return (
    <nav className="relative bg-[#07091F] border-b-2 border-[#1B6FC8]/40 overflow-hidden">
      <div className="absolute w-52 h-52 rounded-full border border-[#1B6FC8]/15 -top-32 -left-16 pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-[#38B6E8]/[0.06] -bottom-24 right-10 pointer-events-none" />
      <div className="absolute w-16 h-16 rounded-full bg-[#F5C518]/10 top-2 right-1/4 pointer-events-none hidden sm:block" />

      <div className="relative max-w-6xl mx-auto px-6 py-7 flex flex-wrap items-center justify-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 sm:absolute sm:left-6 sm:top-1/2 sm:-translate-y-1/2"
        >
          <Image
            src="/assets/logo/sacs-wp-logo.png"
            alt="SACS Junior Water Polo"
            width={857}
            height={720}
            className="w-auto h-16"
          />
          <div className="hidden sm:block w-px h-8 bg-[#1B3A6E]" />
          <div>
            <div className="text-white text-sm font-black uppercase tracking-wide leading-tight">
              SACS Junior Water Polo
            </div>
            <div className="text-[#38B6E8] text-[9px] font-bold uppercase tracking-widest">
              Tournament 2026
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-9">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group relative flex flex-col items-center gap-2 py-1"
              >
                <span
                  className={
                    active
                      ? "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F5C518]"
                      : "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A9CC8] group-hover:text-white transition-colors"
                  }
                >
                  {l.live && <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />}
                  {l.label}
                </span>
                <span
                  className={
                    active
                      ? "h-[3px] w-6 rounded-full bg-[#F5C518]"
                      : "h-[3px] w-6 rounded-full bg-transparent group-hover:bg-[#1B6FC8]/50 transition-colors"
                  }
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
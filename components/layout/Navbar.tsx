"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SHEET_URL } from "@/lib/links";

type NavLink = { href: string; label: string; live?: boolean };

const publicLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/standings", label: "Groups" },
  { href: "/final-standings", label: "Standings" },
  { href: "/teams", label: "Teams" },
];

const adminLinks: NavLink[] = [
  { href: "/admin/", label: "Dashboard" },
  { href: "/scorer", label: "Live Scoring", live: true },
  { href: "/admin/fixtures", label: "Fixtures" },
  { href: "/admin/teams", label: "Teams" },
  // { href: "/admin/bracket", label: "Bracket" },
];

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-3 shrink-0 min-w-0">
      <Image
        src="/assets/logo/sacs-wp-logo.png"
        alt="SACS Junior Water Polo"
        width={857}
        height={720}
        className="w-auto h-12 md:h-16"
      />
      <div className="hidden md:block w-px h-8 bg-[#1B3A6E]" />
      <div className="min-w-0">
        <div className="text-white text-xs md:text-sm font-black uppercase tracking-wide leading-tight truncate">
          SACS Junior Water Polo
        </div>
        <div className="text-[#38B6E8] text-[9px] font-bold uppercase tracking-widest">
          Tournament 2026
        </div>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");
  const isScorer = pathname.startsWith("/scorer");
  const [finalReady, setFinalReady] = useState(false);

  // Show "Final Standings" only once the Cup Final is complete.
  useEffect(() => {
    if (isAdmin || isScorer) return;
    let cancelled = false;
    fetch("/api/final-standings-ready")
      .then((r) => (r.ok ? r.json() : { ready: false }))
      .then((d) => { if (!cancelled) setFinalReady(!!d.ready); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin, isScorer]);

  const links = isAdmin
    ? adminLinks
    : publicLinks.filter((l) => l.href !== "/final-standings" || finalReady);

  // Close the menu when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock background scroll while the menu is open, close on Esc / when resized to desktop
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  if (isScorer) return null;

  return (
    <nav className="relative bg-[#07091F] border-b-2 border-[#1B6FC8]/40 overflow-hidden">
      <div className="absolute w-52 h-52 rounded-full border border-[#1B6FC8]/15 -top-32 -left-16 pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-[#38B6E8]/[0.06] -bottom-24 right-10 pointer-events-none" />
      <div className="absolute w-16 h-16 rounded-full bg-[#F5C518]/10 top-2 right-1/4 pointer-events-none hidden md:block" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-7 flex items-center justify-between gap-6">
        {/* Brand: inline on mobile, pinned left on desktop */}
        <div className="min-w-0">
          <Brand />
        </div>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center justify-end gap-6 xl:gap-8">
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
                      ? "flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-[#F5C518]"
                      : "flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-[#7A9CC8] group-hover:text-white transition-colors"
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
          {!isAdmin && (
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-2 py-1"
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-[#7A9CC8] group-hover:text-white transition-colors">
                Knockout Tree
              </span>
              <span className="h-[3px] w-6 rounded-full bg-transparent group-hover:bg-[#1B6FC8]/50 transition-colors" />
            </a>
          )}
        </div>

        {/* Burger button (mobile) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="lg:hidden shrink-0 w-11 h-11 flex flex-col items-center justify-center gap-[5px] rounded-full border border-[#1B6FC8]/40 hover:border-[#F5C518] transition-colors"
        >
          <span className="block w-5 h-0.5 rounded-full bg-white" />
          <span className="block w-5 h-0.5 rounded-full bg-white" />
          <span className="block w-5 h-0.5 rounded-full bg-white" />
        </button>
      </div>

      {/* Full-screen mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className="lg:hidden fixed inset-0 z-50 bg-[#07091F] flex flex-col overflow-y-auto overscroll-contain"
        >
          <div className="absolute w-72 h-72 rounded-full border border-[#1B6FC8]/15 -top-40 -left-24 pointer-events-none" />
          <div className="absolute w-56 h-56 rounded-full bg-[#38B6E8]/[0.06] -bottom-24 -right-16 pointer-events-none" />
          <div className="absolute w-20 h-20 rounded-full bg-[#F5C518]/10 bottom-1/4 left-8 pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4 px-4 py-4 border-b-2 border-[#1B6FC8]/40">
            <Brand onClick={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full border border-[#1B6FC8]/40 hover:border-[#F5C518] transition-colors"
            >
              <span className="relative block w-5 h-5">
                <span className="absolute left-0 top-1/2 w-5 h-0.5 -translate-y-1/2 rotate-45 rounded-full bg-white" />
                <span className="absolute left-0 top-1/2 w-5 h-0.5 -translate-y-1/2 -rotate-45 rounded-full bg-white" />
              </span>
            </button>
          </div>

          <div className="relative flex-1 flex flex-col justify-center gap-2 px-8 py-10">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={
                    active
                      ? "flex items-center gap-3 py-3 text-3xl font-black uppercase tracking-wide text-[#F5C518]"
                      : "flex items-center gap-3 py-3 text-3xl font-black uppercase tracking-wide text-[#7A9CC8] hover:text-white transition-colors"
                  }
                >
                  {l.live && <span className="w-2.5 h-2.5 rounded-full bg-[#2DB87A] live-dot" />}
                  {l.label}
                </Link>
              );
            })}
            {!isAdmin && (
              <a
                href={SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 py-3 text-3xl font-black uppercase tracking-wide text-[#7A9CC8] hover:text-white transition-colors"
              >
                Knockout Tree
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
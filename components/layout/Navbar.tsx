"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; live?: boolean };

const publicLinks: NavLink[] = [
  { href: "/",           label: "Home"       },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/standings",  label: "Standings"  },
  { href: "/teams",      label: "Teams"      },
  { href: "/bracket",    label: "Bracket"    },
];
const adminLinks: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard"    },
  { href: "/scorer",   label: "Live Scoring", live: true },
  { href: "/admin/fixtures",  label: "Fixtures"     },
  { href: "/admin/teams",     label: "Teams"        },
  { href: "/admin/bracket",   label: "Bracket"      },
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");
  const isScorer = pathname.startsWith("/scorer");
  const links    = isAdmin ? adminLinks : publicLinks;

  // The scorer area has its own minimal top bar (see app/scorer/layout.tsx)
  // — stacking the full public nav on top of it doesn't make sense for a
  // scorer-only login, so this bar just steps aside there.
  if (isScorer) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#07091F] border-b-2 border-[#1B6FC8]">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B6FC8] to-[#38B6E8] border-2 border-[#F5C518] flex items-center justify-center text-white text-xs font-black">WP</div>
          <div className="hidden sm:block">
            <div className="text-white text-sm font-black uppercase tracking-wide leading-tight">SACS Junior Water Polo</div>
            <div className="text-[#38B6E8] text-[9px] font-bold uppercase tracking-widest">Tournament 2025</div>
          </div>
        </Link>
        <div className="flex flex-1 h-14 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-1.5 px-3 h-full text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition-colors ${active?"text-[#F5C518] border-[#F5C518]":"text-[#7A9CC8] border-transparent hover:text-white hover:border-[#38B6E8]"}`}>
                {l.live && <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />}
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isAdmin && (
            <Link href="/scorer"
              className="text-[9px] font-bold uppercase tracking-widest text-[#2DB87A] border border-[#2DB87A]/40 px-3 py-1.5 hover:bg-[#2DB87A]/10 transition-colors">
              Scorer
            </Link>
          )}
          <Link href={isAdmin?"/":"/admin/dashboard"}
            className="text-[9px] font-bold uppercase tracking-widest text-[#7A9CC8] border border-[#1B3A6E] px-3 py-1.5 hover:border-[#38B6E8] hover:text-white transition-colors">
            {isAdmin?"← Public":"Admin"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
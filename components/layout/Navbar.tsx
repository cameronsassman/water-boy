"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const publicLinks = [
  { href: "/",           label: "Home"       },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/standings",  label: "Standings"  },
  { href: "/teams",      label: "Teams"      },
  { href: "/bracket",    label: "Bracket"    },
];
const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard"    },
  { href: "/admin/scoring",   label: "Live Scoring", live: true },
  { href: "/admin/fixtures",  label: "Fixtures"     },
  { href: "/admin/teams",     label: "Teams"        },
  { href: "/admin/bracket",   label: "Bracket"      },
];

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith("/admin");
  const links    = isAdmin ? adminLinks : publicLinks;
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
                {"live" in l && l.live && <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />}
                {l.label}
              </Link>
            );
          })}
        </div>
        <Link href={isAdmin?"/":"/admin/dashboard"}
          className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-[#7A9CC8] border border-[#1B3A6E] px-3 py-1.5 hover:border-[#38B6E8] hover:text-white transition-colors">
          {isAdmin?"← Public":"Admin"}
        </Link>
      </div>
    </nav>
  );
}

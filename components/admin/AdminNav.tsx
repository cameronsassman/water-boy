// components/admin/AdminNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin",             label: "Dashboard" },
  { href: "/admin/fixtures",    label: "Fixtures" },
  { href: "/admin/teams",       label: "Teams" },
  { href: "/admin/groups",      label: "Groups & Pools" },
  { href: "/admin/corrections", label: "Corrections" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="bg-[#0A0F2E] border-b border-[#1B3A6E] px-2 sm:px-4 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {NAV_ITEMS.map(({ href, label }) => {
          // Exact match for the dashboard root; prefix match for everything else,
          // so /admin/fixtures/123 still highlights "Fixtures".
          const isActive = href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 sm:px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-colors ${
                isActive
                  ? "text-white border-[#1B6FC8]"
                  : "text-[#7A9CC8] border-transparent hover:text-white hover:border-[#1B3A6E]"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <Link
          href="/scorer"
          className="ml-auto px-3 sm:px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap text-[#2DB87A] hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2DB87A]" />
          Scorer
        </Link>
      </div>
    </div>
  );
}
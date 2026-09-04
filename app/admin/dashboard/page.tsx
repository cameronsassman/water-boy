"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Match = { id: string; status: string; home_score: number; away_score: number; match_time: string; day: number; home_team: { name: string }|null; away_team: { name: string }|null; groups: { name: string }|null; pools: { name: string }|null; };
type Standing = { team_id: string; team_name: string; group_id: string; group_name: string; played: number; won: number; goal_diff: number; points: number; rank: number; };

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

export default function AdminDashboard() {
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("matches").select(SELECT).order("day").order("match_time"),
      supabase.from("group_standings").select("*").eq("group_name","Group A").order("rank"),
    ]).then(([{ data: m }, { data: s }]) => {
      setMatches((m as Match[]) ?? []);
      setStandings((s as Standing[]) ?? []);
      setLoading(false);
    });
  }, []);

  const live    = matches.filter((m) => m.status === "live");
  const done    = matches.filter((m) => m.status === "completed");
  const today   = matches.filter((m) => m.day === 2);
  const upcoming = today.filter((m) => m.status === "scheduled");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] border-b border-[#1B3A6E] px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-white font-black uppercase text-lg tracking-wide">Admin Dashboard</div>
          <div className="text-[#7A9CC8] text-xs">SACS Junior Water Polo Tournament 2025</div>
        </div>
        <Link href="/scorer" className="flex items-center gap-2 bg-[#2DB87A]/20 border border-[#2DB87A] text-[#2DB87A] text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-[#2DB87A]/30 transition-colors">
          <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />Open scorer
        </Link>
      </div>

      {live.length > 0 && (
        <Link href="/scorer" className="flex items-center gap-3 bg-blue-50 border-b border-[#1B6FC8]/30 px-6 py-3 hover:bg-blue-100 transition-colors">
          <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />
          <span className="text-sm text-[#1B6FC8] font-medium">{live.length} match{live.length > 1 ? "es" : ""} currently live — tap to score</span>
          <span className="ml-auto text-[#1B6FC8] font-bold">→</span>
        </Link>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { v: done.length,     l: "Completed",  sub: `${today.length} today`,     c: "text-gray-900" },
            { v: live.length,     l: "Live now",    sub: "in progress",               c: "text-[#2DB87A]" },
            { v: upcoming.length, l: "Upcoming",    sub: "today",                     c: "text-gray-900" },
            { v: matches.length,  l: "Total",       sub: "all matches",               c: "text-gray-900" },
          ].map(({ v, l, sub, c }) => (
            <div key={l} className="bg-white border border-gray-200 p-4">
              <div className={`font-black text-3xl leading-none ${c}`}>{v}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{l}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's fixtures */}
          <div className="lg:col-span-2 bg-white border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-black uppercase text-sm text-gray-900 tracking-wide">Today&apos;s Fixtures</span>
              <Link href="/admin/fixtures" className="text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] border border-[#1B6FC8]/30 px-3 py-1 hover:bg-blue-50">Manage →</Link>
            </div>
            {loading
              ? <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading...</div>
              : today.length === 0
                ? <div className="px-4 py-8 text-center text-gray-400 text-sm">No matches today</div>
                : <div className="divide-y divide-gray-100">
                    {today.map((m) => {
                      const isLive = m.status === "live";
                      const isDone = m.status === "completed";
                      return (
                        <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isLive ? "bg-blue-50 border-l-4 border-l-[#1B6FC8]" : ""}`}>
                          <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm uppercase truncate ${isLive ? "text-[#1B6FC8]" : "text-gray-900"}`}>{m.home_team?.name} <span className="text-gray-400 font-normal">vs</span> {m.away_team?.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase">{m.pools?.name} · {m.groups?.name}</div>
                          </div>
                          {m.status !== "scheduled" && <span className={`font-black text-sm ${isLive ? "text-[#1B6FC8]" : "text-gray-600"}`}>{m.home_score}–{m.away_score}</span>}
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 shrink-0 ${isLive ? "bg-[#2DB87A] text-white" : isDone ? "bg-gray-100 text-gray-400" : "border border-gray-200 text-gray-400"}`}>
                            {isLive ? "Live" : isDone ? "FT" : m.match_time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
            }
          </div>

          {/* Right col */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200"><span className="font-black uppercase text-sm text-gray-900">Quick Actions</span></div>
              <div className="p-3 space-y-2">
                {[
                  { href: "/scorer",  label: "Live Scorer",    icon: "⚡", primary: true },
                  { href: "/admin/fixtures", label: "Fixtures",       icon: "📋" },
                  { href: "/admin/bracket",  label: "Bracket",        icon: "🏆" },
                  { href: "/admin/teams",    label: "Teams & Players",icon: "👥" },
                  { href: "/admin/corrections", label: "Score Corrections", icon: "🛠" },
                ].map(({ href, label, icon, primary }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${primary ? "bg-[#1B6FC8] text-white hover:bg-[#0D4A8A]" : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#1B6FC8] hover:text-[#1B6FC8]"}`}>
                    <span>{icon}</span>{label}<span className="ml-auto">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Group A standings */}
            <div className="bg-white border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200"><span className="font-black uppercase text-sm text-gray-900">Group A</span></div>
              {standings.length === 0
                ? <div className="px-4 py-4 text-center text-gray-400 text-xs">No matches played yet</div>
                : standings.map((row) => {
                  const isCup = row.rank <= 4;
                  return (
                    <div key={row.team_id} className={`flex items-center gap-2 px-4 py-2 border-b border-gray-100 last:border-0 ${!isCup ? "opacity-40" : ""}`}>
                      <span className={`inline-flex w-5 h-5 items-center justify-center text-[10px] font-black shrink-0 ${isCup ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>{row.rank}</span>
                      <span className="flex-1 font-bold uppercase text-xs text-gray-900 truncate">{row.team_name}</span>
                      <span className="text-xs text-gray-400">{row.goal_diff > 0 ? "+" : ""}{row.goal_diff}</span>
                      <span className={`text-xs font-black w-8 text-right ${isCup ? "text-[#1B6FC8]" : "text-gray-400"}`}>{row.points}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
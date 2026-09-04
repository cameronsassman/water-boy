"use client";
import { useState } from "react";
import Link from "next/link";

type Team = { id: string; name: string; short_code: string; coach: string; group_id: string; logo_url: string | null; groups: { name: string; pools: { name: string } | null } | null };
type Standing = { team_id: string; team_name: string; group_id: string; played: number; won: number; goals_for: number; goals_against: number; goal_diff: number; points: number; rank: number };
type PlayerStat = { player_id: string; player_name: string; cap_number: number; position: string; team_id: string; goals: number; kickouts: number; yellow_cards: number; red_cards: number };

interface Props {
  teams: Team[];
  standings: Standing[];
  stats: PlayerStat[];
}

export default function TeamsClient({ teams, standings, stats }: Props) {
  const [activeGroup, setActiveGroup] = useState("all");

  const groups = [...new Set(teams.map((t) => t.groups?.name).filter(Boolean))].sort() as string[];
  const filtered = activeGroup === "all" ? teams : teams.filter((t) => t.groups?.name === activeGroup);
  const topScorers = stats.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">32 Teams · 4 Groups</div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Teams</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Profiles · Player stats · Standings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#F5C518] shrink-0" />
            <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">Top Scorers</h2>
          </div>
          {topScorers.length === 0
            ? <div className="text-sm text-gray-400">No goals scored yet</div>
            : <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {topScorers.map((s, i) => (
                  <div key={s.player_id} className="flex items-center gap-3 py-1">
                    <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                      i === 0 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                      i === 1 ? "bg-gray-100 text-gray-700 border-gray-300" :
                      i === 2 ? "bg-orange-100 text-orange-800 border-orange-200" :
                      "bg-blue-100 text-blue-800 border-blue-200"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase text-xs text-gray-900 truncate">{s.player_name}</div>
                      <div className="text-[10px] text-gray-400 uppercase truncate">{teams.find((t) => t.id === s.team_id)?.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg text-[#1B6FC8] leading-none">{s.goals}</div>
                      <div className="text-[9px] text-gray-400 uppercase">goals</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="border-b-2 border-gray-200 flex overflow-x-auto">
          {["all", ...groups].map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 whitespace-nowrap transition-colors ${activeGroup === g ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              {g === "all" ? "All Groups" : g}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Team cards — badge is the main piece of the card, links to a dedicated team page */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((team) => {
            const standing = standings.find((s) => s.team_id === team.id);
            const isCup = (standing?.rank ?? 99) <= 4;
            return (
              <Link key={team.id} href={`/teams/${team.short_code}`}
                className="relative aspect-square rounded-2xl border border-gray-200 hover:border-[#1B6FC8] bg-white overflow-hidden text-left transition-colors block">
                {team.groups?.name && (
                  <span className="absolute top-2 right-2 z-10 bg-[#F5C518] text-[#07091F] text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                    {team.groups.name}
                  </span>
                )}
                <div className="w-full h-full flex items-center justify-center p-4">
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md" />
                    : <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-md ${isCup ? "bg-[#1B6FC8]" : "bg-gray-400"}`}>
                        {team.short_code}
                      </div>
                  }
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 border-t border-gray-100">
                  <div className="font-black uppercase text-xs text-gray-900 truncate">{team.name}</div>
                  <div className="text-[10px] text-gray-400 uppercase truncate">Coach: {team.coach || "—"}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
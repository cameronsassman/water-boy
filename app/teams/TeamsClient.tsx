"use client";
import { useState } from "react";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  short_code: string;
  coach: string;
  group_id: string;
  logo_url: string | null;
  groups: { name: string; pools: { name: string } | null } | null;
};

type Standing = {
  team_id: string;
  team_name: string;
  group_id: string;
  played: number;
  won: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  rank: number;
};

type PlayerStat = {
  player_id: string;
  player_name: string;
  cap_number: number;
  position: string;
  team_id: string;
  goals: number;
  kickouts: number;
  yellow_cards: number;
  red_cards: number;
};

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
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Top Scorers Spotlight */}
        <div className="rounded-2xl border border-[#CFE6F8] bg-white shadow-sm overflow-hidden">
          <div className="bg-[#07091F] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shrink-0" />
              <h2 className="font-black uppercase text-xs sm:text-sm tracking-wider text-white">
                Tournament Top Scorers
              </h2>
            </div>
            <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
              Top 5 Leaders
            </span>
          </div>

          <div className="p-5">
            {topScorers.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">No goals scored yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {topScorers.map((s, i) => (
                  <div
                    key={s.player_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F3FAFF] border border-[#CFE6F8]"
                  >
                    <span
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                        i === 0
                          ? "bg-[#F5C518] text-[#07091F]"
                          : i === 1
                          ? "bg-[#1B6FC8] text-white"
                          : i === 2
                          ? "bg-[#38B6E8] text-white"
                          : "bg-white text-gray-700 border border-[#CFE6F8]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase text-xs text-gray-900 truncate">
                        {s.player_name}
                      </div>
                      <div className="text-[10px] text-[#5C7B9C] uppercase truncate font-semibold">
                        {teams.find((t) => t.id === s.team_id)?.name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg text-[#1B6FC8] leading-none">
                        {s.goals}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase font-semibold">goals</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["all", ...groups].map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeGroup === g
                  ? "bg-[#07091F] text-white shadow-sm"
                  : "bg-white border border-[#CFE6F8] text-[#5C7B9C] hover:text-[#07091F] hover:border-[#1B6FC8]"
              }`}
            >
              {g === "all" ? "All Groups" : g}
            </button>
          ))}
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((team) => {
            const standing = standings.find((s) => s.team_id === team.id);
            const isCup = (standing?.rank ?? 99) <= 4;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.short_code}`}
                className="group relative rounded-2xl border border-[#CFE6F8] hover:border-[#1B6FC8] bg-white overflow-hidden text-left transition-all hover:shadow-md flex flex-col justify-between"
              >
                {team.groups?.name && (
                  <span className="absolute top-3 right-3 z-10 bg-[#F5C518] text-[#07091F] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    {team.groups.name}
                  </span>
                )}

                <div className="w-full flex items-center justify-center p-6 sm:p-7 min-h-[160px]">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-sm group-hover:scale-105 transition-transform ${
                        isCup ? "bg-[#1B6FC8]" : "bg-[#07091F]"
                      }`}
                    >
                      {team.short_code}
                    </div>
                  )}
                </div>

                <div className="bg-[#F3FAFF] px-4 py-3 border-t border-[#CFE6F8] group-hover:bg-[#EAF6FE] transition-colors">
                  <div className="font-black uppercase text-xs text-gray-900 truncate">
                    {team.name}
                  </div>
                  <div className="text-[10px] text-[#5C7B9C] uppercase truncate font-medium mt-0.5">
                    Coach: {team.coach || "—"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Bubble({ className = "" }: { className?: string }) {
  return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
}

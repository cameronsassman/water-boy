"use client";
import { useState } from "react";
import Link from "next/link";

type Group = { id: string; name: string; pool_id: string };
type Pool = { id: string; name: string };
type Standing = {
  team_id: string; team_name: string; group_id: string; rank: number;
  played: number; won: number; drawn: number; lost: number;
  goals_for: number; goals_against: number; goal_diff: number; points: number;
};

interface Props { standings: Standing[]; groups: Group[]; pools: Pool[]; }

export default function StandingsClient({ standings, groups, pools }: Props) {
  const [active, setActive] = useState("overview");
  const allComplete = standings.length > 0 && standings.every((s) => s.played > 0);
  const tabs = [{ id: "overview", label: "Overview" }, ...groups.map((g) => ({ id: g.id, label: g.name }))];

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">Group Stage · Live updated</div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Standings</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Top 4 per group → Cup · Rest → Festival</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {allComplete && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#2DB87A] shrink-0" />
              <div>
                <div className="font-black text-gray-900 text-sm uppercase">Group Stage Complete</div>
                <div className="text-gray-500 text-xs mt-0.5">All group matches played · top 4 advance to Cup, rest to Festival</div>
              </div>
            </div>
            <Link href="/bracket" className="shrink-0 bg-[#1B6FC8] hover:bg-[#0D4A8A] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-colors">View Bracket →</Link>
          </div>
        )}

        {/* Mobile: dropdown instead of tabs */}
        <select value={active} onChange={(e) => setActive(e.target.value)}
          className="sm:hidden w-full mb-4 border border-gray-200 px-4 py-3 font-bold text-xs uppercase text-gray-700 bg-white">
          {tabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        {/* Desktop: underline tab row, matching the rest of the site */}
        <div className="hidden sm:flex border-b-2 border-gray-200 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${active === t.id ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {active === "overview"
          ? <OverviewGrid groups={groups} pools={pools} standings={standings} />
          : <GroupTable group={groups.find((g) => g.id === active)} pools={pools} standings={standings.filter((s) => s.group_id === active)} />
        }
      </div>
    </div>
  );
}

function OverviewGrid({ groups, pools, standings }: { groups: Group[]; pools: Pool[]; standings: Standing[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {groups.map((g) => {
        const rows = standings.filter((s) => s.group_id === g.id).sort((a, b) => a.rank - b.rank);
        const pool = pools.find((p) => p.id === g.pool_id);
        const hasResults = rows.some((r) => r.played > 0);
        return (
          <div key={g.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="bg-[#07091F] px-4 py-3 flex items-center justify-between">
              <span className="text-white font-black uppercase text-sm tracking-wider">{g.name}</span>
              <span className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-widest">{rows.length} teams · {pool?.name}</span>
            </div>
            <div className="p-3 space-y-2">
              {rows.length === 0
                ? <div className="text-center py-6 text-gray-400 text-sm">No teams yet</div>
                : rows.slice(0, 4).map((row, idx) => (
                    <div key={row.team_id} className="flex items-center gap-3 px-3 py-2 border border-gray-100">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${idx < 4 && hasResults ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>{idx + 1}</span>
                      <span className="flex-1 truncate text-sm font-bold uppercase text-gray-900">{row.team_name}</span>
                      <span className="font-black text-[#1B6FC8] text-sm shrink-0">{row.points} pts</span>
                    </div>
                  ))
              }
              {rows.length > 4 && <div className="text-center text-[10px] text-gray-400 pt-1">+{rows.length - 4} more teams</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupTable({ group, pools, standings }: { group?: Group; pools: Pool[]; standings: Standing[] }) {
  if (!group) return null;
  const pool = pools.find((p) => p.id === group.pool_id);
  const hasResults = standings.some((s) => s.played > 0);
  const rows = [...standings].sort((a, b) => a.rank - b.rank);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="bg-[#07091F] px-4 py-3 flex items-center justify-between">
        <span className="text-white font-black uppercase text-sm tracking-wider">{group.name}</span>
        <span className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-widest">{pool?.name}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] whitespace-nowrap ${i === 1 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0
              ? <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">No teams allocated to this group yet</td></tr>
              : rows.map((row, idx) => {
                const isCup = idx < 4;
                return (
                  <tr key={row.team_id} className={isCup && hasResults ? "bg-green-50/60 hover:bg-green-100/60" : "hover:bg-gray-50"}>
                    <td className="px-3 py-2.5"><span className={`inline-flex w-6 h-6 items-center justify-center text-[10px] font-black rounded-full ${isCup && hasResults ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>{idx + 1}</span></td>
                    <td className="px-3 py-2.5 font-bold uppercase text-xs text-gray-900">{row.team_name}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.played}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.won}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.drawn}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.lost}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.goals_for}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500">{row.goals_against}</td>
                    <td className={`px-3 py-2.5 text-right text-xs font-bold ${row.goal_diff > 0 ? "text-[#2DB87A]" : row.goal_diff < 0 ? "text-red-500" : "text-gray-400"}`}>{row.goal_diff > 0 ? "+" : ""}{row.goal_diff}</td>
                    <td className={`px-3 py-2.5 text-right text-xs font-black ${isCup && hasResults ? "text-[#1B6FC8]" : "text-gray-400"}`}>{row.points}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="inline-flex w-4 h-4 bg-[#1B6FC8] text-white items-center justify-center text-[9px] font-black rounded-full">1</span>Cup</span>
        <span className="flex items-center gap-1"><span className="inline-flex w-4 h-4 bg-gray-100 text-gray-400 items-center justify-center text-[9px] font-black rounded-full">5</span>Festival</span>
      </div>
    </div>
  );
}
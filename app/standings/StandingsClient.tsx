"use client";
import { useState } from "react";
import Link from "next/link";

type Group = { id: string; name: string; pool_id: string };
type Pool = { id: string; name: string };
type Standing = {
  team_id: string;
  team_name: string;
  group_id: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
};

interface Props {
  standings: Standing[];
  groups: Group[];
  pools: Pool[];
}

export default function StandingsClient({ standings, groups, pools }: Props) {
  const [active, setActive] = useState("overview");
  const allComplete = standings.length > 0 && standings.every((s) => s.played > 0);
  const tabs = [
    { id: "overview", label: "Overview" },
    ...groups.map((g) => ({ id: g.id, label: g.name })),
  ];

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">


        {/* Group Stage Status Notification */}
        {allComplete && (
          <div className="rounded-2xl border border-[#CFE6F8] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#2DB87A] shrink-0" />
              <div>
                <div className="font-black text-[#07091F] text-sm uppercase tracking-wide">
                  Group Stage Complete
                </div>
                <div className="text-[#5C7B9C] text-xs mt-0.5">
                  All group matches played · Top 4 advance to Cup, rest to Festival
                </div>
              </div>
            </div>
            <Link
              href="/bracket"
              className="shrink-0 bg-[#07091F] hover:bg-[#1B6FC8] text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-5 py-2.5 transition-colors shadow-sm"
            >
              View Bracket →
            </Link>
          </div>
        )}

        {/* Group Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                active === t.id
                  ? "bg-[#07091F] text-white shadow-sm"
                  : "bg-white border border-[#CFE6F8] text-[#5C7B9C] hover:text-[#07091F] hover:border-[#1B6FC8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content View */}
        {active === "overview" ? (
          <OverviewGrid groups={groups} pools={pools} standings={standings} />
        ) : (
          <GroupTable
            group={groups.find((g) => g.id === active)}
            pools={pools}
            standings={standings.filter((s) => s.group_id === active)}
          />
        )}
      </div>
    </div>
  );
}

function OverviewGrid({
  groups,
  pools,
  standings,
}: {
  groups: Group[];
  pools: Pool[];
  standings: Standing[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {groups.map((g) => {
        const rows = standings.filter((s) => s.group_id === g.id).sort((a, b) => a.rank - b.rank);
        const pool = pools.find((p) => p.id === g.pool_id);
        const hasResults = rows.some((r) => r.played > 0);
        return (
          <div
            key={g.id}
            className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden shadow-sm"
          >
            <div className="bg-[#07091F] px-5 py-3.5 flex items-center justify-between">
              <span className="text-white font-black uppercase text-sm tracking-wider">
                {g.name}
              </span>
              <span className="text-[#38B6E8] text-[10px] font-bold uppercase tracking-widest">
                {rows.length} teams · {pool?.name ?? "Main Pool"}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {rows.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No teams yet</div>
              ) : (
                rows.slice(0, 4).map((row, idx) => (
                  <div
                    key={row.team_id}
                    className="flex items-center gap-3 rounded-xl border border-[#CFE6F8] bg-[#F3FAFF] px-3.5 py-2.5"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        idx < 4 && hasResults
                          ? "bg-[#1B6FC8] text-white"
                          : "bg-white text-gray-400 border border-[#CFE6F8]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-xs font-bold uppercase text-gray-900">
                      {row.team_name}
                    </span>
                    <span className="font-black text-[#1B6FC8] text-sm shrink-0">
                      {row.points} <span className="text-[10px] text-gray-400 font-semibold">pts</span>
                    </span>
                  </div>
                ))
              )}
              {rows.length > 4 && (
                <div className="text-center text-[10px] font-bold uppercase tracking-wider text-[#5C7B9C] pt-1">
                  +{rows.length - 4} more teams in group
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupTable({
  group,
  pools,
  standings,
}: {
  group?: Group;
  pools: Pool[];
  standings: Standing[];
}) {
  if (!group) return null;
  const pool = pools.find((p) => p.id === group.pool_id);
  const hasResults = standings.some((s) => s.played > 0);
  const rows = [...standings].sort((a, b) => a.rank - b.rank);

  return (
    <div className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden shadow-sm">
      <div className="bg-[#07091F] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shrink-0" />
          <span className="text-white font-black uppercase text-sm tracking-wider">{group.name}</span>
        </div>
        <span className="text-[#38B6E8] text-[10px] font-bold uppercase tracking-widest">
          {pool?.name ?? "Main Pool"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F3FAFF] border-b border-[#CFE6F8]">
              {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C] whitespace-nowrap ${
                    i === 1 ? "text-left" : "text-right"
                  } ${i === 0 ? "w-12 text-left" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAF6FE]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No teams allocated to this group yet
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isCup = idx < 4;
                return (
                  <tr
                    key={row.team_id}
                    className={`transition-colors ${
                      isCup && hasResults
                        ? "bg-[#F3FAFF]/60 hover:bg-[#EAF6FE]"
                        : "hover:bg-[#F8FCFF]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center text-[10px] font-black rounded-full ${
                          isCup && hasResults
                            ? "bg-[#1B6FC8] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold uppercase text-xs text-gray-900">
                      {row.team_name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">{row.played}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">{row.won}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">{row.drawn}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">{row.lost}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">
                      {row.goals_for}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 font-medium">
                      {row.goals_against}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs font-bold ${
                        row.goal_diff > 0
                          ? "text-[#2DB87A]"
                          : row.goal_diff < 0
                            ? "text-red-500"
                            : "text-gray-400"
                      }`}
                    >
                      {row.goal_diff > 0 ? "+" : ""}
                      {row.goal_diff}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-xs font-black ${
                        isCup && hasResults ? "text-[#1B6FC8]" : "text-gray-400"
                      }`}
                    >
                      {row.points}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3.5 border-t border-[#CFE6F8] bg-[#F3FAFF]/40 flex gap-5 text-[10px] text-[#5C7B9C] font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex w-4 h-4 bg-[#1B6FC8] text-white items-center justify-center text-[9px] font-black rounded-full">
            1
          </span>
          Cup Qualification (Top 4)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex w-4 h-4 bg-gray-200 text-gray-500 items-center justify-center text-[9px] font-black rounded-full">
            5
          </span>
          Festival Section
        </span>
      </div>
    </div>
  );
}

function Bubble({ className = "" }: { className?: string }) {
  return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
}

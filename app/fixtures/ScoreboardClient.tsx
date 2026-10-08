"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export type Match = {
  id: string;
  status: string;
  home_score: number;
  away_score: number;
  current_half: number | null;
  match_time: string;
  day: number;
  stage: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  groups: { name: string } | null;
  pools: { name: string } | null;
};

const STAGE_INFO: Record<string, { label: string; color: string; bg: string }> = {
  group: { label: "Group", color: "text-[#1B6FC8]", bg: "bg-[#EAF6FE]" },
  cup_r16: { label: "Cup R16", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  cup_qf: { label: "Cup QF", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  cup_sf: { label: "Cup SF", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  cup_final: { label: "Cup Final", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  shield_qf: { label: "Shield QF", color: "text-[#6B3FA0]", bg: "bg-[#F3EBFA]" },
  shield_sf: { label: "Shield SF", color: "text-[#6B3FA0]", bg: "bg-[#F3EBFA]" },
  shield_final: { label: "Shield Final", color: "text-[#6B3FA0]", bg: "bg-[#F3EBFA]" },
  plate_sf: { label: "Plate SF", color: "text-[#1B6FC8]", bg: "bg-[#EAF6FE]" },
  plate_final: { label: "Plate Final", color: "text-[#1B6FC8]", bg: "bg-[#EAF6FE]" },
  festival: { label: "Festival", color: "text-[#B45C1F]", bg: "bg-[#FCEEE3]" },
  playoff_r1: { label: "Playoff R1", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  playoff_15_16: { label: "15th/16th Playoff", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  playoff_13_14: { label: "13th/14th Playoff", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
  shield_third: { label: "Shield 3rd/4th", color: "text-[#6B3FA0]", bg: "bg-[#F3EBFA]" },
  plate_third: { label: "Plate 3rd/4th", color: "text-[#1B6FC8]", bg: "bg-[#EAF6FE]" },
  cup_third: { label: "Cup 3rd/4th", color: "text-[#8A6D00]", bg: "bg-[#FDF6DC]" },
};

function stageInfo(stage: string) {
  return STAGE_INFO[stage] ?? STAGE_INFO.group;
}

const UNASSIGNED = "Unassigned";

interface Props {
  initialMatches: Match[];
  initialDay: number;
}

export default function ScoreboardClient({ initialMatches, initialDay }: Props) {
  const [activeDay, setActiveDay] = useState(initialDay);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);

  const fetchDay = useCallback(
    async (day: number, showLoading: boolean, signal?: AbortSignal) => {
      if (showLoading) setLoading(true);
      try {
        const res = await fetch(`/api/fixtures?day=${day}`, { signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        setMatches((await res.json()) ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("fetchDay failed:", err);
      }
      if (showLoading) setLoading(false);
    },
    []
  );

  // First run: the server already rendered initialDay, so skip the fetch.
  // After that: fetch on day change, then poll every 5s while the tab is visible.
  // Cleanup aborts in-flight requests so a stale day can't overwrite the new one.
  const isFirstRender = useRef(true);
  useEffect(() => {
    const ctrl = new AbortController();
    if (isFirstRender.current) isFirstRender.current = false;
    else fetchDay(activeDay, true, ctrl.signal);

    const id = setInterval(() => {
      if (!document.hidden) fetchDay(activeDay, false, ctrl.signal);
    }, 5000);

    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [activeDay, fetchDay]);

  const selectDay = (d: number) => {
    setActiveDay(d);
    window.history.replaceState(null, "", `/fixtures/${d}`);
  };

  const poolKey = (m: Match) => m.pools?.name ?? UNASSIGNED;

  // Aquatic Center first, then High School, then everything else, Unassigned last.
  const poolRank = (name: string) => {
    const n = name.toLowerCase();
    if (name === UNASSIGNED) return 3;
    if (n.includes("aquatic")) return 0;
    if (n.includes("high school")) return 1;
    return 2;
  };
  const comparePools = (a: string, b: string) =>
    poolRank(a) - poolRank(b) || a.localeCompare(b, undefined, { numeric: true });

  // Desktop: pool sections built from whatever pool names exist.
  const poolNames = Array.from(new Set(matches.map(poolKey))).sort(comparePools);
  const poolSections = poolNames.map((label) => ({
    label,
    list: matches.filter((m) => poolKey(m) === label),
  }));

  // Mobile: group by kick-off time (24h "HH:mm"), Aquatic Center first within each slot.
  const timeSections = Array.from(new Set(matches.map((m) => m.match_time)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((time) => ({
      time,
      list: matches
        .filter((m) => m.match_time === time)
        .sort((a, b) => comparePools(poolKey(a), poolKey(b))),
    }));

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Day Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d}
              onClick={() => selectDay(d)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeDay === d
                  ? "bg-[#07091F] text-white shadow-sm"
                  : "bg-white border border-[#CFE6F8] text-[#5C7B9C] hover:text-[#07091F] hover:border-[#1B6FC8]"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>

        {/* Matches Section */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white border border-[#CFE6F8]" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-[#CFE6F8] bg-white py-16 text-center text-gray-400 text-sm shadow-sm">
              No matches scheduled for Day {activeDay}
            </div>
          ) : (
            <>
              {/* Mobile: grouped by time */}
              <div className="space-y-6 lg:hidden">
                {timeSections.map(({ time, list }) => (
                  <div key={time} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shrink-0" />
                        <h2 className="font-black uppercase text-base tracking-wide text-[#07091F]">
                          {time}
                        </h2>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5C7B9C]">
                        {list.length} {list.length === 1 ? "Match" : "Matches"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {list.map((m) => (
                        <MatchCard key={m.id} match={m} showPool />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: grouped by pool */}
              <div className="hidden lg:grid grid-cols-2 gap-8">
                {poolSections.map(({ label, list }) => (
                  <div key={label} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shrink-0" />
                        <h2 className="font-black uppercase text-base tracking-wide text-[#07091F]">
                          {label}
                        </h2>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5C7B9C]">
                        {list.length} {list.length === 1 ? "Match" : "Matches"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {list.map((m) => (
                        <MatchCard key={m.id} match={m} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match: m,
  showPool = false,
}: {
  match: Match;
  showPool?: boolean;
}) {
  const isLive = m.status === "live";
  const isDone = m.status === "completed";
  const isScheduled = m.status === "scheduled";
  const homeWon = isDone && m.home_score > m.away_score;
  const awayWon = isDone && m.away_score > m.home_score;
  const info = stageInfo(m.stage);

  return (
    <div
      className={`rounded-2xl bg-white border transition-all hover:shadow-md p-4 sm:p-5 ${
        isLive
          ? "border-[#1B6FC8] shadow-md ring-1 ring-[#1B6FC8]"
          : "border-[#CFE6F8] shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${info.color} ${info.bg}`}
        >
          {info.label}
        </span>
        {m.groups?.name && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-[#5C7B9C] bg-[#F3FAFF] border border-[#CFE6F8]/60">
            {m.groups.name}
          </span>
        )}
        {showPool && m.pools?.name && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-[#07091F] bg-[#F5C518]/30">
            {m.pools.name}
          </span>
        )}
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#E23744] text-white ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live · H{m.current_half ?? 1}
          </span>
        ) : isDone ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C] ml-auto">
            FT
          </span>
        ) : showPool ? null : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C] ml-auto">
            Starts {m.match_time}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex-1 min-w-0 text-left text-xs sm:text-sm font-bold uppercase truncate ${
            homeWon ? "text-[#008000]" : "text-gray-900"
          }`}
        >
          {m.home_team?.name}
        </span>
        <span
          className={`shrink-0 min-w-16 text-center rounded-full px-4 py-1.5 font-black text-sm tabular-nums ${
            isScheduled
              ? "bg-[#F3FAFF] text-[#5C7B9C] border border-[#CFE6F8]"
              : "bg-[#07091F] text-white shadow-sm"
          }`}
        >
          {isScheduled ? "VS" : `${m.home_score}–${m.away_score}`}
        </span>
        <span
          className={`flex-1 min-w-0 text-right text-xs sm:text-sm font-bold uppercase truncate ${
            awayWon ? "text-[#008000]" : "text-gray-900"
          }`}
        >
          {m.away_team?.name}
        </span>
      </div>
    </div>
  );
}
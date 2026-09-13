"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Match = {
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

const SELECT =
  "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

const STAGE_INFO: Record<string, { label: string; color: string; bg: string }> = {
  group: { label: "Group", color: "text-[#5C7B9C]", bg: "bg-[#F3FAFF]" },
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
};

function stageInfo(stage: string) {
  return STAGE_INFO[stage] ?? STAGE_INFO.group;
}

interface Props {
  initialMatches: Match[];
  initialDay: number;
}

export default function ScoreboardClient({ initialMatches, initialDay }: Props) {
  const [activeDay, setActiveDay] = useState(initialDay);
  const [matches, setMatches] = useState<Match[]>(initialMatches as Match[]);
  const [loading, setLoading] = useState(false);

  const fetchDay = useCallback(async (day: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(SELECT)
      .eq("day", day)
      .order("match_time");
    if (error) {
      console.error("fetchDay failed:", {
        day,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    setMatches((data as Match[]) ?? []);
    setLoading(false);
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchDay(activeDay);
  }, [activeDay, fetchDay]);

  useEffect(() => {
    const ch = supabase
      .channel("sb-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const updated = payload.new as Match;
          setMatches((prev) => {
            const idx = prev.findIndex((m) => m.id === updated.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...prev[idx], ...updated };
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const pool1 = matches.filter((m) => m.pools?.name === "Pool 1");
  const pool2 = matches.filter((m) => m.pools?.name === "Pool 2");
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white border-b border-[#CFE6F8]">
          <div className="max-w-6xl mx-auto flex">
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                  activeDay === d
                    ? "text-[#F5C518] border-[#F5C518]"
                    : "text-[#9FB6CC] border-transparent hover:text-[#1B6FC8]"
                }`}
              >
                Day {d}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-[#CFE6F8]" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              No matches for Day {activeDay}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: "Pool 1", list: pool1 },
                { label: "Pool 2", list: pool2 },
              ].map(({ label, list }) => (
                <div key={label}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 rounded-full bg-[#F5C518] shrink-0" />
                    <h2 className="font-black uppercase text-lg tracking-wide text-[#07091F]">
                      {label}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {list.length === 0 ? (
                      <div className="rounded-2xl border border-[#CFE6F8] bg-white px-4 py-8 text-center text-gray-400 text-sm">
                        No matches
                      </div>
                    ) : (
                      list.map((m) => <MatchCard key={m.id} match={m} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match: m }: { match: Match }) {
  const isLive = m.status === "live";
  const isDone = m.status === "completed";
  const isScheduled = m.status === "scheduled";
  const homeWon = isDone && m.home_score > m.away_score;
  const awayWon = isDone && m.away_score > m.home_score;
  const info = stageInfo(m.stage);

  return (
    <div
      className={`rounded-2xl bg-white border-2 px-5 py-4 transition-shadow hover:shadow-sm ${
        isLive ? "border-[#1B6FC8]" : "border-[#CFE6F8]"
      }`}
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${info.color} ${info.bg}`}
        >
          {info.label}
        </span>
        {m.groups?.name && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-[#5C7B9C] bg-[#F3FAFF]">
            {m.groups.name}
          </span>
        )}
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#E23744] text-white ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
            Live · H{m.current_half}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#9FB6CC] ml-auto">
            {isDone ? "FT" : m.match_time}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex-1 min-w-0 text-center text-xs font-bold uppercase truncate ${
            homeWon ? "text-[#2DB87A]" : "text-gray-900"
          }`}
        >
          {m.home_team?.name}
        </span>
        <span
          className={`shrink-0 min-w-16 text-center rounded-full px-4 py-1.5 font-black text-sm tabular-nums ${
            isScheduled ? "bg-[#F3FAFF] text-[#9FB6CC]" : "bg-[#07091F] text-white"
          }`}
        >
          {isScheduled ? "vs" : `${m.home_score}–${m.away_score}`}
        </span>
        <span
          className={`flex-1 min-w-0 text-center text-xs font-bold uppercase truncate ${
            awayWon ? "text-[#2DB87A]" : "text-gray-900"
          }`}
        >
          {m.away_team?.name}
        </span>
      </div>
    </div>
  );
}
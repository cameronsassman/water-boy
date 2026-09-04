"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Match = {
  id: string; status: string; home_score: number; away_score: number;
  current_half: number | null; match_time: string; day: number; stage: string;
  home_team: { name: string } | null; away_team: { name: string } | null;
  groups: { name: string } | null; pools: { name: string } | null;
};

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

// Stage family -> label + color, mirroring match-card.tsx's stage coding
// (cup/shield/plate/festival/group each get a distinct border+badge color).
const STAGE_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  group:        { label: "Group",       color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-300" },
  cup_r16:      { label: "Cup R16",     color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
  cup_qf:       { label: "Cup QF",      color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
  cup_sf:       { label: "Cup SF",      color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
  cup_final:    { label: "Cup Final",   color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-300" },
  shield_qf:    { label: "Shield QF",   color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
  shield_sf:    { label: "Shield SF",   color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
  shield_final: { label: "Shield Final",color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
  plate_sf:     { label: "Plate SF",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300" },
  plate_final:  { label: "Plate Final", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-300" },
  festival:     { label: "Festival",    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300" },
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
    const { data, error } = await supabase.from("matches").select(SELECT).eq("day", day).order("match_time");
    if (error) console.error("fetchDay failed:", { day, message: error.message, details: error.details, hint: error.hint });
    setMatches((data as Match[]) ?? []);
    setLoading(false);
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchDay(activeDay);
  }, [activeDay, fetchDay]);

  useEffect(() => {
    const ch = supabase.channel("sb-matches")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        const updated = payload.new as Match;
        setMatches((prev) => {
          const idx = prev.findIndex((m) => m.id === updated.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...prev[idx], ...updated };
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pool1 = matches.filter((m) => m.pools?.name === "Pool 1");
  const pool2 = matches.filter((m) => m.pools?.name === "Pool 2");
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-2 border-[#1B6FC8] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-white font-bold uppercase text-2xl">Scoreboard</h1>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 text-[#2DB87A] text-xs font-bold uppercase mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2DB87A] live-dot" />{liveCount} live now
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto flex">
          {[1, 2, 3, 4].map((d) => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase border-b-2 -mb-px transition-colors ${activeDay === d ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-600"}`}>
              Day {d}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 border border-gray-200" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">No matches for Day {activeDay}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[{ label: "Pool 1", list: pool1 }, { label: "Pool 2", list: pool2 }].map(({ label, list }) => (
              <div key={label}>
                <div className="text-xs font-bold uppercase text-gray-500 mb-3">{label}</div>
                <div className="space-y-4">
                  {list.length === 0
                    ? <div className="text-center text-gray-400 text-sm py-8 border border-gray-200">No matches</div>
                    : list.map((m) => <MatchCard key={m.id} match={m} />)
                  }
                </div>
              </div>
            ))}
          </div>
        )}
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
    <div className={`bg-white border-2 ${isLive ? "border-[#1B6FC8]" : info.border} p-4 hover:shadow-sm transition-shadow`}>
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${info.color} ${info.bg} ${info.border}`}>{info.label}</span>
        {m.groups?.name && <span className="text-[10px] font-bold uppercase px-2 py-0.5 border border-gray-200 text-gray-500">{m.groups.name}</span>}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-[#2DB87A] text-white ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />Live · H{m.current_half}
          </span>
        )}
        {!isLive && <span className="text-[10px] text-gray-400 ml-auto">{isDone ? "FT" : m.match_time}</span>}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 text-center">
          <div className={`font-medium text-sm leading-tight truncate ${homeWon ? "text-green-600 font-bold" : "text-gray-900"}`}>{m.home_team?.name}</div>
        </div>
        <div className={`px-3 py-1.5 mx-1 text-center flex-shrink-0 min-w-16 ${isDone ? "bg-gray-100" : isLive ? "bg-blue-50" : "bg-gray-50"}`}>
          {isScheduled
            ? <div className="text-gray-400 font-medium text-sm">vs</div>
            : <div className="font-bold text-base">
                <span className={homeWon ? "text-green-600" : awayWon ? "text-red-600" : "text-[#1B6FC8]"}>{m.home_score}</span>
                <span className="text-gray-400 mx-1">-</span>
                <span className={awayWon ? "text-green-600" : homeWon ? "text-red-600" : "text-[#1B6FC8]"}>{m.away_score}</span>
              </div>
          }
        </div>
        <div className="flex-1 min-w-0 text-center">
          <div className={`font-medium text-sm leading-tight truncate ${awayWon ? "text-green-600 font-bold" : "text-gray-900"}`}>{m.away_team?.name}</div>
        </div>
      </div>
    </div>
  );
}
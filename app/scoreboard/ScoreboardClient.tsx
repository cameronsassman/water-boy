"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Match = {
  id: string; status: string; home_score: number; away_score: number;
  current_half: number | null; match_time: string; day: number;
  half1_home: number; half1_away: number; half2_home: number; half2_away: number;
  home_team: { name: string } | null; away_team: { name: string } | null;
  groups: { name: string } | null; pools: { name: string } | null;
};

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

interface Props {
  initialMatches: Match[];
  initialDay: number;
}

export default function ScoreboardClient({ initialMatches, initialDay }: Props) {
  const [activeDay, setActiveDay] = useState(initialDay);
  // Seed with server data — no loading spinner on first render
  const [matches, setMatches] = useState<Match[]>(initialMatches as Match[]);
  const [loading, setLoading] = useState(false);

  const fetchDay = useCallback(async (day: number) => {
    setLoading(true);
    const { data } = await supabase.from("matches").select(SELECT).eq("day", day).order("match_time");
    setMatches((data as Match[]) ?? []);
    setLoading(false);
  }, []);

  // Only fetch on day tab change — not on initial mount (we already have server data)
  useEffect(() => {
    if (activeDay !== initialDay) {
      fetchDay(activeDay);
    }
  }, [activeDay, initialDay, fetchDay]);

  // Realtime: update individual match rows in-place
  useEffect(() => {
    const ch = supabase.channel("sb-matches")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        // Only apply update if it's for the currently viewed day
        const updated = payload.new as Match;
        setMatches((prev) => {
          const idx = prev.findIndex((m) => m.id === updated.id);
          if (idx === -1) return prev;
          // Merge — preserve joined fields (home_team etc) that aren't in the realtime payload
          const merged = { ...prev[idx], ...updated };
          const next = [...prev];
          next[idx] = merged;
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pool1 = matches.filter((m) => m.pools?.name === "Pool 1");
  const pool2 = matches.filter((m) => m.pools?.name === "Pool 2");
  const liveCount = matches.filter((m) => m.status === "live").length;
  const f1 = pool1.find((m) => m.status === "live") ?? pool1[0];
  const f2 = pool2.find((m) => m.status === "live") ?? pool2[0];

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-[#2DB87A] text-xs font-bold uppercase tracking-[3px] mb-2 min-h-5">
            {liveCount > 0 && <><span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />{liveCount} live now</>}
          </div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Scoreboard</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Live scores · Results · Day schedule</p>
        </div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex">
          {[1, 2, 3, 4].map((d) => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${activeDay === d ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              Day {d}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {loading ? (
          // Lightweight skeleton — only shown on day tab switches, not initial load
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-40 bg-gray-100 rounded border border-gray-200" />
              <div className="h-40 bg-gray-100 rounded border border-gray-200" />
            </div>
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#F5C518] shrink-0" />
                <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">{liveCount > 0 ? "Live Now" : "Current Match"}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "Pool 1", match: f1 }, { label: "Pool 2", match: f2 }].map(({ label, match: m }) => (
                  <div key={label}>
                    <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] border-l-2 border-[#1B6FC8] pl-2 mb-2">{label}</div>
                    {m ? <FeaturedCard match={m} /> : <div className="border border-gray-200 p-6 text-center text-sm text-gray-400">No matches today</div>}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#F5C518] shrink-0" />
                <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">Day {activeDay} Schedule</h2>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gray-400">{matches.length} matches</span>
              </div>
              {matches.length === 0
                ? <div className="text-center text-gray-400 py-12 text-sm">No matches for Day {activeDay}</div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[{ label: "Pool 1", list: pool1 }, { label: "Pool 2", list: pool2 }].map(({ label, list }) => (
                      <div key={label}>
                        <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] border-l-2 border-[#1B6FC8] pl-2 mb-2">{label}</div>
                        <div className="border border-gray-200 divide-y divide-gray-100">
                          {list.length === 0
                            ? <div className="p-4 text-center text-sm text-gray-400">No matches</div>
                            : list.map((m) => <ScheduleRow key={m.id} match={m} />)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ match: m }: { match: Match }) {
  const isLive = m.status === "live"; const isDone = m.status === "completed";
  return (
    <div className={`border-2 ${isLive ? "border-[#1B6FC8] bg-blue-50/30" : "border-gray-200 bg-white"}`}>
      <div className={`px-4 py-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest ${isLive ? "bg-blue-50" : isDone ? "bg-gray-50" : ""}`}>
        <div className={`flex items-center gap-2 ${isLive ? "text-[#2DB87A]" : isDone ? "text-gray-400" : "text-[#1B6FC8]"}`}>
          {isLive && <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />}
          {isLive ? `Live · ${m.groups?.name}` : isDone ? `Full time · ${m.groups?.name}` : `Upcoming · ${m.groups?.name}`}
        </div>
        <span className="text-gray-400">{m.match_time}</span>
      </div>
      <div className="px-4 py-5 grid grid-cols-3 items-center gap-3">
        <div><div className="font-black uppercase text-sm text-gray-900 leading-tight">{m.home_team?.name}</div><div className="text-[10px] text-gray-400 uppercase mt-0.5">Home</div></div>
        <div className="text-center">
          {m.status === "scheduled"
            ? <div className="font-black text-2xl text-gray-300 tracking-widest">vs</div>
            : <div className={`font-black text-4xl leading-none tracking-wide ${isLive ? "text-[#1B6FC8]" : "text-gray-700"}`}>{m.home_score}–{m.away_score}</div>
          }
          {isLive && <div className="text-[10px] font-bold text-[#2DB87A] uppercase tracking-widest mt-1">H{m.current_half} · In progress</div>}
          {m.status === "scheduled" && <div className="text-[10px] text-[#1B6FC8] font-bold uppercase tracking-widest mt-1">Kicks off {m.match_time}</div>}
        </div>
        <div className="text-right"><div className="font-black uppercase text-sm text-gray-900 leading-tight">{m.away_team?.name}</div><div className="text-[10px] text-gray-400 uppercase mt-0.5">Away</div></div>
      </div>
      {(m.half1_home > 0 || m.half1_away > 0 || m.current_half) && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          {[{ i: 0, h: m.half1_home, a: m.half1_away }, { i: 1, h: m.half2_home, a: m.half2_away }].map(({ i, h, a }) => {
            const active = m.current_half === i + 1; const hasData = h > 0 || a > 0 || active;
            return <div key={i} className={`border p-2 text-center ${active ? "border-[#1B6FC8] bg-blue-50" : "border-gray-100"}`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-[#1B6FC8]" : "text-gray-400"}`}>H{i + 1}{active ? " ●" : ""}</div>
              <div className={`font-black text-sm ${active ? "text-gray-900" : "text-gray-400"}`}>{hasData ? `${h}–${a}` : "–"}</div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ match: m }: { match: Match }) {
  const isLive = m.status === "live"; const isDone = m.status === "completed";
  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white ${isLive ? "bg-blue-50 border-l-4 border-l-[#1B6FC8]" : "hover:bg-gray-50"}`}>
      <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-xs uppercase truncate ${isLive ? "text-[#1B6FC8]" : "text-gray-900"}`}>{m.home_team?.name} <span className="font-normal text-gray-400">vs</span> {m.away_team?.name}</div>
        <div className="text-[10px] text-gray-400 uppercase">{m.groups?.name}</div>
      </div>
      {m.status !== "scheduled" && <span className={`font-black text-sm ${isLive ? "text-[#1B6FC8]" : "text-gray-600"}`}>{m.home_score}–{m.away_score}</span>}
      <span className={`text-[10px] font-bold uppercase px-2 py-1 shrink-0 ${isLive ? "bg-[#2DB87A] text-white" : isDone ? "bg-gray-100 text-gray-400" : "border border-gray-200 text-gray-400"}`}>
        {isLive ? "Live" : isDone ? "FT" : m.match_time}
      </span>
    </div>
  );
}
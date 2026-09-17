"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  updateMatchScore,
  updateCurrentHalf,
  updateMatchStatus,
  logMatchEvent,
  deleteMatchEvent,
} from "@/lib/db";

type Match = {
  id: string;
  status: string;
  match_time: string;
  day: number;
  home_team: { id: string; name: string; coach: string } | null;
  away_team: { id: string; name: string; coach: string } | null;
  pools: { name: string } | null;
};

type Player = { id: string; name: string; cap_number: number; team_id: string };
type EventType = "goal" | "kickout" | "yellow_card" | "red_card";
type LoggedEvent = { id: string; player_id: string; team_id: string; event_type: EventType; half: number };

const SELECT =
  "*, home_team:teams!matches_home_team_id_fkey(id,name,coach), away_team:teams!matches_away_team_id_fkey(id,name,coach), pools(name)";

const STATS: { type: EventType; label: string; shortLabel: string; activeColor: string }[] = [
  { type: "goal", label: "Goals", shortLabel: "G", activeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { type: "kickout", label: "Kickouts", shortLabel: "KO", activeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { type: "yellow_card", label: "Yellow", shortLabel: "YC", activeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { type: "red_card", label: "Red", shortLabel: "RC", activeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
];

function computeTotals(events: LoggedEvent[], homeId?: string, awayId?: string) {
  const goals = events.filter((e) => e.event_type === "goal");
  return {
    homeScore: goals.filter((e) => e.team_id === homeId).length,
    awayScore: goals.filter((e) => e.team_id === awayId).length,
    half1_home: goals.filter((e) => e.team_id === homeId && e.half === 1).length,
    half1_away: goals.filter((e) => e.team_id === awayId && e.half === 1).length,
    half2_home: goals.filter((e) => e.team_id === homeId && e.half === 2).length,
    half2_away: goals.filter((e) => e.team_id === awayId && e.half === 2).length,
  };
}

export default function AdminScoring() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [currentHalf, setCurrentHalf] = useState(1);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const match = matches.find((m) => m.id === matchId);

  const loadMatches = useCallback(async () => {
    const { data } = await supabase
      .from("matches")
      .select(SELECT)
      .in("status", ["live", "scheduled"])
      .order("day")
      .order("match_time");
    const ms = (data as Match[]) ?? [];
    setMatches(ms);
    if (ms.length > 0 && !matchId) {
      const firstLive = ms.find((m) => m.status === "live");
      setMatchId((firstLive ?? ms[0]).id);
      setActiveDay((firstLive ?? ms[0]).day);
    }
  }, [matchId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  async function startMatch() {
    if (!match || starting) return;
    setStarting(true);
    try {
      await updateMatchStatus(match.id, "live");
      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, status: "live" } : m))
      );
      setError(null);
    } catch (err: any) {
      console.error("startMatch failed:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      setError(err?.message || "Couldn't start match — check your connection.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!match) return;
    supabase
      .from("players")
      .select("*")
      .eq("team_id", match.home_team?.id ?? "")
      .order("cap_number")
      .then(({ data }) => setHomePlayers((data as Player[]) ?? []));
    supabase
      .from("players")
      .select("*")
      .eq("team_id", match.away_team?.id ?? "")
      .order("cap_number")
      .then(({ data }) => setAwayPlayers((data as Player[]) ?? []));
    supabase
      .from("matches")
      .select("current_half")
      .eq("id", match.id)
      .single()
      .then(({ data }) => setCurrentHalf(data?.current_half ?? 1));
    supabase
      .from("match_events")
      .select("id,player_id,team_id,event_type,half")
      .eq("match_id", match.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const ev = (data ?? []) as LoggedEvent[];
        setEvents(ev);
        const t = computeTotals(ev, match.home_team?.id, match.away_team?.id);
        setHomeScore(t.homeScore);
        setAwayScore(t.awayScore);
      });
  }, [matchId, match?.id]);

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase
      .channel(`score-${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (p) => {
          const m = p.new as any;
          setHomeScore(m.home_score);
          setAwayScore(m.away_score);
          setCurrentHalf(m.current_half ?? 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase
      .channel(`events-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        (p) => {
          const e = p.new as any;
          setEvents((prev) =>
            prev.some((x) => x.id === e.id)
              ? prev
              : [
                  {
                    id: e.id,
                    player_id: e.player_id,
                    team_id: e.team_id,
                    event_type: e.event_type,
                    half: e.half,
                  },
                  ...prev,
                ]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        (p) => {
          const old = p.old as any;
          setEvents((prev) => prev.filter((x) => x.id !== old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [matchId]);

  function countFor(playerId: string, type: EventType) {
    return events.filter((e) => e.player_id === playerId && e.event_type === type).length;
  }

  async function bump(player: Player, type: EventType, delta: 1 | -1) {
    if (!match || saving) return;
    setSaving(true);
    const prevEvents = events,
      prevHome = homeScore,
      prevAway = awayScore;
    try {
      let nextEvents = events;
      if (delta === 1) {
        const tid = Date.now().toString();
        const ev: LoggedEvent = {
          id: tid,
          player_id: player.id,
          team_id: player.team_id,
          event_type: type,
          half: currentHalf,
        };
        nextEvents = [ev, ...events];
        setEvents(nextEvents);
        const saved = await logMatchEvent({
          match_id: match.id,
          player_id: player.id,
          team_id: player.team_id,
          event_type: type,
          half: currentHalf,
        });
        nextEvents = nextEvents.map((e) => (e.id === tid ? { ...e, id: saved.id } : e));
        setEvents(nextEvents);
      } else {
        const last = events.find((e) => e.player_id === player.id && e.event_type === type);
        if (!last) {
          setSaving(false);
          return;
        }
        nextEvents = events.filter((e) => e.id !== last.id);
        setEvents(nextEvents);
        await deleteMatchEvent(last.id);
      }
      if (type === "goal") {
        const t = computeTotals(nextEvents, match.home_team?.id, match.away_team?.id);
        setHomeScore(t.homeScore);
        setAwayScore(t.awayScore);
        await updateMatchScore(match.id, t.homeScore, t.awayScore, {
          half1_home: t.half1_home,
          half1_away: t.half1_away,
          half2_home: t.half2_home,
          half2_away: t.half2_away,
        });
      }
      setError(null);
    } catch (err: any) {
      setEvents(prevEvents);
      setHomeScore(prevHome);
      setAwayScore(prevAway);
      console.error("bump failed:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      setError(err?.message || "Save failed — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function changeHalf(h: number) {
    const prev = currentHalf;
    setCurrentHalf(h);
    try {
      await updateCurrentHalf(match!.id, h);
      setError(null);
    } catch (err: any) {
      setCurrentHalf(prev);
      console.error("changeHalf failed:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      setError(err?.message || "Couldn't switch half — check your connection.");
    }
  }

  const liveMatchCount = matches.filter((m) => m.status === "live").length;
  const dayMatches = matches.filter((m) => m.day === activeDay);

  function renderTeamPanel(players: Player[], isHome: boolean) {
    const team = isHome ? match?.home_team : match?.away_team;
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
        {/* Team Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {isHome ? "Home Team" : "Away Team"}
            </span>
            <h3 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {team?.name ?? "Unknown Team"}
            </h3>
          </div>
          <div className="text-xs text-zinc-400">
            Coach: <span className="text-zinc-200">{team?.coach || "—"}</span>
          </div>
        </div>

        {/* Column Subheadings */}
        <div className="hidden sm:flex items-center px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60 text-xs font-medium text-zinc-400">
          <span className="w-10 text-center">Cap</span>
          <span className="flex-1 ml-3">Player</span>
          <div className="flex items-center gap-2">
            {STATS.map(({ type, label }) => (
              <span key={type} className="w-20 text-center">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Roster list */}
        <div className="divide-y divide-zinc-800/50">
          {players.length === 0 ? (
            <div className="text-center text-zinc-400 text-sm py-10">No players registered</div>
          ) : (
            players.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 py-3 hover:bg-zinc-800/25 transition-colors gap-3"
              >
                {/* Cap and Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-200 font-semibold text-xs flex items-center justify-center shrink-0">
                    {p.cap_number}
                  </span>
                  <span className="text-sm font-medium text-zinc-100 truncate">{p.name}</span>
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-2">
                  {STATS.map(({ type, shortLabel, activeColor }) => {
                    const count = countFor(p.id, type);
                    const isActive = count > 0;
                    return (
                      <div
                        key={type}
                        className={`flex items-center justify-between sm:justify-center rounded-lg border px-1.5 py-1 sm:w-20 sm:px-1 ${
                          isActive
                            ? activeColor
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400"
                        }`}
                      >
                        <span className="text-[10px] sm:hidden font-medium opacity-70">
                          {shortLabel}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={saving || count === 0}
                            onClick={() => bump(p, type, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-white/10 active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent transition"
                            aria-label={`Decrease ${type}`}
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-xs font-semibold tabular-nums text-zinc-100">
                            {count}
                          </span>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => bump(p, type, 1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-white/10 active:scale-95 disabled:opacity-20 transition"
                            aria-label={`Increase ${type}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
              Match Scorer
            </h1>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Live score & event logger
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                liveMatchCount > 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveMatchCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                }`}
              />
              {liveMatchCount} Live
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Notifications */}
        {saveSuccess && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs px-4 py-2.5">
            Match status updated successfully
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs px-4 py-2.5 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white ml-2 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Days Filter */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3 overflow-x-auto">
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeDay === d
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>

        {/* Fixtures Selector */}
        {dayMatches.length === 0 ? (
          <div className="text-center text-zinc-400 text-xs py-4">No fixtures for Day {activeDay}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dayMatches.map((m) => {
              const isSelected = m.id === matchId;
              const isLive = m.status === "live";
              return (
                <button
                  key={m.id}
                  onClick={() => setMatchId(m.id)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-zinc-400 bg-zinc-900 ring-1 ring-zinc-400/50"
                      : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-200 truncate">
                      {m.home_team?.name}{" "}
                      <span className="text-zinc-400 font-normal">vs</span>{" "}
                      {m.away_team?.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {m.pools?.name ? `${m.pools.name} • ` : ""}
                      {m.match_time}
                    </div>
                  </div>
                  {isLive && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Match Scoring Surface */}
        {match ? (
          match.status === "scheduled" ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto mt-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Scheduled • {match.match_time}
              </span>
              <div className="text-xl font-bold text-zinc-100 mt-3">{match.home_team?.name}</div>
              <div className="text-xs text-zinc-400 uppercase tracking-widest my-1">vs</div>
              <div className="text-xl font-bold text-zinc-100">{match.away_team?.name}</div>
              <button
                onClick={startMatch}
                disabled={starting}
                className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-zinc-100 text-zinc-900 font-semibold text-xs tracking-wide hover:bg-white active:scale-95 disabled:opacity-50 transition"
              >
                {starting ? "Starting..." : "Start Match"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scoreboard Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
                <div className="grid grid-cols-3 items-center gap-4 text-center">
                  <div className="text-left sm:text-center">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                      Home
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-100 truncate block mt-0.5">
                      {match.home_team?.name}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
                      {homeScore} <span className="text-zinc-600 font-light">:</span> {awayScore}
                    </div>
                  </div>

                  <div className="text-right sm:text-center">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                      Away
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-100 truncate block mt-0.5">
                      {match.away_team?.name}
                    </span>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800">
                    {[1, 2].map((h) => (
                      <button
                        key={h}
                        onClick={() => changeHalf(h)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          currentHalf === h
                            ? "bg-zinc-800 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Half {h}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      updateMatchStatus(match.id, "completed").then(() => {
                        loadMatches();
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-500/5 text-xs font-medium transition"
                  >
                    End Match
                  </button>
                </div>
              </div>

              {/* Team Rosters */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {renderTeamPanel(homePlayers, true)}
                {renderTeamPanel(awayPlayers, false)}
              </div>
            </div>
          )
        ) : (
          <div className="text-center text-zinc-400 py-16 text-xs">
            No matches to score. Create a fixture first.
          </div>
        )}
      </main>
    </div>
  );
}

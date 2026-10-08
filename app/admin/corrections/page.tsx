"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  updateMatchScore,
  logMatchEvent,
  deleteMatchEvent,
} from "@/lib/db";

type Match = {
  id: string;
  status: string;
  match_time: string;
  day: number;
  home_score: number;
  away_score: number;
  half1_home: number;
  half1_away: number;
  half2_home: number;
  half2_away: number;
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

const num = (v: string) => Math.max(0, parseInt(v || "0", 10) || 0);

export default function AdminCorrections() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [logHalf, setLogHalf] = useState(1);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LoggedEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ h1h: 0, h1a: 0, h2h: 0, h2a: 0 });

  const match = matches.find((m) => m.id === matchId);

  const patchMatch = (id: string, fields: Partial<Match>) =>
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...fields } : m)));

  const fail = (label: string, err: any) => {
    console.error(`${label} failed:`, { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint });
    setError(err?.message || "Save failed — check your connection and try again.");
    setNotice(null);
  };

  const loadMatches = useCallback(async () => {
    const { data } = await supabase
      .from("matches")
      .select(SELECT)
      .eq("status", "completed")
      .order("day")
      .order("match_time");
    const ms = (data as Match[]) ?? [];
    setMatches(ms);
    if (ms.length > 0) {
      const last = ms[ms.length - 1];
      setMatchId(last.id);
      setActiveDay(last.day);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const loadEvents = useCallback(async (id: string) => {
    const { data } = await supabase.from("match_events").select("id,player_id,team_id,event_type,half").eq("match_id", id)
      .order("created_at", { ascending: false });
    const ev = (data ?? []) as LoggedEvent[];
    setEvents(ev);
    setSavedEvents(ev);
  }, []);

  const resetManual = (m: Match) =>
    setManual({ h1h: m.half1_home ?? 0, h1a: m.half1_away ?? 0, h2h: m.half2_home ?? 0, h2a: m.half2_away ?? 0 });

  useEffect(() => {
    if (!match) return;
    setNotice(null);
    setError(null);
    setLogHalf(1);
    setShowManual(false);
    resetManual(match);
    supabase.from("players").select("*").eq("team_id", match.home_team?.id ?? "").order("cap_number")
      .then(({ data }) => setHomePlayers((data as Player[]) ?? []));
    supabase.from("players").select("*").eq("team_id", match.away_team?.id ?? "").order("cap_number")
      .then(({ data }) => setAwayPlayers((data as Player[]) ?? []));
    loadEvents(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const isNew = (e: LoggedEvent) => e.id.startsWith("new-");
  const eventsDirty =
    events.some(isNew) || savedEvents.some((s) => !events.some((e) => e.id === s.id));
  const scoreDirty = !!match && (
    manual.h1h !== (match.half1_home ?? 0) || manual.h1a !== (match.half1_away ?? 0) ||
    manual.h2h !== (match.half2_home ?? 0) || manual.h2a !== (match.half2_away ?? 0)
  );
  const dirty = eventsDirty || scoreDirty;
  const draftHome = manual.h1h + manual.h2h;
  const draftAway = manual.h1a + manual.h2a;

  function selectMatch(id: string, day?: number) {
    if (id === matchId) return;
    if (dirty && !confirm("You have unsaved changes. Discard them?")) return;
    if (day !== undefined) setActiveDay(day);
    setMatchId(id);
  }

  function countFor(playerId: string, type: EventType) {
    return events.filter((e) => e.player_id === playerId && e.event_type === type).length;
  }

  // Edits are staged locally — nothing is written until Save.
  function bump(player: Player, type: EventType, delta: 1 | -1) {
    if (!match) return;
    let next = events;
    if (delta === 1) {
      next = [{ id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, player_id: player.id, team_id: player.team_id, event_type: type, half: logHalf }, ...events];
    } else {
      const last = events.find((e) => e.player_id === player.id && e.event_type === type);
      if (!last) return;
      next = events.filter((e) => e.id !== last.id);
    }
    setEvents(next);
    if (type === "goal") {
      const t = computeTotals(next, match.home_team?.id, match.away_team?.id);
      setManual({ h1h: t.half1_home, h1a: t.half1_away, h2h: t.half2_home, h2a: t.half2_away });
    }
    setNotice(null);
  }

  function discard() {
    if (!match) return;
    resetManual(match);
    setShowManual(false);
    loadEvents(match.id);
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (!match || saving || !dirty) return;
    setSaving(true);
    try {
      const removed = savedEvents.filter((s) => !events.some((e) => e.id === s.id));
      const added = events.filter(isNew);
      await Promise.all(removed.map((e) => deleteMatchEvent(e.id)));
      await Promise.all(added.map((e) => logMatchEvent({ match_id: match.id, player_id: e.player_id, team_id: e.team_id, event_type: e.event_type, half: e.half })));
      const { h1h, h1a, h2h, h2a } = manual;
      await updateMatchScore(match.id, h1h + h2h, h1a + h2a, { half1_home: h1h, half1_away: h1a, half2_home: h2h, half2_away: h2a });
      patchMatch(match.id, { home_score: h1h + h2h, away_score: h1a + h2a, half1_home: h1h, half1_away: h1a, half2_home: h2h, half2_away: h2a });
      await loadEvents(match.id);
      setShowManual(false);
      setError(null);
      setNotice("Changes saved");
    } catch (err: any) {
      fail("save", err);
      // Reload so the screen reflects whatever actually got written.
      loadEvents(match.id);
    } finally {
      setSaving(false);
    }
  }

  const days = Array.from(new Set(matches.map((m) => m.day))).sort((a, b) => a - b);
  const dayMatches = matches.filter((m) => m.day === activeDay);

  function renderTeamPanel(players: Player[], isHome: boolean) {
    const team = isHome ? match?.home_team : match?.away_team;
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
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

        <div className="hidden sm:flex items-center px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60 text-xs font-medium text-zinc-400">
          <span className="w-10 text-center">Cap</span>
          <span className="flex-1 ml-3">Player</span>
          <div className="flex items-center gap-2">
            {STATS.map(({ type, label }) => (
              <span key={type} className="w-20 text-center">{label}</span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {players.length === 0 ? (
            <div className="text-center text-zinc-400 text-sm py-10">No players registered</div>
          ) : (
            players.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 py-3 hover:bg-zinc-800/25 transition-colors gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-200 font-semibold text-xs flex items-center justify-center shrink-0">
                    {p.cap_number}
                  </span>
                  <span className="text-sm font-medium text-zinc-100 truncate">{p.name}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-2">
                  {STATS.map(({ type, shortLabel, activeColor }) => {
                    const count = countFor(p.id, type);
                    const isActive = count > 0;
                    return (
                      <div
                        key={type}
                        className={`flex items-center justify-between sm:justify-center rounded-lg border px-1.5 py-1 sm:w-20 sm:px-1 ${
                          isActive ? activeColor : "border-zinc-800 bg-zinc-950/40 text-zinc-400"
                        }`}
                      >
                        <span className="text-[10px] sm:hidden font-medium opacity-70">{shortLabel}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={count === 0}
                            onClick={() => bump(p, type, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs hover:bg-white/10 active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent transition"
                            aria-label={`Decrease ${type}`}
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-xs font-semibold tabular-nums text-zinc-100">{count}</span>
                          <button
                            type="button"
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

  const halfInput = (key: keyof typeof manual) => (
    <input
      type="number"
      min={0}
      value={manual[key]}
      onChange={(e) => setManual({ ...manual, [key]: num(e.target.value) })}
      className="w-14 rounded-md bg-zinc-950/60 border border-zinc-800 text-center text-sm font-semibold tabular-nums text-zinc-100 py-1 focus:outline-none focus:border-zinc-500"
    />
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">Score Corrections</h1>
            <span className="text-xs text-zinc-400 hidden sm:inline">Fix scorers, cards and final results</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        {notice && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs px-4 py-2.5 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white ml-2 font-semibold">✕</button>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs px-4 py-2.5 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white ml-2 font-semibold">✕</button>
          </div>
        )}

        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => { const f = matches.find((m) => m.day === d); if (f) selectMatch(f.id, d); else setActiveDay(d); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeDay === d ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>

        {matches.length === 0 ? (
          <div className="text-center text-zinc-400 text-xs py-4">No completed matches yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dayMatches.map((m) => {
              const isSelected = m.id === matchId;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMatch(m.id)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-zinc-400 bg-zinc-900 ring-1 ring-zinc-400/50"
                      : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-200 truncate">
                      {m.home_team?.name} <span className="text-zinc-400 font-normal">vs</span> {m.away_team?.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {m.pools?.name ? `${m.pools.name} • ` : ""}
                      {m.match_time}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-100">{m.home_score}–{m.away_score}</span>
                </button>
              );
            })}
          </div>
        )}

        {match && (
          <div className="space-y-6">
            {/* Scoreboard Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
              <div className="grid grid-cols-3 items-center gap-4 text-center">
                <div className="text-left sm:text-center">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">Home</span>
                  <span className="text-sm sm:text-base font-semibold text-zinc-100 truncate block mt-0.5">{match.home_team?.name}</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
                    {draftHome} <span className="text-zinc-600 font-light">:</span> {draftAway}
                  </div>
                  <span className="text-[11px] text-zinc-500 tabular-nums mt-1">
                    H1 {manual.h1h}–{manual.h1a} · H2 {manual.h2h}–{manual.h2a}
                  </span>
                </div>

                <div className="text-right sm:text-center">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">Away</span>
                  <span className="text-sm sm:text-base font-semibold text-zinc-100 truncate block mt-0.5">{match.away_team?.name}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Log to</span>
                  <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800">
                    {[1, 2].map((h) => (
                      <button
                        key={h}
                        onClick={() => setLogHalf(h)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          logHalf === h ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Half {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManual((v) => !v)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 text-xs font-medium transition"
                  >
                    {showManual ? "Close" : "Edit score"}
                  </button>
                </div>
              </div>

              {showManual && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80">
                  <div className="grid grid-cols-3 items-center gap-4 text-center">
                    <div className="flex flex-col items-start sm:items-center gap-2">
                      {halfInput("h1h")}
                      {halfInput("h2h")}
                    </div>
                    <div className="flex flex-col items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                      <span className="py-1.5">Half 1</span>
                      <span className="py-1.5">Half 2</span>
                    </div>
                    <div className="flex flex-col items-end sm:items-center gap-2">
                      {halfInput("h1a")}
                      {halfInput("h2a")}
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] text-zinc-500">
                    Sets the score directly. Changing a goal below recalculates it from the goal list. Press Save to apply.
                  </p>
                </div>
              )}
            </div>

            {/* Team Rosters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {renderTeamPanel(homePlayers, true)}
              {renderTeamPanel(awayPlayers, false)}
            </div>
          </div>
        )}
      </main>

      {match && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <span className={`text-xs ${dirty ? "text-amber-400" : "text-zinc-500"}`}>
              {dirty ? "Unsaved changes" : "No changes"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={discard}
                disabled={!dirty || saving}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 text-xs font-medium disabled:opacity-30 transition"
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="px-5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 font-semibold text-xs hover:bg-white active:scale-95 disabled:opacity-30 transition"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
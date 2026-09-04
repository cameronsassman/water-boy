"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchScore, updateCurrentHalf, updateMatchStatus, logMatchEvent, deleteMatchEvent } from "@/lib/db";

type Match = {
  id: string; status: string; match_time: string; day: number;
  home_team: { id: string; name: string; coach: string } | null;
  away_team: { id: string; name: string; coach: string } | null;
  pools: { name: string } | null;
};
type Player = { id: string; name: string; cap_number: number; team_id: string };
type EventType = "goal" | "kickout" | "yellow_card" | "red_card";
type LoggedEvent = { id: string; player_id: string; team_id: string; event_type: EventType; half: number };

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(id,name,coach), away_team:teams!matches_away_team_id_fkey(id,name,coach), pools(name)";

const STATS: { type: EventType; label: string; color: string }[] = [
  { type: "goal",        label: "goals",       color: "#1A7A52" },
  { type: "kickout",     label: "kickOuts",    color: "#D2691E" },
  { type: "yellow_card", label: "yellowCards", color: "#CA8A04" },
  { type: "red_card",    label: "redCards",    color: "#C0392B" },
];

function computeTotals(events: LoggedEvent[], homeId?: string, awayId?: string) {
  const goals = events.filter((e) => e.event_type === "goal");
  return {
    homeScore:  goals.filter((e) => e.team_id === homeId).length,
    awayScore:  goals.filter((e) => e.team_id === awayId).length,
    half1_home: goals.filter((e) => e.team_id === homeId && e.half === 1).length,
    half1_away: goals.filter((e) => e.team_id === awayId && e.half === 1).length,
    half2_home: goals.filter((e) => e.team_id === homeId && e.half === 2).length,
    half2_away: goals.filter((e) => e.team_id === awayId && e.half === 2).length,
  };
}

export default function AdminScoring() {
  const [matches,     setMatches]     = useState<Match[]>([]);
  const [matchId,     setMatchId]     = useState("");
  const [homeScore,   setHomeScore]   = useState(0);
  const [awayScore,   setAwayScore]   = useState(0);
  const [currentHalf, setCurrentHalf] = useState(1);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [events,      setEvents]      = useState<LoggedEvent[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [starting,    setStarting]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [activeDay,   setActiveDay]   = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const match = matches.find((m) => m.id === matchId);

  // Pulls in both live and scheduled matches, so a match can be started
  // and scored from this page directly — no trip to Fixtures required.
  const loadMatches = useCallback(async () => {
    const { data } = await supabase.from("matches").select(SELECT).in("status", ["live","scheduled"]).order("day").order("match_time");
    const ms = (data as Match[]) ?? [];
    setMatches(ms);
    if (ms.length > 0 && !matchId) {
      const firstLive = ms.find((m) => m.status === "live");
      setMatchId((firstLive ?? ms[0]).id);
      setActiveDay((firstLive ?? ms[0]).day);
    }
  }, [matchId]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  async function startMatch() {
    if (!match || starting) return;
    setStarting(true);
    try {
      await updateMatchStatus(match.id, "live");
      setMatches((prev) => prev.map((m) => m.id === match.id ? { ...m, status: "live" } : m));
      setError(null);
    } catch (err: any) {
      console.error("startMatch failed:", { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint });
      setError(err?.message || "Couldn't start match — check your connection.");
    }
    finally { setStarting(false); }
  }

  useEffect(() => {
    if (!match) return;
    supabase.from("players").select("*").eq("team_id", match.home_team?.id ?? "").order("cap_number").then(({ data }) => setHomePlayers((data as Player[]) ?? []));
    supabase.from("players").select("*").eq("team_id", match.away_team?.id ?? "").order("cap_number").then(({ data }) => setAwayPlayers((data as Player[]) ?? []));
    supabase.from("matches").select("current_half").eq("id", match.id).single().then(({ data }) => setCurrentHalf(data?.current_half ?? 1));
    supabase.from("match_events").select("id,player_id,team_id,event_type,half").eq("match_id", match.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        const ev = (data ?? []) as LoggedEvent[];
        setEvents(ev);
        const t = computeTotals(ev, match.home_team?.id, match.away_team?.id);
        setHomeScore(t.homeScore); setAwayScore(t.awayScore);
      });
  }, [matchId, match?.id]);

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase.channel(`score-${matchId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, (p) => {
        const m = p.new as any;
        setHomeScore(m.home_score); setAwayScore(m.away_score); setCurrentHalf(m.current_half ?? 1);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase.channel(`events-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_events", filter: `match_id=eq.${matchId}` }, (p) => {
        const e = p.new as any;
        setEvents((prev) => prev.some((x) => x.id === e.id) ? prev : [{ id: e.id, player_id: e.player_id, team_id: e.team_id, event_type: e.event_type, half: e.half }, ...prev]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "match_events", filter: `match_id=eq.${matchId}` }, (p) => {
        const old = p.old as any;
        setEvents((prev) => prev.filter((x) => x.id !== old.id));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  function countFor(playerId: string, type: EventType) {
    return events.filter((e) => e.player_id === playerId && e.event_type === type).length;
  }

  async function bump(player: Player, type: EventType, delta: 1 | -1) {
    if (!match || saving) return;
    setSaving(true);
    const prevEvents = events, prevHome = homeScore, prevAway = awayScore;
    try {
      let nextEvents = events;
      if (delta === 1) {
        const tid = Date.now().toString();
        const ev: LoggedEvent = { id: tid, player_id: player.id, team_id: player.team_id, event_type: type, half: currentHalf };
        nextEvents = [ev, ...events];
        setEvents(nextEvents);
        const saved = await logMatchEvent({ match_id: match.id, player_id: player.id, team_id: player.team_id, event_type: type, half: currentHalf });
        nextEvents = nextEvents.map((e) => (e.id === tid ? { ...e, id: saved.id } : e));
        setEvents(nextEvents);
      } else {
        const last = events.find((e) => e.player_id === player.id && e.event_type === type);
        if (!last) { setSaving(false); return; }
        nextEvents = events.filter((e) => e.id !== last.id);
        setEvents(nextEvents);
        await deleteMatchEvent(last.id);
      }
      if (type === "goal") {
        const t = computeTotals(nextEvents, match.home_team?.id, match.away_team?.id);
        setHomeScore(t.homeScore); setAwayScore(t.awayScore);
        await updateMatchScore(match.id, t.homeScore, t.awayScore, { half1_home: t.half1_home, half1_away: t.half1_away, half2_home: t.half2_home, half2_away: t.half2_away });
      }
      setError(null);
    } catch (err: any) {
      setEvents(prevEvents); setHomeScore(prevHome); setAwayScore(prevAway);
      console.error("bump failed:", { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint });
      setError(err?.message || "Save failed — check your connection and try again.");
    }
    finally { setSaving(false); }
  }

  async function changeHalf(h: number) {
    const prev = currentHalf;
    setCurrentHalf(h);
    try { await updateCurrentHalf(match!.id, h); setError(null); }
    catch (err: any) {
      setCurrentHalf(prev);
      console.error("changeHalf failed:", { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint });
      setError(err?.message || "Couldn't switch half — check your connection.");
    }
  }

  function renderTeamPanel(players: Player[], isHome: boolean) {
    const team = isHome ? match?.home_team : match?.away_team;
    const barBg   = isHome ? "bg-[#F5C518]" : "bg-[#1B6FC8]";
    const barText = isHome ? "text-[#07091F]" : "text-white";
    return (
      <div className="border border-[#1B3A6E] flex flex-col">
        <div className={`${barBg} ${barText} text-center py-2.5 px-3`}>
          <div className="text-[10px] font-bold uppercase opacity-80">{isHome ? "Home team" : "Away team"}</div>
          <div className="font-black uppercase text-sm">{team?.name}</div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1B3A6E] bg-white/5">
          <span className="w-9 min-w-[36px] shrink-0" />
          <span className="flex-1 min-w-0" />
          {STATS.map(({ type, label }) => (
            <span key={type} className="w-24 shrink-0 text-center text-[10px] font-bold uppercase tracking-wider text-[#7A9CC8] border-l border-[#1B3A6E] pl-3">{label}</span>
          ))}
        </div>

        <div className="divide-y divide-[#1B3A6E]">
          {players.length === 0 && <div className="text-center text-[#3A5A8E] text-sm py-6">No players registered</div>}
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-4">
              <span className="w-9 h-9 min-w-[36px] flex items-center justify-center text-sm font-black shrink-0 bg-white/10 text-white">{p.cap_number}</span>
              <span className="font-bold text-sm uppercase flex-1 min-w-0 truncate text-white">{p.name}</span>
              {STATS.map(({ type, color }) => (
                <div key={type} className="flex items-center justify-center gap-1.5 w-24 shrink-0 border-l border-[#1B3A6E] pl-3">
                  <button disabled={saving} onClick={() => bump(p, type, -1)}
                    className="w-8 h-8 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 disabled:opacity-40 text-base font-bold transition-colors">−</button>
                  <span className="w-5 text-center font-extrabold text-base text-white">{countFor(p.id, type)}</span>
                  <button disabled={saving} onClick={() => bump(p, type, 1)}
                    style={{ backgroundColor: color }}
                    className="w-8 h-8 flex items-center justify-center text-white hover:opacity-85 disabled:opacity-40 text-base font-bold transition-opacity">+</button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[#1B3A6E] bg-white/5">
          <span className="text-xs text-[#7A9CC8]">Coach: {team?.coach || "—"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07091F]">
      <div className="border-b border-[#1B3A6E] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black uppercase text-xl text-white tracking-wide">🏆 Live Scorer</div>
            <p className="text-[#7A9CC8] text-xs mt-0.5">Select a fixture, start the match, and log player stats live</p>
          </div>
          <div className="flex items-center gap-2 text-[#2DB87A] text-xs font-bold uppercase tracking-widest shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />{matches.filter((m) => m.status === "live").length} live
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-3">
          <div className="border border-[#2DB87A]/40 bg-[#2DB87A]/10 text-[#2DB87A] text-xs px-3 py-2">
            Match result saved successfully
          </div>
        </div>
      )}

      {/* Day tabs */}
      <div className="border-b border-[#1B3A6E] flex max-w-7xl mx-auto">
        {[1,2,3,4].map((d) => (
          <button key={d} onClick={() => setActiveDay(d)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors ${activeDay===d?"text-[#1B6FC8] border-[#1B6FC8]":"text-[#7A9CC8] border-transparent hover:text-white"}`}>
            Day {d}
          </button>
        ))}
      </div>

      {/* Upcoming fixtures for the selected day */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        {matches.filter((m) => m.day === activeDay).length === 0
          ? <div className="text-center text-[#3A5A8E] text-sm py-6">No fixtures for Day {activeDay}</div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matches.filter((m) => m.day === activeDay).map((m) => {
                const isSelected = m.id === matchId;
                const isLive = m.status === "live";
                return (
                  <button key={m.id} onClick={() => setMatchId(m.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 border text-left transition-colors ${isSelected ? "border-[#1B6FC8] bg-[#1B6FC8]/10" : "border-[#1B3A6E] hover:border-[#3A5A8E]"}`}>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 shrink-0 ${isLive ? "bg-[#2DB87A] text-white" : "bg-white/10 text-[#7A9CC8]"}`}>
                      {isLive ? "Live" : m.match_time}
                    </span>
                    <span className="text-sm font-bold uppercase text-white truncate flex-1 min-w-0">{m.home_team?.name} <span className="text-[#3A5A8E] font-normal">vs</span> {m.away_team?.name}</span>
                    <span className="text-[10px] text-[#7A9CC8] shrink-0">{m.pools?.name}</span>
                  </button>
                );
              })}
            </div>
        }
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-3">
          <div className="flex items-center justify-between gap-3 border border-red-800 bg-red-950/60 text-red-200 text-xs px-3 py-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white font-bold px-1">✕</button>
          </div>
        </div>
      )}

      {match ? (
        match.status === "scheduled" ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#7A9CC8] mb-2">Scheduled · {match.match_time}</div>
            <div className="font-black uppercase text-xl text-white mb-1">{match.home_team?.name}</div>
            <div className="text-[#3A5A8E] text-sm mb-1">vs</div>
            <div className="font-black uppercase text-xl text-white mb-8">{match.away_team?.name}</div>
            <button onClick={startMatch} disabled={starting}
              className="bg-[#2DB87A] text-white font-black uppercase text-sm tracking-widest px-8 py-3 hover:opacity-85 disabled:opacity-50 transition-opacity">
              {starting ? "Starting..." : "▶ Start Match"}
            </button>
          </div>
        ) : (
        <div className="max-w-7xl mx-auto">
          {/* Score header */}
          <div className="px-4 md:px-6 py-4">
            <div className="grid grid-cols-3 items-center gap-3">
              <div className="font-black uppercase text-sm text-[#F5C518] truncate">{match.home_team?.name}</div>
              <div className="text-center">
                <div className="font-black text-4xl leading-none text-white">
                  {homeScore}<span className="text-[#3A5A8E] mx-2 font-light">–</span>{awayScore}
                </div>
              </div>
              <div className="font-black uppercase text-sm text-[#1B6FC8] text-right truncate">{match.away_team?.name}</div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4">
              <div className="flex gap-1.5">
                {[1,2].map((h) => (
                  <button key={h} onClick={() => changeHalf(h)}
                    className={`px-6 py-2 text-sm font-black uppercase tracking-widest transition-colors ${currentHalf===h?"bg-[#1B6FC8] text-white":"bg-white/10 text-[#7A9CC8] hover:bg-white/20"}`}>
                    H{h}
                  </button>
                ))}
              </div>
              <button onClick={() => updateMatchStatus(match.id,"completed").then(() => { loadMatches(); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); })}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-800 text-red-200 hover:opacity-80 transition-opacity">
                ■ End match
              </button>
            </div>
          </div>

          {/* Player rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 md:px-6 pb-6">
            {renderTeamPanel(homePlayers, true)}
            {renderTeamPanel(awayPlayers, false)}
          </div>
        </div>
        )
      ) : (
        <div className="text-center text-[#3A5A8E] py-20 text-sm">No matches to score.<br /><span className="text-xs">Create a fixture on the Fixtures page first.</span></div>
      )}
    </div>
  );
}
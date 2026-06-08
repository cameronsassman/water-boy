"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchScore, updateMatchStatus, logMatchEvent, deleteMatchEvent } from "@/lib/db";

type Match = {
  id: string; status: string; home_score: number; away_score: number;
  current_half: number | null; match_time: string;
  half1_home: number; half1_away: number; half2_home: number; half2_away: number;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  pools: { name: string } | null;
};
type Player = { id: string; name: string; cap_number: number; team_id: string };
type EventType = "goal" | "kickout" | "yellow_card" | "red_card";
type LoggedEvent = { id: string; player_name: string; team_id: string; team_name: string; event_type: EventType; half: number };

const EVENTS: { type: EventType; label: string; emoji: string; cls: string }[] = [
  { type: "goal",        label: "Goal",     emoji: "⚽", cls: "bg-[#1A7A52] hover:bg-[#145e3f] text-white" },
  { type: "kickout",     label: "Kickout",  emoji: "🤚", cls: "bg-[#1B6FC8] hover:bg-[#0D4A8A] text-white" },
  { type: "yellow_card", label: "Yellow",   emoji: "🟨", cls: "bg-[#CA8A04] hover:bg-[#a16803] text-white" },
  { type: "red_card",    label: "Red",      emoji: "🟥", cls: "bg-[#C0392B] hover:bg-[#962d22] text-white" },
];
const BADGE: Record<EventType, string> = {
  goal: "bg-green-100 text-green-800", kickout: "bg-blue-100 text-blue-800",
  yellow_card: "bg-yellow-100 text-yellow-800", red_card: "bg-red-100 text-red-800",
};

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(id,name), away_team:teams!matches_away_team_id_fkey(id,name), pools(name)";

export default function AdminScoring() {
  const [liveMatches,    setLiveMatches]    = useState<Match[]>([]);
  const [matchId,        setMatchId]        = useState("");
  const [homeScore,      setHomeScore]      = useState(0);
  const [awayScore,      setAwayScore]      = useState(0);
  const [currentHalf,    setCurrentHalf]    = useState(1);
  const [homePlayers,    setHomePlayers]    = useState<Player[]>([]);
  const [awayPlayers,    setAwayPlayers]    = useState<Player[]>([]);
  const [events,         setEvents]         = useState<LoggedEvent[]>([]);
  const [selectedSide,   setSelectedSide]   = useState<"home"|"away"|null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player|null>(null);
  const [saving,         setSaving]         = useState(false);

  const match = liveMatches.find((m) => m.id === matchId);

  const loadLive = useCallback(async () => {
    const { data } = await supabase.from("matches").select(SELECT).eq("status","live").order("match_time");
    const ms = (data as Match[]) ?? [];
    setLiveMatches(ms);
    if (ms.length > 0 && !matchId) {
      setMatchId(ms[0].id);
      setHomeScore(ms[0].home_score);
      setAwayScore(ms[0].away_score);
      setCurrentHalf(ms[0].current_half ?? 1);
    }
  }, [matchId]);

  useEffect(() => { loadLive(); }, [loadLive]);

  useEffect(() => {
    if (!match) return;
    setHomeScore(match.home_score);
    setAwayScore(match.away_score);
    setCurrentHalf(match.current_half ?? 1);
    setSelectedPlayer(null);
    setSelectedSide(null);
    supabase.from("players").select("*").eq("team_id", match.home_team?.id ?? "").order("cap_number").then(({ data }) => setHomePlayers((data as Player[]) ?? []));
    supabase.from("players").select("*").eq("team_id", match.away_team?.id ?? "").order("cap_number").then(({ data }) => setAwayPlayers((data as Player[]) ?? []));
    supabase.from("match_events").select("*, players(name), teams(name)").eq("match_id", match.id).order("created_at", { ascending: false })
      .then(({ data }) => setEvents((data ?? []).map((e: any) => ({
        id: e.id, player_name: e.players?.name ?? "Unknown",
        team_id: e.team_id, team_name: e.teams?.name ?? "",
        event_type: e.event_type as EventType, half: e.half,
      }))));
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

  async function logEvent(type: EventType) {
    if (!selectedPlayer || !match || saving) return;
    setSaving(true);
    const isHome = selectedPlayer.team_id === match.home_team?.id;
    const nH = type === "goal" && isHome  ? homeScore + 1 : homeScore;
    const nA = type === "goal" && !isHome ? awayScore + 1 : awayScore;
    if (type === "goal") { isHome ? setHomeScore(nH) : setAwayScore(nA); }
    const tid = Date.now().toString();
    const ev: LoggedEvent = { id: tid, player_name: selectedPlayer.name, team_id: selectedPlayer.team_id, team_name: isHome ? (match.home_team?.name ?? "") : (match.away_team?.name ?? ""), event_type: type, half: currentHalf };
    setEvents((p) => [ev, ...p]);
    setSelectedPlayer(null); setSelectedSide(null);
    try {
      const saved = await logMatchEvent({ match_id: match.id, player_id: selectedPlayer.id, team_id: selectedPlayer.team_id, event_type: type, half: currentHalf });
      setEvents((p) => p.map((e) => e.id === tid ? { ...e, id: saved.id } : e));
      if (type === "goal") {
        const h1h = currentHalf === 1 ? match.half1_home + (isHome ? 1 : 0) : match.half1_home;
        const h1a = currentHalf === 1 ? match.half1_away + (!isHome ? 1 : 0) : match.half1_away;
        const h2h = currentHalf === 2 ? match.half2_home + (isHome ? 1 : 0) : match.half2_home;
        const h2a = currentHalf === 2 ? match.half2_away + (!isHome ? 1 : 0) : match.half2_away;
        await updateMatchScore(match.id, nH, nA, currentHalf, { half: currentHalf, home: currentHalf === 1 ? h1h : h2h, away: currentHalf === 1 ? h1a : h2a });
      }
    } catch (err) {
      console.error(err);
      if (type === "goal") { setHomeScore(homeScore); setAwayScore(awayScore); }
      setEvents((p) => p.filter((e) => e.id !== tid));
    } finally { setSaving(false); }
  }

  async function undoLast() {
    const last = events[0];
    if (!last || !match || saving) return;
    setSaving(true);
    const isHome = last.team_id === match.home_team?.id;
    if (last.event_type === "goal") { isHome ? setHomeScore((s) => Math.max(0,s-1)) : setAwayScore((s) => Math.max(0,s-1)); }
    setEvents((p) => p.slice(1));
    try {
      await deleteMatchEvent(last.id);
      if (last.event_type === "goal") await updateMatchScore(match.id, isHome ? homeScore-1 : homeScore, !isHome ? awayScore-1 : awayScore, currentHalf, { half: currentHalf, home: 0, away: 0 });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const activePlayers = selectedSide === "home" ? homePlayers : selectedSide === "away" ? awayPlayers : [];

  return (
    <div className="min-h-screen bg-[#07091F]">
      {/* Match selector */}
      <div className="border-b border-[#1B3A6E] px-4 py-3 flex items-center gap-3">
        <select className="flex-1 bg-white/10 border border-[#1B3A6E] text-white text-sm font-bold uppercase px-3 py-2 outline-none"
          value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          {liveMatches.length === 0 && <option>No live matches — set a match to Live in Fixtures</option>}
          {liveMatches.map((m) => <option key={m.id} value={m.id}>{m.home_team?.name} vs {m.away_team?.name} · {m.pools?.name}</option>)}
        </select>
        <div className="flex items-center gap-2 text-[#2DB87A] text-xs font-bold uppercase tracking-widest shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />Live
        </div>
      </div>

      {match ? (
        <div className="max-w-lg mx-auto">
          {/* Scoreboard */}
          <div className="px-6 py-6 border-b-2 border-[#1B6FC8]">
            <div className="grid grid-cols-3 items-center gap-4 mb-5">
              <div><div className="text-white font-black uppercase text-base leading-tight">{match.home_team?.name}</div><div className="text-[#7A9CC8] text-[10px] uppercase tracking-widest mt-1">Home</div></div>
              <div className="text-center"><div className="text-[#F5C518] font-black text-5xl leading-none">{homeScore}<span className="text-[#3A5A8E] text-2xl mx-1">—</span>{awayScore}</div></div>
              <div className="text-right"><div className="text-white font-black uppercase text-base leading-tight">{match.away_team?.name}</div><div className="text-[#7A9CC8] text-[10px] uppercase tracking-widest mt-1">Away</div></div>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2].map((h) => <button key={h} onClick={() => { setCurrentHalf(h); updateMatchScore(match.id,homeScore,awayScore,h,{half:h,home:0,away:0}).catch(console.error); }}
                className={`px-8 py-2 text-sm font-black uppercase tracking-widest transition-colors ${currentHalf===h?"bg-[#1B6FC8] text-white":"bg-white/10 text-[#7A9CC8] hover:bg-white/20"}`}>H{h}</button>)}
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => updateMatchStatus(match.id,"live").then(loadLive)} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#2DB87A] text-white hover:opacity-80">▶ Start</button>
              <button onClick={() => updateMatchStatus(match.id,"completed").then(loadLive)} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-red-800 text-red-200 hover:opacity-80">■ End match</button>
            </div>
          </div>

          {/* Step 1 */}
          <div className="px-4 py-4 border-b border-[#1B3A6E]">
            <div className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-[3px] mb-3">1 · Select team</div>
            <div className="grid grid-cols-2 gap-3">
              {(["home","away"] as const).map((side) => (
                <button key={side} onClick={() => { setSelectedSide(side===selectedSide?null:side); setSelectedPlayer(null); }}
                  className={`py-4 font-black uppercase text-sm tracking-wide border-2 transition-all ${selectedSide===side?"border-[#1B6FC8] bg-[#1B6FC8]/20 text-white":"border-[#1B3A6E] text-[#7A9CC8] hover:border-[#38B6E8] hover:text-white"}`}>
                  {side==="home"?match.home_team?.name:match.away_team?.name}
                  <div className="text-[10px] font-normal mt-1 opacity-60">{side}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          {selectedSide && (
            <div className="px-4 py-4 border-b border-[#1B3A6E]">
              <div className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-[3px] mb-3">2 · Select player</div>
              {activePlayers.length === 0
                ? <div className="text-[#3A5A8E] text-sm text-center py-4">No players registered yet</div>
                : <div className="grid grid-cols-3 gap-2">
                    {activePlayers.map((p) => (
                      <button key={p.id} onClick={() => setSelectedPlayer(selectedPlayer?.id===p.id?null:p)}
                        className={`py-3 flex flex-col items-center border transition-all ${selectedPlayer?.id===p.id?"border-white bg-white/20 text-white":"border-[#1B3A6E] text-[#7A9CC8] hover:border-[#38B6E8] hover:text-white"}`}>
                        <span className="font-black text-lg leading-none">#{p.cap_number}</span>
                        <span className="text-[10px] mt-1 text-center leading-tight opacity-80 px-1">{p.name}</span>
                      </button>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* Step 3 */}
          {selectedPlayer && (
            <div className="px-4 py-4 border-b border-[#1B3A6E]">
              <div className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-[3px] mb-1">3 · Log event</div>
              <div className="text-white text-xs font-bold uppercase mb-3">#{selectedPlayer.cap_number} {selectedPlayer.name}</div>
              <div className="grid grid-cols-2 gap-2">
                {EVENTS.map(({ type, label, emoji, cls }) => (
                  <button key={type} onClick={() => logEvent(type)} disabled={saving}
                    className={`py-5 font-black uppercase text-sm tracking-wide disabled:opacity-50 transition-opacity ${cls}`}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Event log */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#7A9CC8] text-[10px] font-bold uppercase tracking-[3px]">Event log ({events.length})</span>
              {events.length > 0 && <button onClick={undoLast} disabled={saving} className="text-[10px] font-bold uppercase text-red-400 border border-red-900 px-3 py-1 hover:bg-red-900/30 disabled:opacity-50">↩ Undo</button>}
            </div>
            {events.length === 0
              ? <div className="text-center text-[#3A5A8E] text-sm py-8">No events logged yet</div>
              : <div className="space-y-1">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 bg-white/5 px-3 py-2.5 border border-[#1B3A6E]">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 ${BADGE[e.event_type]}`}>{e.event_type==="goal"?"Goal":e.event_type==="kickout"?"KO":e.event_type==="yellow_card"?"YC":"RC"}</span>
                      <span className="text-white text-xs font-bold uppercase flex-1">{e.player_name}</span>
                      <span className="text-[#7A9CC8] text-[10px]">{e.team_name}</span>
                      <span className="text-[#3A5A8E] text-[10px] font-bold">H{e.half}</span>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      ) : (
        <div className="text-center text-[#3A5A8E] py-20 text-sm">No live matches.<br /><span className="text-xs">Go to Fixtures and set a match to Live.</span></div>
      )}
    </div>
  );
}

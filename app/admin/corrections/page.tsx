"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMatches, getMatchEvents, deleteEventAndRecomputeScore } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from "@/components/ui-lite";

type Match = { id: string; status: string; day: number; match_time: string; home_score: number; away_score: number; home_team: { id: string; name: string } | null; away_team: { id: string; name: string } | null };
type EventRow = { id: string; event_type: string; half: number; created_at: string; players: { name: string; cap_number: number } | null; teams: { name: string } | null };

const EVENT_LABEL: Record<string, string> = { goal: "Goal", kickout: "Foul", yellow_card: "Yellow Card", red_card: "Red Card" };

export default function AdminCorrections() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [events,  setEvents]  = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const match = matches.find((m) => m.id === matchId);

  useEffect(() => {
    getMatches().then((data: any) => {
      const played = data.filter((m: Match) => m.status === "live" || m.status === "completed");
      setMatches(played);
      if (played.length > 0) setMatchId(played[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!matchId) return;
    getMatchEvents(matchId).then((data: any) => setEvents(data));
  }, [matchId]);

  async function handleDelete(eventId: string) {
    if (!match) return;
    try {
      await deleteEventAndRecomputeScore(eventId, match.id, match.home_team?.id, match.away_team?.id);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      const { data } = await supabase.from("matches").select("home_score,away_score").eq("id", match.id).single();
      if (data) setMatches((prev) => prev.map((m) => m.id === match.id ? { ...m, home_score: data.home_score, away_score: data.away_score } : m));
      setError(null);
    } catch (err: any) {
      console.error("delete event failed:", err);
      setError(err?.message || "Couldn't delete that event — check your connection.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Score Corrections</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Fix a goal or foul logged to the wrong player</div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <div className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 font-bold">✕</button>
          </div>
        )}

        <Select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          {matches.length === 0 && <option>No live or completed matches yet</option>}
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              Day {m.day} · {m.home_team?.name} {m.home_score}–{m.away_score} {m.away_team?.name} {m.status === "live" ? "(live)" : ""}
            </option>
          ))}
        </Select>

        {match && (
          <Card>
            <CardHeader>
              <CardTitle>{match.home_team?.name} vs {match.away_team?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading
                ? <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
                : events.length === 0
                  ? <div className="text-center py-8 text-gray-400 text-sm">No events logged for this match yet</div>
                  : <div className="divide-y divide-gray-100">
                      {events.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                          <Badge variant={e.event_type === "goal" ? "success" : e.event_type === "red_card" ? "default" : "secondary"}>{EVENT_LABEL[e.event_type] ?? e.event_type}</Badge>
                          <span className="text-sm font-semibold text-gray-900">#{e.players?.cap_number} {e.players?.name}</span>
                          <span className="text-xs text-gray-400">{e.teams?.name} · H{e.half}</span>
                          <Button size="sm" variant="ghost" className="ml-auto text-red-600 hover:bg-red-50" onClick={() => handleDelete(e.id)}>Delete</Button>
                        </div>
                      ))}
                    </div>
              }
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
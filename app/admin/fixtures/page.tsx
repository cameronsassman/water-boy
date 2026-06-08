"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchStatus } from "@/lib/db";

type Match = {
  id: string; status: string; home_score: number; away_score: number;
  match_time: string; day: number; stage: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  groups: { name: string } | null;
  pools: { name: string } | null;
};

type Team   = { id: string; name: string; group_id: string };
type Pool   = { id: string; name: string };
type Group  = { id: string; name: string; pool_id: string };

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

const STAGES = [
  "group","cup_r16","cup_qf","cup_sf","cup_final",
  "shield_qf","shield_sf","shield_final",
  "plate_sf","plate_final","festival",
];

export default function AdminFixtures() {
  const [activeDay, setActiveDay] = useState(2);
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [pools,     setPools]     = useState<Pool[]>([]);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // Form state
  const [homeId,    setHomeId]    = useState("");
  const [awayId,    setAwayId]    = useState("");
  const [poolId,    setPoolId]    = useState("");
  const [groupId,   setGroupId]   = useState("");
  const [stage,     setStage]     = useState("group");
  const [day,       setDay]       = useState("2");
  const [time,      setTime]      = useState("09:00");

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("pools").select("*").order("name"),
      supabase.from("groups").select("*").order("name"),
    ]).then(([{ data: t }, { data: p }, { data: g }]) => {
      setTeams((t as Team[]) ?? []);
      setPools((p as Pool[]) ?? []);
      setGroups((g as Group[]) ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.from("matches").select(SELECT).eq("day", activeDay).order("match_time")
      .then(({ data }) => { setMatches((data as Match[]) ?? []); setLoading(false); });
  }, [activeDay]);

  async function createFixture() {
    if (!homeId || !awayId || !poolId) return;
    setSaving(true);
    const { data: t } = await supabase.from("tournaments").select("id").single();
    await supabase.from("matches").insert({
      tournament_id: t?.id,
      home_team_id: homeId,
      away_team_id: awayId,
      pool_id: poolId,
      group_id: groupId || null,
      stage,
      day: parseInt(day),
      match_time: time,
      status: "scheduled",
    });
    // Refresh
    const { data } = await supabase.from("matches").select(SELECT).eq("day", activeDay).order("match_time");
    setMatches((data as Match[]) ?? []);
    setHomeId(""); setAwayId(""); setSaving(false);
  }

  async function setStatus(matchId: string, status: "scheduled" | "live" | "completed") {
    await updateMatchStatus(matchId, status);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status } : m));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] border-b border-[#1B3A6E] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Fixtures</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage match schedule · Set match status</div>
      </div>

      {/* Day tabs */}
      <div className="border-b-2 border-gray-200 bg-white">
        <div className="flex">
          {[1,2,3,4].map((d) => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${activeDay === d ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              Day {d}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Existing matches */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="font-black uppercase text-sm text-gray-900">Day {activeDay} Matches</span>
          </div>
          {loading
            ? <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading...</div>
            : matches.length === 0
              ? <div className="px-4 py-8 text-center text-gray-400 text-sm">No matches for Day {activeDay}</div>
              : <div className="divide-y divide-gray-100">
                  {matches.map((m) => {
                    const isLive = m.status === "live";
                    const isDone = m.status === "completed";
                    return (
                      <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isLive ? "bg-blue-50" : ""}`}>
                        <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm uppercase text-gray-900 truncate">
                            {m.home_team?.name} <span className="text-gray-400 font-normal">vs</span> {m.away_team?.name}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase">{m.pools?.name} · {m.groups?.name} · {m.stage}</div>
                        </div>
                        {m.status !== "scheduled" && (
                          <span className="font-black text-sm text-gray-600">{m.home_score}–{m.away_score}</span>
                        )}
                        {/* Status controls */}
                        <div className="flex gap-1 shrink-0">
                          {!isLive && !isDone && (
                            <button onClick={() => setStatus(m.id, "live")} className="text-[10px] font-bold uppercase px-2 py-1 bg-[#2DB87A] text-white hover:opacity-80">▶ Live</button>
                          )}
                          {isLive && (
                            <button onClick={() => setStatus(m.id, "completed")} className="text-[10px] font-bold uppercase px-2 py-1 bg-red-600 text-white hover:opacity-80">■ End</button>
                          )}
                          {isDone && (
                            <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-400">FT</span>
                          )}
                          {!isDone && (
                            <button onClick={() => setStatus(m.id, "scheduled")} className="text-[10px] font-bold uppercase px-2 py-1 border border-gray-200 text-gray-400 hover:border-gray-400">Reset</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
          }
        </div>

        {/* Add fixture */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="font-black uppercase text-sm text-gray-900">Add New Fixture</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Home team</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={homeId} onChange={(e) => setHomeId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Away team</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={awayId} onChange={(e) => setAwayId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pool</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={poolId} onChange={(e) => setPoolId(e.target.value)}>
                  <option value="">Select...</option>
                  {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Group</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">None</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Stage</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Day</label>
                <select className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={day} onChange={(e) => setDay(e.target.value)}>
                  {[1,2,3,4].map((d) => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Time</label>
                <input type="time" className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6FC8]" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <button onClick={createFixture} disabled={saving || !homeId || !awayId || !poolId}
              className="mt-4 w-full bg-[#1B6FC8] text-white text-xs font-bold uppercase tracking-widest py-3 hover:bg-[#0D4A8A] disabled:opacity-50 transition-colors">
              {saving ? "Creating..." : "Create Fixture"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

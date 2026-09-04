"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchStatus } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label, Select } from "@/components/ui-lite";

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

const STAGE_BADGE: Record<string, "default"|"secondary"|"warning"|"success"> = {
  group: "secondary", cup_r16: "default", cup_qf: "default", cup_sf: "default", cup_final: "default",
  shield_qf: "warning", shield_sf: "warning", shield_final: "warning",
  plate_sf: "success", plate_final: "success", festival: "secondary",
};

export default function AdminFixtures() {
  const [activeDay, setActiveDay] = useState(2);
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [pools,     setPools]     = useState<Pool[]>([]);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

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
      <div className="bg-[#07091F] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Fixtures</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage match schedule · Set match status</div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white">
        <div className="flex">
          {[1,2,3,4].map((d) => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${activeDay === d ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              Day {d}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Day {activeDay} Matches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
              : matches.length === 0
                ? <div className="px-5 py-8 text-center text-gray-400 text-sm">No matches for Day {activeDay}</div>
                : <div className="divide-y divide-gray-100">
                    {matches.map((m) => {
                      const isLive = m.status === "live";
                      const isDone = m.status === "completed";
                      return (
                        <div key={m.id} className={`flex items-center gap-3 px-5 py-3 flex-wrap ${isLive ? "bg-blue-50" : ""}`}>
                          <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
                          <div className="flex-1 min-w-[180px]">
                            <div className="font-bold text-sm text-gray-900 truncate">
                              {m.home_team?.name} <span className="text-gray-400 font-normal">vs</span> {m.away_team?.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline">{m.pools?.name}</Badge>
                              {m.groups?.name && <Badge variant="outline">{m.groups.name}</Badge>}
                              <Badge variant={STAGE_BADGE[m.stage] ?? "secondary"}>{m.stage}</Badge>
                              {isLive && <Badge variant="success">● Live</Badge>}
                              {isDone && <Badge variant="secondary">Full time</Badge>}
                            </div>
                          </div>
                          {m.status !== "scheduled" && (
                            <span className="font-black text-sm text-gray-700">{m.home_score}–{m.away_score}</span>
                          )}
                          <div className="flex gap-1.5 shrink-0">
                            {!isLive && !isDone && (
                              <Button size="sm" onClick={() => setStatus(m.id, "live")} className="bg-green-600 hover:bg-green-700">▶ Live</Button>
                            )}
                            {isLive && (
                              <Button size="sm" variant="destructive" onClick={() => setStatus(m.id, "completed")}>■ End</Button>
                            )}
                            {!isDone && (
                              <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "scheduled")}>Reset</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Fixture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Home team</Label>
                <Select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Away team</Label>
                <Select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Pool</Label>
                <Select value={poolId} onChange={(e) => setPoolId(e.target.value)}>
                  <option value="">Select...</option>
                  {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Group</Label>
                <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">None</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>Day</Label>
                <Select value={day} onChange={(e) => setDay(e.target.value)}>
                  {[1,2,3,4].map((d) => <option key={d} value={d}>Day {d}</option>)}
                </Select>
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <Button onClick={createFixture} disabled={saving || !homeId || !awayId || !poolId} className="mt-4 w-full">
              {saving ? "Creating..." : "+ Create Fixture"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
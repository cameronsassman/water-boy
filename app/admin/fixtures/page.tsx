"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchStatus, updateMatch, deleteMatch } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label, Select } from "@/components/ui-lite";

type Match = {
  id: string; status: string; home_score: number; away_score: number;
  match_time: string; day: number; stage: string;
  home_team_id: string; away_team_id: string; pool_id: string; group_id: string | null;
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

const STAGE_LABEL: Record<string, string> = {
  group: "Group stage", cup_r16: "Cup R16", cup_qf: "Cup QF", cup_sf: "Cup SF", cup_final: "Cup Final",
  shield_qf: "Shield QF", shield_sf: "Shield SF", shield_final: "Shield Final",
  plate_sf: "Plate SF", plate_final: "Plate Final", festival: "Festival",
};

const STAGE_BADGE: Record<string, "default"|"secondary"|"warning"|"success"> = {
  group: "secondary", cup_r16: "default", cup_qf: "default", cup_sf: "default", cup_final: "default",
  shield_qf: "warning", shield_sf: "warning", shield_final: "warning",
  plate_sf: "success", plate_final: "success", festival: "secondary",
};

// Collapse the 11 stages into 4 simple buckets for the match-list filter.
type Bucket = "all" | "group" | "knockout" | "festival";
function bucketOf(stage: string): Bucket {
  if (stage === "group") return "group";
  if (stage === "festival") return "festival";
  return "knockout";
}
const BUCKETS: { key: Bucket; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "group",     label: "Group" },
  { key: "knockout",  label: "Knockout" },
  { key: "festival",  label: "Festival" },
];

// Simple label for a team's option in the picker, e.g. "Sharks (Group A)"
function teamLabel(team: Team, groups: Group[]): string {
  const g = groups.find((g) => g.id === team.group_id);
  return g ? `${team.name} (${g.name})` : team.name;
}

export default function AdminFixtures() {
  const [activeDay, setActiveDay] = useState(0); // 0 = all days
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [pools,     setPools]     = useState<Pool[]>([]);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Match-list filter — one simple bucket, plus the existing day tabs
  const [filterBucket, setFilterBucket] = useState<Bucket>("all");

  // New fixture — only the essentials are visible by default
  const [homeId,    setHomeId]    = useState("");
  const [awayId,    setAwayId]    = useState("");
  const [day,       setDay]       = useState("1");
  const [time,      setTime]      = useState("09:00");
  const [showMore,  setShowMore]  = useState(false);
  const [poolId,    setPoolId]    = useState("");
  const [groupId,   setGroupId]   = useState("");
  const [stage,     setStage]     = useState("group");

  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editDraft,  setEditDraft]  = useState({ homeId: "", awayId: "", poolId: "", groupId: "", stage: "group", day: "1", time: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moreActionsId, setMoreActionsId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("pools").select("*").order("name"),
      supabase.from("groups").select("*").order("name"),
    ]).then(([{ data: t }, { data: p }, { data: g }]) => {
      setTeams((t as Team[]) ?? []);
      setPools((p as Pool[]) ?? []);
      setGroups((g as Group[]) ?? []);
      // Default the venue to the first pool so most people never have to touch it.
      if (p && p.length > 0) setPoolId((current) => current || p[0].id);
    });
  }, []);

  useEffect(() => {
    supabase.from("matches").select(SELECT).order("day").order("match_time")
      .then(({ data }) => { setMatches((data as Match[]) ?? []); setLoading(false); });
  }, []);

  const filteredMatches = useMemo(
    () => matches
      .filter((m) => (activeDay === 0 || m.day === activeDay) && (filterBucket === "all" || bucketOf(m.stage) === filterBucket))
      .sort((a, b) => a.day - b.day || a.match_time.localeCompare(b.match_time)),
    [matches, filterBucket, activeDay]
  );

  // Teams grouped by their group, for easy scanning — never restricts who can play whom.
  const teamsByGroup = useMemo(() => {
    const sorted = [...teams].sort((a, b) => teamLabel(a, groups).localeCompare(teamLabel(b, groups)));
    return sorted;
  }, [teams, groups]);

  function resetCreateForm() {
    setHomeId(""); setAwayId("");
  }

  async function createFixture() {
    if (!homeId || !awayId || !poolId) return;
    if (homeId === awayId) {
      setCreateMsg({ type: "error", text: "Home and away team can't be the same." });
      return;
    }
    const parsedDay = parseInt(day, 10);
    if (Number.isNaN(parsedDay)) {
      setCreateMsg({ type: "error", text: "Please select a valid day." });
      return;
    }

    setSaving(true);
    setCreateMsg(null);
    try {
      const { data: t, error: tError } = await supabase.from("tournaments").select("id").single();
      if (tError || !t?.id) throw tError ?? new Error("No tournament found — create a tournament first.");

      const { error: insertError } = await supabase.from("matches").insert({
        tournament_id: t.id,
        home_team_id: homeId,
        away_team_id: awayId,
        pool_id: poolId,
        group_id: groupId || null,
        stage,
        day: parsedDay,
        match_time: time,
        status: "scheduled",
      });
      if (insertError) throw insertError;

      const { data, error: refetchError } = await supabase.from("matches").select(SELECT).order("day").order("match_time");
      if (refetchError) throw refetchError;
      setMatches((data as Match[]) ?? []);

      setCreateMsg({ type: "success", text: `Fixture created for Day ${parsedDay}.` });
      resetCreateForm();
    } catch (err: any) {
      console.error("createFixture failed:", err);
      setCreateMsg({ type: "error", text: err?.message || "Failed to create fixture. Check the console for details." });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(matchId: string, status: "scheduled" | "live" | "completed") {
    await updateMatchStatus(matchId, status);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status } : m));
  }

  function startEdit(m: Match) {
    setEditingId(m.id);
    setMoreActionsId(null);
    setEditDraft({ homeId: m.home_team_id, awayId: m.away_team_id, poolId: m.pool_id, groupId: m.group_id ?? "", stage: m.stage, day: String(m.day), time: m.match_time });
  }

  async function handleSaveEdit(matchId: string) {
    if (!editDraft.homeId || !editDraft.awayId || !editDraft.poolId || savingEdit) return;
    if (editDraft.homeId === editDraft.awayId) return;
    setSavingEdit(true);
    try {
      await updateMatch(matchId, {
        home_team_id: editDraft.homeId, away_team_id: editDraft.awayId,
        pool_id: editDraft.poolId, group_id: editDraft.groupId || null,
        stage: editDraft.stage, day: parseInt(editDraft.day), match_time: editDraft.time,
      });
      const { data } = await supabase.from("matches").select(SELECT).order("day").order("match_time");
      setMatches((data as Match[]) ?? []);
      setEditingId(null);
    } catch (err) { console.error(err); }
    finally { setSavingEdit(false); }
  }

  async function handleDeleteMatch(matchId: string) {
    setDeletingId(matchId);
    try {
      await deleteMatch(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setConfirmDeleteId(null);
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] px-4 sm:px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Fixtures</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage match schedule · Set match status</div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white">
        <div className="flex">
          {[0,1,2,3,4].map((d) => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 transition-colors ${activeDay === d ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              {d === 0 ? "All" : `Day ${d}`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Simple stage filter — one row of pills, no forms to fill in */}
        <div className="flex gap-1.5 flex-wrap">
          {BUCKETS.map((b) => (
            <button
              key={b.key}
              onClick={() => setFilterBucket(b.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                filterBucket === b.key ? "bg-[#1B6FC8] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#1B6FC8]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* One column per pool, side by side on desktop, stacked on mobile */}
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 items-start ${pools.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {pools.map((pool) => {
          const poolMatches = filteredMatches.filter((m) => m.pool_id === pool.id);
          const poolLive = poolMatches.filter((m) => m.status === "live").length;
          return (
        <Card key={pool.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{pool.name}</CardTitle>
              <span className="text-[11px] text-gray-400 font-medium">
                {poolMatches.length} match{poolMatches.length === 1 ? "" : "es"}{poolLive > 0 ? ` · ${poolLive} live` : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
              : poolMatches.length === 0
                ? <div className="px-5 py-8 text-center text-gray-400 text-sm">No matches{activeDay ? ` on Day ${activeDay}` : ""}</div>
                  : <div>
                    {Array.from(new Set(poolMatches.map((m) => m.day))).map((dayNum) => (
                    <div key={dayNum}>
                    <div className="px-4 sm:px-5 py-1.5 bg-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-y border-gray-200">Day {dayNum}</div>
                    <div className="divide-y divide-gray-100">
                    {poolMatches.filter((m) => m.day === dayNum).map((m) => {
                      const isLive = m.status === "live";
                      const isDone = m.status === "completed";
                      const isMenuOpen = moreActionsId === m.id;

                      if (editingId === m.id) {
                        return (
                          <div key={m.id} className="px-4 sm:px-5 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <Select value={editDraft.homeId} onChange={(e) => setEditDraft((d) => ({ ...d, homeId: e.target.value }))}>
                                <option value="">Home team...</option>
                                {teamsByGroup.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, groups)}</option>)}
                              </Select>
                              <Select value={editDraft.awayId} onChange={(e) => setEditDraft((d) => ({ ...d, awayId: e.target.value }))}>
                                <option value="">Away team...</option>
                                {teamsByGroup.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, groups)}</option>)}
                              </Select>
                              <Select value={editDraft.poolId} onChange={(e) => setEditDraft((d) => ({ ...d, poolId: e.target.value }))}>
                                <option value="">Pool...</option>
                                {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </Select>
                              <Select value={editDraft.groupId} onChange={(e) => setEditDraft((d) => ({ ...d, groupId: e.target.value }))}>
                                <option value="">No group</option>
                                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </Select>
                              <Select value={editDraft.stage} onChange={(e) => setEditDraft((d) => ({ ...d, stage: e.target.value }))}>
                                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                              </Select>
                              <Select value={editDraft.day} onChange={(e) => setEditDraft((d) => ({ ...d, day: e.target.value }))}>
                                {[1,2,3,4].map((d) => <option key={d} value={d}>Day {d}</option>)}
                              </Select>
                              <Input type="time" value={editDraft.time} onChange={(e) => setEditDraft((d) => ({ ...d, time: e.target.value }))} />
                            </div>
                            {editDraft.homeId && editDraft.homeId === editDraft.awayId && (
                              <div className="text-xs text-red-600 mb-2">Home and away team can't be the same.</div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEdit(m.id)} disabled={savingEdit || !editDraft.homeId || !editDraft.awayId || !editDraft.poolId || editDraft.homeId === editDraft.awayId}>
                                {savingEdit ? "Saving..." : "Save changes"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id} className={isLive ? "bg-blue-50" : ""}>
                          <div className="flex items-center gap-3 px-4 sm:px-5 py-3 flex-wrap">
                            <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
                            <div className="flex-1 min-w-[180px]">
                              <div className="font-bold text-sm text-gray-900 truncate">
                                {m.home_team?.name} <span className="text-gray-400 font-normal">vs</span> {m.away_team?.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant={STAGE_BADGE[m.stage] ?? "secondary"}>{STAGE_LABEL[m.stage] ?? m.stage}</Badge>
                                {isLive && <Badge variant="success">● Live</Badge>}
                                {isDone && <Badge variant="secondary">Full time</Badge>}
                              </div>
                            </div>
                            {m.status !== "scheduled" && (
                              <span className="font-black text-sm text-gray-700">{m.home_score}–{m.away_score}</span>
                            )}

                            {/* One primary action per row — everything else is behind the ⋯ */}
                            <div className="flex gap-1.5 shrink-0 items-center">
                              {!isLive && !isDone && (
                                <Button size="sm" onClick={() => setStatus(m.id, "live")} className="bg-green-600 hover:bg-green-700">▶ Start</Button>
                              )}
                              {isLive && (
                                <Button size="sm" variant="destructive" onClick={() => setStatus(m.id, "completed")}>■ End</Button>
                              )}
                              <button
                                onClick={() => setMoreActionsId(isMenuOpen ? null : m.id)}
                                aria-label="More actions"
                                className={`w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 ${isMenuOpen ? "bg-gray-100 text-gray-700" : ""}`}
                              >
                                ⋯
                              </button>
                            </div>
                          </div>

                          {isMenuOpen && (
                            <div className="flex items-center gap-2 px-4 sm:px-5 pb-3 flex-wrap">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>Edit</Button>
                              {!isDone && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "scheduled")}>Reset to scheduled</Button>
                              )}
                              {confirmDeleteId === m.id ? (
                                <>
                                  <span className="text-[10px] text-red-600">Delete this match?</span>
                                  <Button size="sm" variant="destructive" disabled={deletingId === m.id} onClick={() => handleDeleteMatch(m.id)}>
                                    {deletingId === m.id ? "..." : "Confirm"}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                                </>
                              ) : (
                                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDeleteId(m.id)}>Delete</Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                    </div>
                    ))}
                  </div>
            }
          </CardContent>
        </Card>
          );
        })}
        </div>

        <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Fixture</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Just the essentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Home team</Label>
                <Select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
                  <option value="">Select...</option>
                  {teamsByGroup.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, groups)}</option>)}
                </Select>
              </div>
              <div>
                <Label>Away team</Label>
                <Select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
                  <option value="">Select...</option>
                  {teamsByGroup.map((t) => <option key={t.id} value={t.id}>{teamLabel(t, groups)}</option>)}
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

            {homeId && homeId === awayId && (
              <div className="mt-2 text-xs text-red-600">Home and away team can't be the same.</div>
            )}

            {/* Everything else — venue, group, stage — defaults sensibly and stays out of the way */}
            <button
              onClick={() => setShowMore((v) => !v)}
              className="mt-4 text-xs font-bold uppercase tracking-wide text-[#1B6FC8] hover:underline"
            >
              {showMore ? "Fewer options ▴" : "More options (venue, stage, group) ▾"}
            </button>

            {showMore && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label>Pool (venue)</Label>
                  <Select value={poolId} onChange={(e) => setPoolId(e.target.value)}>
                    <option value="">Select...</option>
                    {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Group (optional)</Label>
                  <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                    <option value="">None</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                    {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </Select>
                </div>
              </div>
            )}

            <Button onClick={createFixture} disabled={saving || !homeId || !awayId || !poolId || homeId === awayId} className="mt-4 w-full">
              {saving ? "Creating..." : "+ Create Fixture"}
            </Button>
            {createMsg && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  createMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {createMsg.type === "success" ? "✓ " : "✗ "}
                {createMsg.text}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
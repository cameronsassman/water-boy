"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { updateMatchStatus, updateMatch, deleteMatch } from "@/lib/db";
import { EXTRA_STAGES, isFestivalStage } from "@/lib/knockoutSchedule";
import KnockoutGenerator from "@/components/admin/KnockoutGenerator";
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
  ...EXTRA_STAGES.map((x) => x.key),
];

const STAGE_LABEL: Record<string, string> = {
  group: "Group stage", cup_r16: "Cup R16", cup_qf: "Cup QF", cup_sf: "Cup SF", cup_final: "Cup Final",
  shield_qf: "Shield QF", shield_sf: "Shield SF", shield_final: "Shield Final",
  plate_sf: "Plate SF", plate_final: "Plate Final", festival: "Festival",
  ...Object.fromEntries(EXTRA_STAGES.map((x) => [x.key, x.label])),
};

const STAGE_BADGE: Record<string, "default"|"secondary"|"warning"|"success"> = {
  group: "secondary", cup_r16: "default", cup_qf: "default", cup_sf: "default", cup_final: "default",
  shield_qf: "warning", shield_sf: "warning", shield_final: "warning",
  plate_sf: "success", plate_final: "success", festival: "secondary",
  ...Object.fromEntries(EXTRA_STAGES.map((x) => [x.key, x.family === "festival" ? "secondary" : "default"])),
  shield_third: "warning", plate_third: "success",
};

// Collapse all stages into 4 simple buckets for the match-list filter.
type Bucket = "all" | "group" | "knockout" | "festival";
function bucketOf(stage: string): Bucket {
  if (stage === "group") return "group";
  if (isFestivalStage(stage)) return "festival";
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

function addMinutes(t: string, mins: number): string {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Next free slot in a pool on a day = last match time there + gap (09:00 if empty).
function suggestTime(list: Match[], poolId: string, day: number, gap: number): string {
  const times = list
    .filter((m) => m.pool_id === poolId && m.day === day)
    .map((m) => m.match_time.slice(0, 5))
    .sort();
  return times.length ? addMinutes(times[times.length - 1], gap) : "09:00";
}

// Same day + time + pool + pair of teams (either way round) = same fixture.
function fixtureKey(day: number, time: string, poolId: string, a: string, b: string): string {
  return `${day}|${time.slice(0, 5)}|${poolId}|${[a, b].sort().join("|")}`;
}

const norm = (s: string) => s.trim().toLowerCase();

function pickUnique<T>(items: T[], name: (t: T) => string, input: string): T | null {
  const x = norm(input);
  if (!x) return null;
  const exact = items.filter((i) => norm(name(i)) === x);
  if (exact.length === 1) return exact[0];
  const partial = items.filter((i) => norm(name(i)).includes(x));
  return partial.length === 1 ? partial[0] : null;
}

type BulkRow = {
  line: string;
  error?: string;
  duplicate?: "existing" | "pasted";
  row?: {
    day: number; match_time: string; pool_id: string; home_team_id: string;
    away_team_id: string; group_id: string | null; stage: string;
  };
};

export default function AdminFixtures() {
  const [activeDay, setActiveDay] = useState(0); // 0 = all days
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [pools,     setPools]     = useState<Pool[]>([]);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [filterBucket, setFilterBucket] = useState<Bucket>("all");

  // New fixture — day, pool, time, stage and group stay put between saves; only teams reset.
  const [homeId,    setHomeId]    = useState("");
  const [awayId,    setAwayId]    = useState("");
  const [day,       setDay]       = useState("1");
  const [time,      setTime]      = useState("09:00");
  const [gap,       setGap]       = useState(20); // minutes between matches in a pool
  const [showMore,  setShowMore]  = useState(false);
  const [poolId,    setPoolId]    = useState("");
  const [groupId,   setGroupId]   = useState("");
  const [stage,     setStage]     = useState("group");

  // Bulk paste
  const [showBulk,   setShowBulk]   = useState(false);
  const [bulkText,   setBulkText]   = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

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
      console.log(`Teams (${t?.length ?? 0}):`);
      console.table((t as Team[] | null)?.map((x) => ({ id: x.id, name: x.name, group_id: x.group_id })) ?? []);
      console.log("Pools:", p);
      if (p && p.length > 0) setPoolId((current) => current || p[0].id);
    });
  }, []);

  useEffect(() => {
    supabase.from("matches").select(SELECT).order("day").order("match_time")
      .then(({ data }) => {
        const list = (data as Match[]) ?? [];
        setMatches(list);
        setLoading(false);
      });
  }, []);

  const filteredMatches = useMemo(
    () => matches
      .filter((m) => (activeDay === 0 || m.day === activeDay) && (filterBucket === "all" || bucketOf(m.stage) === filterBucket))
      .sort((a, b) => a.day - b.day || a.match_time.localeCompare(b.match_time)),
    [matches, filterBucket, activeDay]
  );

  const teamsByGroup = useMemo(() => {
    return [...teams].sort((a, b) => teamLabel(a, groups).localeCompare(teamLabel(b, groups)));
  }, [teams, groups]);

  async function refetch() {
    const { data, error } = await supabase.from("matches").select(SELECT).order("day").order("match_time");
    if (error) throw error;
    const list = (data as Match[]) ?? [];
    setMatches(list);
    return list;
  }

  function changePool(id: string) {
    setPoolId(id);
    setTime(suggestTime(matches, id, parseInt(day, 10), gap));
  }

  function changeDay(d: string) {
    setDay(d);
    setTime(suggestTime(matches, poolId, parseInt(d, 10), gap));
  }

  async function createFixture() {
    if (!homeId || !awayId || !poolId || saving) return;
    if (homeId === awayId) {
      setCreateMsg({ type: "error", text: "Home and away team can't be the same." });
      return;
    }
    const parsedDay = parseInt(day, 10);
    if (Number.isNaN(parsedDay)) {
      setCreateMsg({ type: "error", text: "Please select a valid day." });
      return;
    }

    if (existingKeys.has(fixtureKey(parsedDay, time, poolId, homeId, awayId))) {
      setCreateMsg({ type: "error", text: "That fixture already exists (same teams, pool, day and time)." });
      return;
    }

    setSaving(true);
    setCreateMsg(null);
    try {
      const { data: t, error: tError } = await supabase.from("tournaments").select("id").single();
      if (tError || !t?.id) throw tError ?? new Error("No tournament found — create a tournament first.");

      // Group defaults to the home team's group for group-stage matches.
      const homeTeam = teams.find((x) => x.id === homeId);
      const resolvedGroup = groupId || (stage === "group" ? homeTeam?.group_id ?? null : null);

      const { error: insertError } = await supabase.from("matches").insert({
        tournament_id: t.id,
        home_team_id: homeId,
        away_team_id: awayId,
        pool_id: poolId,
        group_id: resolvedGroup,
        stage,
        day: parsedDay,
        match_time: time,
        status: "scheduled",
      });
      if (insertError) throw insertError;

      const list = await refetch();
      const next = suggestTime(list, poolId, parsedDay, gap);

      setCreateMsg({ type: "success", text: `Fixture created for Day ${parsedDay} at ${time}.` });
      // Keep day / pool / stage / group. Clear teams, bump time to the next free slot.
      setHomeId(""); setAwayId(""); setTime(next);
    } catch (err: any) {
      console.error("createFixture failed:", err);
      setCreateMsg({ type: "error", text: err?.message || "Failed to create fixture. Check the console for details." });
    } finally {
      setSaving(false);
    }
  }

  // Copy a match's day/pool/stage/group into the form; just pick the teams.
  function duplicateMatch(m: Match) {
    setMoreActionsId(null);
    setDay(String(m.day));
    setPoolId(m.pool_id);
    setStage(m.stage);
    setGroupId(m.group_id ?? "");
    setHomeId(""); setAwayId("");
    setTime(suggestTime(matches, m.pool_id, m.day, gap));
    document.getElementById("add-fixture")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Bulk paste ─────────────────────────────────────────────
  // One match per line: day, time, pool, home, away[, stage]
  const existingKeys = useMemo(
    () => new Set(matches.map((m) => fixtureKey(m.day, m.match_time, m.pool_id, m.home_team_id, m.away_team_id))),
    [matches]
  );

  const bulkRows: BulkRow[] = useMemo(() => {
    const seen = new Set<string>();
    return bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line): BulkRow => {
        const parts = line.split(/\t|,/).map((p) => p.trim());
        if (parts.length < 5) return { line, error: "Need: day, time, pool, home, away" };
        const [d, tm, poolName, homeName, awayName, stageRaw] = parts;

        const dayNum = parseInt(d.replace(/day/i, ""), 10);
        if (![1, 2, 3, 4].includes(dayNum)) return { line, error: `Bad day "${d}"` };

        const tmMatch = tm.match(/^(\d{1,2})[:.h](\d{2})$/);
        if (!tmMatch) return { line, error: `Bad time "${tm}" (use 09:00)` };
        const match_time = `${tmMatch[1].padStart(2, "0")}:${tmMatch[2]}`;

        const pool = pickUnique(pools, (p) => p.name, poolName);
        if (!pool) return { line, error: `Pool "${poolName}" not found` };

        const home = pickUnique(teams, (t) => t.name, homeName);
        if (!home) return { line, error: `Team "${homeName}" not found or ambiguous` };
        const away = pickUnique(teams, (t) => t.name, awayName);
        if (!away) return { line, error: `Team "${awayName}" not found or ambiguous` };
        if (home.id === away.id) return { line, error: "Same team twice" };

        let st = "group";
        if (stageRaw) {
          const s = norm(stageRaw);
          const found = STAGES.find((k) => k === s.replace(/\s+/g, "_") || norm(STAGE_LABEL[k]) === s);
          if (!found) return { line, error: `Unknown stage "${stageRaw}"` };
          st = found;
        }

        const key = fixtureKey(dayNum, match_time, pool.id, home.id, away.id);
        let duplicate: BulkRow["duplicate"];
        if (existingKeys.has(key)) duplicate = "existing";
        else if (seen.has(key)) duplicate = "pasted";
        seen.add(key);

        return {
          line,
          duplicate,
          row: {
            day: dayNum, match_time, pool_id: pool.id,
            home_team_id: home.id, away_team_id: away.id,
            group_id: st === "group" ? home.group_id ?? null : null,
            stage: st,
          },
        };
      });
  }, [bulkText, pools, teams, existingKeys]);

  const bulkNew = bulkRows.filter((r) => r.row && !r.duplicate);
  const bulkDupes = bulkRows.filter((r) => r.duplicate);
  const bulkErrors = bulkRows.filter((r) => r.error);

  async function importBulk() {
    if (bulkNew.length === 0 || bulkErrors.length > 0 || bulkSaving) return;
    setBulkSaving(true);
    setCreateMsg(null);
    try {
      const { data: t, error: tError } = await supabase.from("tournaments").select("id").single();
      if (tError || !t?.id) throw tError ?? new Error("No tournament found — create a tournament first.");

      // Re-check against the database right now, in case someone else added fixtures meanwhile.
      const fresh = await refetch();
      const freshKeys = new Set(fresh.map((m) => fixtureKey(m.day, m.match_time, m.pool_id, m.home_team_id, m.away_team_id)));
      const toInsert = bulkNew.filter((r) => {
        const x = r.row!;
        return !freshKeys.has(fixtureKey(x.day, x.match_time, x.pool_id, x.home_team_id, x.away_team_id));
      });

      if (toInsert.length > 0) {
        const { error } = await supabase.from("matches").insert(
          toInsert.map((r) => ({ ...r.row!, tournament_id: t.id, status: "scheduled" }))
        );
        if (error) throw error;
        await refetch();
      }

      const skipped = bulkRows.filter((r) => r.row).length - toInsert.length;
      setCreateMsg({
        type: "success",
        text: `${toInsert.length} fixture${toInsert.length === 1 ? "" : "s"} created${skipped > 0 ? `, ${skipped} skipped (already exist)` : ""}.`,
      });
      setBulkText("");
    } catch (err: any) {
      console.error("importBulk failed:", err);
      setCreateMsg({ type: "error", text: err?.message || "Bulk import failed." });
    } finally {
      setBulkSaving(false);
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
      await refetch();
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
                              <Button size="sm" variant="ghost" onClick={() => duplicateMatch(m)}>Duplicate</Button>
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

        <div id="add-fixture" className="max-w-3xl space-y-6 scroll-mt-4">
        <KnockoutGenerator teams={teams} pools={pools} groups={groups} onChangedAction={async () => { await refetch(); }} />
        <Card>
          <CardHeader>
            <CardTitle>Add New Fixture</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") createFixture();
              }}
            >
              {/* Venue / day / time stay between saves; time jumps to the next free slot */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label>Pool</Label>
                  <Select value={poolId} onChange={(e) => changePool(e.target.value)}>
                    <option value="">Select...</option>
                    {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Day</Label>
                  <Select value={day} onChange={(e) => changeDay(e.target.value)}>
                    {[1,2,3,4].map((d) => <option key={d} value={d}>Day {d}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                    {teamsByGroup.filter((t) => t.id !== homeId).map((t) => <option key={t.id} value={t.id}>{teamLabel(t, groups)}</option>)}
                  </Select>
                </div>
              </div>

              {homeId && homeId === awayId && (
                <div className="mt-2 text-xs text-red-600">Home and away team can't be the same.</div>
              )}

              <button
                onClick={() => setShowMore((v) => !v)}
                className="mt-4 text-xs font-bold uppercase tracking-wide text-[#1B6FC8] hover:underline"
              >
                {showMore ? "Fewer options ▴" : "More options (stage, group, slot length) ▾"}
              </button>

              {showMore && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Stage</Label>
                    <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                      {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Group</Label>
                    <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                      <option value="">Auto (home team's group)</option>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Minutes between matches</Label>
                    <Input type="number" min={5} step={5} value={gap} onChange={(e) => setGap(Math.max(5, parseInt(e.target.value, 10) || 20))} />
                  </div>
                </div>
              )}

              <Button onClick={createFixture} disabled={saving || !homeId || !awayId || !poolId || homeId === awayId} className="mt-4 w-full">
                {saving ? "Creating..." : "+ Create Fixture"}
              </Button>
            </div>

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

        <Card>
          <CardHeader>
            <button onClick={() => setShowBulk((v) => !v)} className="w-full flex items-center justify-between">
              <CardTitle>Bulk add (paste from a spreadsheet)</CardTitle>
              <span className="text-xs text-gray-400">{showBulk ? "▴" : "▾"}</span>
            </button>
          </CardHeader>
          {showBulk && (
            <CardContent>
              <div className="text-xs text-gray-500 mb-2">
                One match per line: <span className="font-mono">day, time, pool, home, away, stage</span> (stage optional, defaults to group).
                Names can be partial, e.g. <span className="font-mono">1, 09:00, aquatic, Kearsney, SACS</span>. Tab-separated (pasted from Sheets/Excel) works too.
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={8}
                placeholder={"1, 09:00, aquatic, Kearsney, SACS\n1, 09:00, high school, Hilton, Maritzburg\n1, 09:30, aquatic, Michaelhouse, Westville, group"}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#1B6FC8]"
              />

              {bulkRows.length > 0 && (
                <div className="mt-3 rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {bulkRows.map((r, i) => (
                    <div key={i} className={`px-3 py-1.5 text-xs flex items-start gap-2 ${r.error ? "bg-red-50 text-red-700" : r.duplicate ? "bg-amber-50 text-amber-700" : "text-gray-700"}`}>
                      <span className="shrink-0">{r.error ? "✗" : r.duplicate ? "•" : "✓"}</span>
                      <span className="font-mono break-all">{r.line}</span>
                      {r.error && <span className="ml-auto shrink-0 font-medium">{r.error}</span>}
                      {r.duplicate && (
                        <span className="ml-auto shrink-0 font-medium">
                          {r.duplicate === "existing" ? "Already exists — skipped" : "Repeated in paste — skipped"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {bulkRows.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {bulkNew.length} new · {bulkDupes.length} already exist · {bulkErrors.length} with errors
                </div>
              )}

              <Button
                onClick={importBulk}
                disabled={bulkSaving || bulkNew.length === 0 || bulkErrors.length > 0}
                className="mt-3 w-full"
              >
                {bulkSaving
                  ? "Importing..."
                  : bulkErrors.length > 0
                    ? `Fix ${bulkErrors.length} line${bulkErrors.length === 1 ? "" : "s"} to import`
                    : bulkNew.length === 0 && bulkDupes.length > 0
                      ? "Nothing new to import"
                      : `Import ${bulkNew.length} new fixture${bulkNew.length === 1 ? "" : "s"}`}
              </Button>
            </CardContent>
          )}
        </Card>
        </div>
      </div>
    </div>
  );
}
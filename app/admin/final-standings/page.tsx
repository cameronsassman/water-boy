"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MatchRow } from "@/lib/knockoutSchedule";
import { buildFinalStandings, knockoutSection, type Track, type Override } from "@/lib/finalStandings";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from "@/components/ui-lite";

type Team = { id: string; name: string };
type Placement = string[]; // index 0 = 1st place; "" = empty

const TRACKS: { id: Track; label: string }[] = [
  { id: "knockout", label: "Knockout Standings" },
  { id: "festival", label: "Festival Standings" },
];
const ordinal = (n: number) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const same = (a: Placement, b: Placement) => a.length === b.length && a.every((x, i) => x === b[i]);

export default function AdminFinalStandings() {
  const [tab, setTab] = useState<Track>("knockout");
  const [teams, setTeams] = useState<Team[]>([]);
  const [auto, setAuto] = useState<Record<Track, Placement>>({ knockout: [], festival: [] });
  const [saved, setSaved] = useState<Record<Track, Placement>>({ knockout: [], festival: [] });   // what's in the DB (or auto)
  const [draft, setDraft] = useState<Record<Track, Placement>>({ knockout: [], festival: [] });   // what's on screen
  const [manual, setManual] = useState<Record<Track, boolean>>({ knockout: false, festival: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [m, p, t, o] = await Promise.all([
      supabase.from("matches").select("id,stage,status,day,match_time,pool_id,home_team_id,away_team_id,home_score,away_score").in("day", [3, 4]).neq("stage", "group"),
      supabase.from("pools").select("id,name"),
      supabase.from("teams").select("id,name").order("name"),
      supabase.from("final_standings_overrides").select("track,position,team_id"),
    ]);
    if (m.error || p.error || t.error) setError((m.error || p.error || t.error)!.message);
    if (o.error) setError(`Couldn't load saved placements — has supabase/final_standings_overrides.sql been run? (${o.error.message})`);

    const teamList = (t.data ?? []) as Team[];
    const overrides = (o.data ?? []) as Override[];
    const nextAuto = {} as Record<Track, Placement>, nextSaved = {} as Record<Track, Placement>, nextManual = {} as Record<Track, boolean>;
    for (const { id } of TRACKS) {
      const rows = buildFinalStandings(id, (m.data ?? []) as MatchRow[], (p.data ?? []) as { id: string; name: string }[], teamList);
      nextAuto[id] = Array.from({ length: 16 }, (_, i) => rows.find((r) => r.position === i + 1)?.teamId ?? "");
      const mine = overrides.filter((x) => x.track === id);
      nextManual[id] = mine.length > 0;
      nextSaved[id] = mine.length > 0
        ? Array.from({ length: 16 }, (_, i) => mine.find((x) => x.position === i + 1)?.team_id ?? "")
        : nextAuto[id];
    }
    setTeams(teamList); setAuto(nextAuto); setSaved(nextSaved); setDraft(nextSaved); setManual(nextManual);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const rows = draft[tab];
  const dirty = !same(draft[tab], saved[tab]);
  const nameOf = (id: string) => teams.find((t) => t.id === id)?.name ?? "";
  const placedAt = useMemo(() => new Map(rows.map((id, i) => [id, i + 1] as const).filter(([id]) => id)), [rows]);

  const update = (next: Placement) => { setDraft((d) => ({ ...d, [tab]: next })); setNotice(null); setError(null); };

  // Put a team in a position. If it already sits elsewhere in this list the two swap,
  // so a team can never be listed twice.
  function place(index: number, teamId: string) {
    const next = [...rows];
    const prev = next[index];
    if (teamId) {
      const other = next.indexOf(teamId);
      if (other !== -1) next[other] = prev;
    }
    next[index] = teamId;
    update(next);
  }
  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j > 15) return;
    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    update(next);
  }

  async function save() {
    setSaving(true); setError(null); setNotice(null);
    const upserts = rows.map((team_id, i) => ({ track: tab, position: i + 1, team_id })).filter((r) => r.team_id)
      .map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const emptyPositions = rows.map((id, i) => (id ? 0 : i + 1)).filter(Boolean);
    try {
      if (upserts.length) {
        const { error } = await supabase.from("final_standings_overrides").upsert(upserts, { onConflict: "track,position" });
        if (error) throw error;
      }
      if (emptyPositions.length) {
        const { error } = await supabase.from("final_standings_overrides").delete().eq("track", tab).in("position", emptyPositions);
        if (error) throw error;
      }
      setSaved((s) => ({ ...s, [tab]: rows })); setManual((m) => ({ ...m, [tab]: upserts.length > 0 }));
      setNotice(`${TRACKS.find((t) => t.id === tab)!.label} saved — the public page updates within 30 seconds.`);
    } catch (e: any) {
      console.error("save final standings failed:", { message: e?.message, code: e?.code, details: e?.details, hint: e?.hint });
      setError(e?.message || "Save failed — check your connection and try again.");
    }
    setSaving(false);
  }

  async function resetToAuto() {
    if (!confirm("Remove all manual placements for this tab and go back to the automatic standings?")) return;
    setSaving(true); setError(null); setNotice(null);
    const { error } = await supabase.from("final_standings_overrides").delete().eq("track", tab);
    if (error) { setError(error.message); setSaving(false); return; }
    setSaved((s) => ({ ...s, [tab]: auto[tab] })); setDraft((d) => ({ ...d, [tab]: auto[tab] })); setManual((m) => ({ ...m, [tab]: false }));
    setNotice("Back to automatic standings."); setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] px-4 sm:px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Final Standings</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Place teams in any position. Saved placements replace the automatic result on the public page.</div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex gap-2">
          {TRACKS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setNotice(null); setError(null); }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tab === t.id ? "bg-[#07091F] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-[#1B6FC8]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

        <Card>
          <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>
              {TRACKS.find((t) => t.id === tab)!.label}
              {manual[tab] ? <Badge variant="warning">Manual</Badge> : <Badge variant="secondary">Automatic</Badge>}
              {dirty && <Badge variant="default">Unsaved changes</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={saving || !dirty} onClick={() => update(saved[tab])}>Discard</Button>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => update(auto[tab])}>Fill from results</Button>
              <Button size="sm" disabled={saving || !dirty} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? <div className="p-6 text-sm text-gray-400">Loading…</div> : (
              <ul className="divide-y divide-gray-100">
                {rows.map((teamId, i) => {
                  const pos = i + 1;
                  const differs = teamId !== auto[tab][i];
                  return (
                    <li key={pos} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${teamId ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>{pos}</span>
                      <div className="flex-1 min-w-0">
                        <Select value={teamId} onChange={(e) => place(i, e.target.value)}>
                          <option value="">— Empty —</option>
                          {teams.map((t) => {
                            const at = placedAt.get(t.id);
                            return <option key={t.id} value={t.id}>{t.name}{at && at !== pos ? ` (currently ${ordinal(at)})` : ""}</option>;
                          })}
                        </Select>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {tab === "knockout" && <span>{knockoutSection(pos)}</span>}
                          {differs && <span className="text-amber-600">{auto[tab][i] ? `Result says ${nameOf(auto[tab][i])}` : "No result yet"}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" aria-label={`Move ${ordinal(pos)} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
                        <Button variant="outline" size="sm" aria-label={`Move ${ordinal(pos)} down`} disabled={i === 15} onClick={() => move(i, 1)}>↓</Button>
                        <Button variant="ghost" size="sm" aria-label={`Clear ${ordinal(pos)}`} disabled={!teamId} onClick={() => place(i, "")}>✕</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {manual[tab] && (
          <div className="text-right">
            <Button variant="destructive" size="sm" disabled={saving} onClick={resetToAuto}>Reset to automatic standings</Button>
          </div>
        )}
      </div>
    </div>
  );
}
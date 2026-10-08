"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { assignBracketSlot } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui-lite";
import {
  STAGE_LABEL_EXTRA, VENUE_LABEL, evaluateSchedule, slotOf,
  type Ctx, type GameState, type MatchRow, type SlotRow, type StandingLite, type Src,
} from "@/lib/knockoutSchedule";

type Group = { id: string; name: string };
type Pool = { id: string; name: string };
type Team = { id: string; name: string };

const STAGE_NAME: Record<string, string> = {
  cup_r16: "Cup R16", cup_qf: "Cup QF", cup_sf: "Cup SF", cup_final: "Cup Final",
  shield_qf: "Shield QF", shield_sf: "Shield SF", shield_final: "Shield Final",
  plate_sf: "Plate SF", plate_final: "Plate Final", festival: "Festival", ...STAGE_LABEL_EXTRA,
};

async function loadFresh(): Promise<{ matches: MatchRow[]; slots: SlotRow[]; standings: StandingLite[] }> {
  const [m, s, st] = await Promise.all([
    supabase.from("matches").select("id,stage,status,day,match_time,pool_id,home_team_id,away_team_id,home_score,away_score"),
    supabase.from("bracket_slots").select("id,bracket,round,slot_number,home_team_id,away_team_id"),
    fetch("/api/standings", { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("Couldn't load standings");
      return r.json();
    }),
  ]);
  if (m.error) throw m.error;
  if (s.error) throw s.error;
  return { matches: (m.data ?? []) as MatchRow[], slots: (s.data ?? []) as SlotRow[], standings: st as StandingLite[] };
}

export default function KnockoutGenerator({ teams, pools, groups, onChangedAction }: {
  teams: Team[]; pools: Pool[]; groups: Group[]; onChangedAction: () => Promise<unknown>;
}) {
  const [data, setData] = useState<{ matches: MatchRow[]; slots: SlotRow[]; standings: StandingLite[] } | null>(null);
  const [force, setForce] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try { setData(await loadFresh()); }
    catch (e: any) { setMsg({ type: "error", text: e?.message || "Failed to load data." }); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const teamName = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const name = (id?: string) => (id ? teamName.get(id) ?? "?" : "TBD");

  const { states, error } = useMemo(
    () => (data ? evaluateSchedule({ ...data, groups, pools, force }) : { states: [] as GameState[], error: undefined }),
    [data, groups, pools, force]
  );
  const ready = states.filter((s) => s.status === "ready");
  const existing = states.filter((s) => s.status === "exists").length;

  const srcText = (s: Src) =>
    s.t === "seed" ? `${"ABCD"[s.g]}${s.r}` : `${s.t === "W" ? "Winner" : "Loser"} G${s.game}`;

  async function generate() {
    setBusy(true); setMsg(null);
    try {
      // Re-evaluate against fresh data so we never insert from a stale view.
      const fresh = await loadFresh();
      const ev = evaluateSchedule({ ...fresh, groups, pools, force });
      if (ev.error) throw new Error(ev.error);
      const toCreate = ev.states.filter((s) => s.status === "ready");
      if (toCreate.length === 0) { setMsg({ type: "success", text: "Nothing new to create yet." }); setData(fresh); return; }

      const { data: t, error: tErr } = await supabase.from("tournaments").select("id").single();
      if (tErr || !t?.id) throw tErr ?? new Error("No tournament found — create a tournament first.");

      const { error: insErr } = await supabase.from("matches").insert(
        toCreate.map((s) => ({
          tournament_id: t.id, home_team_id: s.home!, away_team_id: s.away!, pool_id: s.poolId!,
          group_id: null, stage: s.game.stage, day: s.game.day, match_time: s.game.time, status: "scheduled",
        }))
      );
      if (insErr) throw insErr;

      // Keep the public bracket in sync (Cup / Shield / Plate slots).
      let slotsUpdated = 0;
      for (const s of ev.states) {
        const slot = slotOf(s.game);
        const teamsKnown = s.home && s.away;
        if (!slot || !teamsKnown) continue;
        const row = fresh.slots.find((x) => x.bracket === slot.bracket && x.round === slot.round && x.slot_number === slot.slot_number);
        if (row && (row.home_team_id !== s.home || row.away_team_id !== s.away) && s.status === "ready") {
          await assignBracketSlot(row.id, s.home!, s.away!); slotsUpdated++;
        }
      }
      setMsg({ type: "success", text: `${toCreate.length} fixture${toCreate.length === 1 ? "" : "s"} created${slotsUpdated ? `, ${slotsUpdated} bracket slot${slotsUpdated === 1 ? "" : "s"} filled` : ""}.` });
    } catch (e: any) {
      console.error("generate knockout failed:", e);
      setMsg({ type: "error", text: e?.message || "Generation failed — see console." });
    } finally {
      await refresh();
      try { await onChangedAction(); } catch {}
      setBusy(false);
    }
  }

  const days = [3, 4] as const;
  return (
    <Card>
      <CardHeader>
        <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between">
          <CardTitle>Auto-generate knockout &amp; festival fixtures</CardTitle>
          <span className="text-xs text-gray-400">{open ? "▴" : "▾"}</span>
        </button>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-500 mb-3">
          Follows the published Fri/Sat schedule (64 games). Seeds come from the tie-break-resolved group standings; later rounds
          fill in as results are completed. Safe to press repeatedly — existing games are never duplicated.
        </div>

        {error && <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={generate} disabled={busy || !!error || ready.length === 0}>
            {busy ? "Creating..." : ready.length ? `Create ${ready.length} ready fixture${ready.length === 1 ? "" : "s"}` : "Nothing ready yet"}
          </Button>
          <span className="text-xs text-gray-500">{existing} / 64 created</span>
          <label className="text-xs text-gray-500 flex items-center gap-1.5 ml-auto">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            Seed from current standings (group stage unfinished — testing)
          </label>
        </div>

        {msg && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.type === "success" ? "✓ " : "✗ "}{msg.text}
          </div>
        )}

        {open && !error && (
          <div className="mt-4 space-y-4">
            {days.map((d) => (
              <div key={d}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  {d === 3 ? "Day 3 · Friday" : "Day 4 · Saturday"}
                </div>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {states.filter((s) => s.game.day === d)
                    .sort((a, b) => a.game.time.localeCompare(b.game.time) || a.game.no - b.game.no)
                    .map((s) => (
                    <div key={s.game.no} className="px-3 py-1.5 text-xs flex items-start gap-2">
                      <span className="font-mono text-gray-400 w-8 shrink-0">G{s.game.no}</span>
                      <span className="font-mono text-gray-400 w-11 shrink-0">{s.game.time}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-800 truncate">
                          {s.status === "waiting"
                            ? <span className="text-gray-400">{srcText(s.game.home)} vs {srcText(s.game.away)}</span>
                            : <>{name(s.home)} <span className="text-gray-400">vs</span> {name(s.away)}</>}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {VENUE_LABEL[s.game.venue]} · {STAGE_NAME[s.game.stage] ?? s.game.stage}
                          {s.reason ? ` · ${s.reason}` : ""}
                        </div>
                      </div>
                      <Badge variant={s.status === "exists" ? "secondary" : s.status === "ready" ? "success" : "warning"}>
                        {s.status === "exists" ? "Created" : s.status === "ready" ? "Ready" : "Waiting"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
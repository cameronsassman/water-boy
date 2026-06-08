"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { assignBracketSlot } from "@/lib/db";

type Slot = { id: string; bracket: string; round: string; slot_number: number; home_team_id: string|null; away_team_id: string|null; home_team: { name: string }|null; away_team: { name: string }|null };
type Team = { id: string; name: string };

const BRACKET_SELECT = "*, home_team:teams!bracket_slots_home_team_id_fkey(name), away_team:teams!bracket_slots_away_team_id_fkey(name)";

function SlotCard({ slot, onEdit }: { slot: Slot; onEdit: () => void }) {
  const filled = slot.home_team_id && slot.away_team_id;
  return (
    <div className={`border p-3 ${filled ? "border-[#1B6FC8] bg-white" : "border-dashed border-gray-300 bg-gray-50 opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-black uppercase text-xs mb-1 truncate ${filled ? "text-gray-900" : "text-gray-400"}`}>{slot.home_team?.name ?? "TBD"}</div>
          <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-1">vs</div>
          <div className={`font-black uppercase text-xs truncate ${filled ? "text-gray-900" : "text-gray-400"}`}>{slot.away_team?.name ?? "TBD"}</div>
        </div>
        <button onClick={onEdit} className="text-[10px] font-bold uppercase tracking-wide text-[#1B6FC8] border border-[#1B6FC8]/40 px-2 py-1 hover:bg-blue-50 shrink-0">
          {filled ? "Edit" : "Assign"}
        </button>
      </div>
    </div>
  );
}

function Modal({ slot, teams, onClose, onSave }: { slot: Slot; teams: Team[]; onClose: () => void; onSave: (homeId: string, awayId: string) => Promise<void> }) {
  const [homeId, setHomeId] = useState(slot.home_team_id ?? "");
  const [awayId, setAwayId] = useState(slot.away_team_id ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!homeId || !awayId) return;
    setSaving(true);
    await onSave(homeId, awayId);
    setSaving(false);
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 p-6 w-full max-w-sm">
        <div className="font-black uppercase text-sm text-gray-900 mb-1">Assign Slot {slot.slot_number}</div>
        <div className="text-[10px] text-gray-400 uppercase mb-4">{slot.bracket} · {slot.round}</div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Home team</label>
            <select className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B6FC8]" value={homeId} onChange={(e) => setHomeId(e.target.value)}>
              <option value="">Select team...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Away team</label>
            <select className="w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B6FC8]" value={awayId} onChange={(e) => setAwayId(e.target.value)}>
              <option value="">Select team...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !homeId || !awayId} className="flex-1 bg-[#1B6FC8] text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#0D4A8A] disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBracket() {
  const [slots,   setSlots]   = useState<Slot[]>([]);
  const [teams,   setTeams]   = useState<Team[]>([]);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("bracket_slots").select(BRACKET_SELECT).order("bracket").order("round").order("slot_number"),
      supabase.from("teams").select("id, name").order("name"),
    ]).then(([{ data: s }, { data: t }]) => {
      setSlots((s as Slot[]) ?? []);
      setTeams((t as Team[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function handleSave(homeId: string, awayId: string) {
    if (!editing) return;
    await assignBracketSlot(editing.id, homeId, awayId);
    setSlots((prev) => prev.map((s) => s.id === editing.id ? { ...s, home_team_id: homeId, away_team_id: awayId, home_team: teams.find(t=>t.id===homeId) ? { name: teams.find(t=>t.id===homeId)!.name } : null, away_team: teams.find(t=>t.id===awayId) ? { name: teams.find(t=>t.id===awayId)!.name } : null } : s));
    setEditing(null);
  }

  const get = (bracket: string, round: string) => slots.filter((s) => s.bracket === bracket && s.round === round);

  const Section = ({ title, color, items }: { title: string; color: string; items: { label: string; bracket: string; round: string; note?: string }[] }) => (
    <section>
      <div className={`inline-flex px-4 py-2 font-black uppercase text-sm tracking-widest text-white mb-4 ${color}`}>{title}</div>
      {items.map(({ label, bracket, round, note }) => {
        const slts = get(bracket, round);
        return (
          <div key={round} className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mb-2">{label}</div>
            {note && <div className="text-[10px] text-gray-400 italic border-l-2 border-gray-200 pl-2 mb-2">{note}</div>}
            <div className={`grid gap-3 ${slts.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : slts.length === 2 ? "grid-cols-2 max-w-lg" : "max-w-xs"}`}>
              {loading ? <div className="text-gray-400 text-sm col-span-4">Loading...</div> : slts.map((s) => <SlotCard key={s.id} slot={s} onEdit={() => setEditing(s)} />)}
            </div>
          </div>
        );
      })}
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] border-b border-[#1B3A6E] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Bracket Management</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manually assign teams to Cup · Shield · Plate slots</div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <Section title="🏆 Cup" color="bg-[#C8960A]" items={[
          { label: "Round of 16", bracket: "cup", round: "r16", note: "R16 losers → Shield QF" },
          { label: "Quarter-finals", bracket: "cup", round: "qf", note: "QF losers → Plate SF" },
          { label: "Semi-finals", bracket: "cup", round: "sf" },
          { label: "Final", bracket: "cup", round: "final" },
        ]} />
        <div className="border-t border-gray-200" />
        <Section title="🛡 Shield — Cup R16 losers" color="bg-[#1B6FC8]" items={[
          { label: "Quarter-finals", bracket: "shield", round: "qf", note: "QF losers → Festival" },
          { label: "Semi-finals", bracket: "shield", round: "sf" },
          { label: "Final", bracket: "shield", round: "final" },
        ]} />
        <div className="border-t border-gray-200" />
        <Section title="🥉 Plate — Cup QF losers" color="bg-gray-500" items={[
          { label: "Semi-finals", bracket: "plate", round: "sf" },
          { label: "Final", bracket: "plate", round: "final" },
        ]} />
        <div className="border-t border-gray-200" />
        <section className="pb-8">
          <div className="inline-flex px-4 py-2 font-black uppercase text-sm tracking-widest text-white mb-4 bg-[#2DB87A]">🎉 Festival</div>
          <div className="border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <div className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-1">20 teams · manually assigned</div>
            <div className="text-xs text-gray-400">Bottom 4 per group (16) + Shield QF losers (4) · Create via the Fixtures page</div>
          </div>
        </section>
      </div>

      {editing && <Modal slot={editing} teams={teams} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}

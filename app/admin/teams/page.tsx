"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { addPlayer } from "@/lib/db";

type Team   = { id: string; name: string; short_code: string; coach: string; group_id: string; groups: { name: string; pools: { name: string } | null } | null };
type Player = { id: string; name: string; cap_number: number; position: string; team_id: string };

export default function AdminTeams() {
  const [teams,       setTeams]       = useState<Team[]>([]);
  const [players,     setPlayers]     = useState<Player[]>([]);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("all");
  const [loading,     setLoading]     = useState(true);

  // Add player form
  const [addingTo,   setAddingTo]   = useState<string | null>(null);
  const [newName,    setNewName]    = useState("");
  const [newCap,     setNewCap]     = useState("");
  const [newPos,     setNewPos]     = useState<"Field"|"Goalkeeper">("Field");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*, groups(name, pools(name))").order("name"),
      supabase.from("players").select("*").order("cap_number"),
    ]).then(([{ data: t }, { data: p }]) => {
      setTeams((t as Team[]) ?? []);
      setPlayers((p as Player[]) ?? []);
      setLoading(false);
    });
  }, []);

  const groups = [...new Set(teams.map((t) => t.groups?.name).filter(Boolean))].sort() as string[];
  const filtered = activeGroup === "all" ? teams : teams.filter((t) => t.groups?.name === activeGroup);

  async function handleAddPlayer(teamId: string) {
    if (!newName || !newCap || saving) return;
    setSaving(true);
    try {
      const saved = await addPlayer({ team_id: teamId, name: newName, cap_number: parseInt(newCap), position: newPos });
      setPlayers((prev) => [...prev, saved as Player]);
      setNewName(""); setNewCap(""); setAddingTo(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function deletePlayer(playerId: string) {
    await supabase.from("players").delete().eq("id", playerId);
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] border-b border-[#1B3A6E] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Teams &amp; Players</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage rosters and player data</div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white">
        <div className="flex overflow-x-auto">
          {["all", ...groups].map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 whitespace-nowrap transition-colors ${activeGroup === g ? "text-[#1B6FC8] border-[#1B6FC8]" : "text-gray-400 border-transparent hover:text-gray-700"}`}>
              {g === "all" ? "All Groups" : g}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-2">
        {loading
          ? <div className="text-center py-12 text-gray-400 text-sm">Loading teams...</div>
          : filtered.map((team) => {
            const teamPlayers = players.filter((p) => p.team_id === team.id);
            const isOpen = expanded === team.id;
            return (
              <div key={team.id} className={`border bg-white ${isOpen ? "border-[#1B6FC8]" : "border-gray-200"}`}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : team.id)}>
                  <div className="w-9 h-9 bg-[#1B6FC8] flex items-center justify-center text-white text-[10px] font-black shrink-0">{team.short_code}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black uppercase text-sm text-gray-900">{team.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase">{team.groups?.name} · {team.groups?.pools?.name} · Coach: {team.coach} · {teamPlayers.length} players</div>
                  </div>
                  <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8]">Players ({teamPlayers.length})</span>
                      <button onClick={() => setAddingTo(addingTo === team.id ? null : team.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] border border-[#1B6FC8]/30 px-3 py-1 hover:bg-blue-50">
                        {addingTo === team.id ? "Cancel" : "+ Add player"}
                      </button>
                    </div>

                    {addingTo === team.id && (
                      <div className="border border-gray-200 p-3 mb-3 bg-gray-50">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Name</label>
                            <input className="w-full border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-[#1B6FC8]" placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Cap #</label>
                            <input type="number" className="w-full border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-[#1B6FC8]" placeholder="1" value={newCap} onChange={(e) => setNewCap(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Position</label>
                            <select className="w-full border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-[#1B6FC8]" value={newPos} onChange={(e) => setNewPos(e.target.value as "Field"|"Goalkeeper")}>
                              <option value="Field">Field</option>
                              <option value="Goalkeeper">Goalkeeper</option>
                            </select>
                          </div>
                        </div>
                        <button onClick={() => handleAddPlayer(team.id)} disabled={saving || !newName || !newCap}
                          className="w-full bg-[#1B6FC8] text-white text-xs font-bold uppercase tracking-widest py-2 hover:bg-[#0D4A8A] disabled:opacity-50 transition-colors">
                          {saving ? "Saving..." : "Add player"}
                        </button>
                      </div>
                    )}

                    {teamPlayers.length === 0
                      ? <div className="text-sm text-gray-400 text-center py-4">No players added yet</div>
                      : <div className="border border-gray-200 divide-y divide-gray-100">
                          {teamPlayers.sort((a,b) => a.cap_number - b.cap_number).map((p) => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                              <span className="font-black text-sm text-[#1B6FC8] w-8">#{p.cap_number}</span>
                              <span className="font-bold uppercase text-xs text-gray-900 flex-1">{p.name}</span>
                              <span className="text-[10px] text-gray-400 uppercase">{p.position === "Goalkeeper" ? "GK" : "Field"}</span>
                              <button onClick={() => deletePlayer(p.id)} className="text-[10px] text-red-400 hover:text-red-600 border border-red-200 px-2 py-0.5 hover:border-red-400 transition-colors">Remove</button>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
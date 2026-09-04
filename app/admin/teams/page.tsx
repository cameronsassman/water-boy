"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { addPlayer, createTeam, updateTeamLogo, updateTeam, deleteTeam, updatePlayer } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select } from "@/components/ui-lite";

type Team   = { id: string; name: string; short_code: string; coach: string; manager?: string; group_id: string; logo_url: string | null; groups: { name: string; pools: { name: string } | null } | null };
type Player = { id: string; name: string; cap_number: number; position?: string; team_id: string };
type Group  = { id: string; name: string; pool_id: string };

async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("team-logos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("team-logos").getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminTeams() {
  const [teams,       setTeams]       = useState<Team[]>([]);
  const [players,     setPlayers]     = useState<Player[]>([]);
  const [groupsList,  setGroupsList]  = useState<Group[]>([]);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("all");
  const [loading,     setLoading]     = useState(true);

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName,  setNewName]  = useState("");
  const [newCap,   setNewCap]   = useState("");
  const [saving,   setSaving]   = useState(false);

  const [teamName,    setTeamName]    = useState("");
  const [teamShort,   setTeamShort]   = useState("");
  const [teamCoach,   setTeamCoach]   = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [teamGroupId, setTeamGroupId] = useState("");
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);
  const [regPlayers,  setRegPlayers]  = useState<{ name: string; capNumber: string }[]>([{ name: "", capNumber: "1" }]);
  const [savingTeam,  setSavingTeam]  = useState(false);
  const [uploadingLogoFor, setUploadingLogoFor] = useState<string | null>(null);

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; short_code: string; coach: string; manager: string; group_id: string }>({ name: "", short_code: "", coach: "", manager: "", group_id: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerEditDraft, setPlayerEditDraft] = useState<{ name: string; cap_number: string }>({ name: "", cap_number: "" });
  const [savingPlayerEdit, setSavingPlayerEdit] = useState(false);

  function startEditPlayer(player: Player) {
    setEditingPlayerId(player.id);
    setPlayerEditDraft({ name: player.name, cap_number: String(player.cap_number) });
  }

  async function handleSavePlayerEdit(playerId: string) {
    if (!playerEditDraft.name || !playerEditDraft.cap_number || savingPlayerEdit) return;
    setSavingPlayerEdit(true);
    try {
      const updated = await updatePlayer(playerId, { name: playerEditDraft.name, cap_number: parseInt(playerEditDraft.cap_number) });
      setPlayers((prev) => prev.map((p) => p.id === playerId ? (updated as Player) : p));
      setEditingPlayerId(null);
    } catch (err) { console.error(err); }
    finally { setSavingPlayerEdit(false); }
  }

  function startEditTeam(team: Team) {
    setEditingTeamId(team.id);
    setEditDraft({ name: team.name, short_code: team.short_code, coach: team.coach || "", manager: team.manager || "", group_id: team.group_id });
  }

  async function handleSaveEdit(teamId: string) {
    if (!editDraft.name || !editDraft.short_code || !editDraft.group_id || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await updateTeam(teamId, { name: editDraft.name, short_code: editDraft.short_code, coach: editDraft.coach || undefined, manager: editDraft.manager || undefined, group_id: editDraft.group_id });
      setTeams((prev) => prev.map((t) => t.id === teamId ? (updated as Team) : t).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingTeamId(null);
    } catch (err) { console.error(err); }
    finally { setSavingEdit(false); }
  }

  async function handleDeleteTeam(teamId: string) {
    setDeletingTeamId(teamId);
    try {
      await deleteTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setPlayers((prev) => prev.filter((p) => p.team_id !== teamId));
      setConfirmDeleteId(null);
      if (expanded === teamId) setExpanded(null);
    } catch (err) { console.error(err); }
    finally { setDeletingTeamId(null); }
  }

  function addRegPlayer() {
    setRegPlayers((p) => (p.length >= 13 ? p : [...p, { name: "", capNumber: String(p.length + 1) }]));
  }
  function removeRegPlayer(i: number) {
    setRegPlayers((p) => p.filter((_, idx) => idx !== i));
  }
  function updateRegPlayer(i: number, field: "name" | "capNumber", value: string) {
    setRegPlayers((p) => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x));
  }

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*, groups(name, pools(name))").order("name"),
      supabase.from("players").select("*").order("cap_number"),
      supabase.from("groups").select("*").order("name"),
    ]).then(([{ data: t }, { data: p }, { data: g }]) => {
      setTeams((t as Team[]) ?? []);
      setPlayers((p as Player[]) ?? []);
      setGroupsList((g as Group[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function handleAddTeam() {
    if (!teamName || !teamShort || !teamGroupId || savingTeam) return;
    setSavingTeam(true);
    try {
      const logoUrl = teamLogoFile ? await uploadLogo(teamLogoFile) : undefined;
      const saved = await createTeam({ name: teamName, short_code: teamShort, coach: teamCoach || undefined, manager: teamManager || undefined, group_id: teamGroupId, logo_url: logoUrl });
      setTeams((prev) => [...prev, saved as Team].sort((a, b) => a.name.localeCompare(b.name)));

      const validPlayers = regPlayers.filter((p) => p.name.trim() && p.capNumber.trim());
      for (const p of validPlayers) {
        try {
          const savedPlayer = await addPlayer({ team_id: (saved as Team).id, name: p.name, cap_number: parseInt(p.capNumber) });
          setPlayers((prev) => [...prev, savedPlayer as Player]);
        } catch (err) { console.error("Failed to add squad player:", p.name, err); }
      }

      setTeamName(""); setTeamShort(""); setTeamCoach(""); setTeamManager(""); setTeamGroupId(""); setTeamLogoFile(null);
      setRegPlayers([{ name: "", capNumber: "1" }]);
    } catch (err) { console.error(err); }
    finally { setSavingTeam(false); }
  }

  async function handleUploadBadge(teamId: string, file: File) {
    setUploadingLogoFor(teamId);
    try {
      const url = await uploadLogo(file);
      await updateTeamLogo(teamId, url);
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, logo_url: url } : t));
    } catch (err) { console.error(err); }
    finally { setUploadingLogoFor(null); }
  }

  const groups = [...new Set(teams.map((t) => t.groups?.name).filter(Boolean))].sort() as string[];
  const filtered = activeGroup === "all" ? teams : teams.filter((t) => t.groups?.name === activeGroup);

  async function handleAddPlayer(teamId: string) {
    if (!newName || !newCap || saving) return;
    setSaving(true);
    try {
      const saved = await addPlayer({ team_id: teamId, name: newName, cap_number: parseInt(newCap) });
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
      <div className="bg-[#07091F] px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Teams &amp; Players</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage rosters and player data</div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Team registration */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader><CardTitle>Team details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">School name</label><Input placeholder="e.g. SACS" value={teamName} onChange={(e) => setTeamName(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Short code</label><Input placeholder="e.g. SAC — used in the team's URL" value={teamShort} onChange={(e) => setTeamShort(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Coach</label><Input placeholder="Coach name" value={teamCoach} onChange={(e) => setTeamCoach(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Manager</label><Input placeholder="Manager name" value={teamManager} onChange={(e) => setTeamManager(e.target.value)} /></div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                <Select value={teamGroupId} onChange={(e) => setTeamGroupId(e.target.value)}>
                  <option value="">Select group...</option>
                  {groupsList.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School badge</label>
                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                  <span className="border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold hover:bg-gray-50">Choose image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setTeamLogoFile(e.target.files?.[0] ?? null)} />
                  {teamLogoFile && <span className="text-xs text-gray-500 truncate">{teamLogoFile.name}</span>}
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <CardTitle>Squad ({regPlayers.length}/13)</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addRegPlayer} disabled={regPlayers.length >= 13}>Add player</Button>
            </div>
            <div className="divide-y divide-gray-100">
              {regPlayers.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="w-14 shrink-0"><Input value={p.capNumber} onChange={(e) => updateRegPlayer(i, "capNumber", e.target.value)} className="text-center" /></div>
                  <div className="flex-1 min-w-0"><Input value={p.name} placeholder="Player name" onChange={(e) => updateRegPlayer(i, "name", e.target.value)} /></div>
                  <Button type="button" size="sm" variant="ghost" className="text-gray-400 shrink-0" onClick={() => removeRegPlayer(i)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-gray-100 px-4 py-3">
              <Button onClick={handleAddTeam} disabled={savingTeam || !teamName || !teamShort || !teamGroupId}>
                {savingTeam ? "Registering..." : "Register team"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Group filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", ...groups].map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${activeGroup === g ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
              {g === "all" ? "All Groups" : g}
            </button>
          ))}
        </div>

        {/* Team grid — same card style as the public teams page */}
        {loading
          ? <div className="text-center py-12 text-gray-400 text-sm">Loading teams...</div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((team) => {
                const teamPlayers = players.filter((p) => p.team_id === team.id);
                const isSelected = expanded === team.id;
                return (
                  <button key={team.id} onClick={() => setExpanded(isSelected ? null : team.id)}
                    className={`relative aspect-square rounded-2xl border overflow-hidden text-left transition-colors bg-white ${isSelected ? "border-[#1B6FC8] ring-2 ring-[#1B6FC8]/30" : "border-gray-200 hover:border-[#1B6FC8]"}`}>
                    {team.groups?.name && (
                      <span className="absolute top-2 right-2 z-10 bg-[#F5C518] text-[#07091F] text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {team.groups.name}
                      </span>
                    )}
                    <div className="w-full h-full flex items-center justify-center p-4">
                      {team.logo_url
                        ? <img src={team.logo_url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md" />
                        : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-black text-white bg-blue-600 shadow-md">{team.short_code}</div>
                      }
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 border-t border-gray-100">
                      <div className="font-black uppercase text-xs text-gray-900 truncate">{team.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase truncate">Coach: {team.coach || "—"} · {teamPlayers.length} players</div>
                    </div>
                  </button>
                );
              })}
            </div>
        }

        {/* Selected team — edit modal */}
        {expanded && (() => {
          const team = teams.find((t) => t.id === expanded);
          if (!team) return null;
          const teamPlayers = players.filter((p) => p.team_id === team.id);
          return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setExpanded(null)}>
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                  <CardTitle>{team.name}</CardTitle>
                  <button onClick={() => setExpanded(null)} className="text-gray-400 hover:text-gray-700 text-sm">✕ Close</button>
                </div>
                <div className="p-5">
                {editingTeamId === team.id ? (
                  <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">School name</label><Input value={editDraft.name} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Short code</label><Input value={editDraft.short_code} onChange={(e) => setEditDraft((d) => ({ ...d, short_code: e.target.value }))} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Coach</label><Input value={editDraft.coach} onChange={(e) => setEditDraft((d) => ({ ...d, coach: e.target.value }))} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Manager</label><Input value={editDraft.manager} onChange={(e) => setEditDraft((d) => ({ ...d, manager: e.target.value }))} /></div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                        <Select value={editDraft.group_id} onChange={(e) => setEditDraft((d) => ({ ...d, group_id: e.target.value }))}>
                          <option value="">Select group...</option>
                          {groupsList.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(team.id)} disabled={savingEdit || !editDraft.name || !editDraft.short_code || !editDraft.group_id}>
                        {savingEdit ? "Saving..." : "Save changes"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTeamId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => startEditTeam(team)}>Edit team</Button>
                    {confirmDeleteId === team.id ? (
                      <>
                        <span className="text-xs text-red-600">Delete {team.name} and all its players?</span>
                        <Button size="sm" variant="destructive" disabled={deletingTeamId === team.id} onClick={() => handleDeleteTeam(team.id)}>
                          {deletingTeamId === team.id ? "Deleting..." : "Confirm delete"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDeleteId(team.id)}>Delete team</Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <span className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50">
                      {uploadingLogoFor === team.id ? "Uploading..." : team.logo_url ? "Replace badge" : "Upload badge"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingLogoFor === team.id}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBadge(team.id, f); }} />
                  </label>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Players ({teamPlayers.length})</span>
                  <Button size="sm" variant="outline" onClick={() => setAddingTo(addingTo === team.id ? null : team.id)}>
                    {addingTo === team.id ? "Cancel" : "+ Add player"}
                  </Button>
                </div>

                {addingTo === team.id && (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex-1 min-w-0"><Input placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                    <div className="w-20 shrink-0"><Input type="number" placeholder="Cap #" value={newCap} onChange={(e) => setNewCap(e.target.value)} /></div>
                    <Button onClick={() => handleAddPlayer(team.id)} disabled={saving || !newName || !newCap} className="shrink-0">
                      {saving ? "..." : "Add"}
                    </Button>
                  </div>
                )}

                {teamPlayers.length === 0
                  ? <div className="text-sm text-gray-400 text-center py-4">No players added yet</div>
                  : <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {teamPlayers.sort((a,b) => a.cap_number - b.cap_number).map((p) => (
                        editingPlayerId === p.id ? (
                          <div key={p.id} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
                            <div className="w-16 shrink-0"><Input value={playerEditDraft.cap_number} onChange={(e) => setPlayerEditDraft((d) => ({ ...d, cap_number: e.target.value }))} className="text-center" /></div>
                            <div className="flex-1 min-w-0"><Input value={playerEditDraft.name} onChange={(e) => setPlayerEditDraft((d) => ({ ...d, name: e.target.value }))} /></div>
                            <Button size="sm" disabled={savingPlayerEdit} onClick={() => handleSavePlayerEdit(p.id)} className="shrink-0">{savingPlayerEdit ? "..." : "Save"}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingPlayerId(null)} className="shrink-0">Cancel</Button>
                          </div>
                        ) : (
                          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="font-bold text-sm text-blue-600 w-8">#{p.cap_number}</span>
                            <span className="font-medium text-sm text-gray-900 flex-1">{p.name}</span>
                            <Button size="sm" variant="ghost" onClick={() => startEditPlayer(p)}>Edit</Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => deletePlayer(p.id)}>Remove</Button>
                          </div>
                        )
                      ))}
                    </div>
                }
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
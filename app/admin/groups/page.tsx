"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createPool, updatePool, deletePool, createGroup, updateGroup, deleteGroup } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from "@/components/ui-lite";

type Pool  = { id: string; name: string };
type Group = { id: string; name: string; pool_id: string };

export default function AdminGroups() {
  const [pools,  setPools]  = useState<Pool[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState<string | null>(null);

  const [newPoolName, setNewPoolName] = useState("");
  const [savingPool,  setSavingPool]  = useState(false);
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null);
  const [poolDraft, setPoolDraft] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupPool, setNewGroupPool] = useState("");
  const [savingGroup,  setSavingGroup]  = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState({ name: "", pool_id: "" });

  useEffect(() => {
    Promise.all([
      supabase.from("pools").select("*").order("name"),
      supabase.from("groups").select("*").order("name"),
    ]).then(([{ data: p }, { data: g }]) => {
      setPools((p as Pool[]) ?? []);
      setGroups((g as Group[]) ?? []);
      setLoading(false);
    });
  }, []);

  function showError(err: any, fallback: string) {
    console.error(err);
    setError(err?.message || fallback);
  }

  async function handleAddPool() {
    if (!newPoolName || savingPool) return;
    setSavingPool(true);
    try {
      const saved = await createPool(newPoolName);
      setPools((prev) => [...prev, saved as Pool].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPoolName("");
      setError(null);
    } catch (err) { showError(err, "Couldn't create pool."); }
    finally { setSavingPool(false); }
  }

  async function handleSavePool(poolId: string) {
    if (!poolDraft) return;
    try {
      await updatePool(poolId, poolDraft);
      setPools((prev) => prev.map((p) => p.id === poolId ? { ...p, name: poolDraft } : p));
      setEditingPoolId(null);
      setError(null);
    } catch (err) { showError(err, "Couldn't rename pool."); }
  }

  async function handleDeletePool(poolId: string) {
    try {
      await deletePool(poolId);
      setPools((prev) => prev.filter((p) => p.id !== poolId));
      setError(null);
    } catch (err) { showError(err, "Couldn't delete pool."); }
  }

  async function handleAddGroup() {
    if (!newGroupName || !newGroupPool || savingGroup) return;
    setSavingGroup(true);
    try {
      const saved = await createGroup(newGroupName, newGroupPool);
      setGroups((prev) => [...prev, saved as Group].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGroupName(""); setNewGroupPool("");
      setError(null);
    } catch (err) { showError(err, "Couldn't create group."); }
    finally { setSavingGroup(false); }
  }

  async function handleSaveGroup(groupId: string) {
    if (!groupDraft.name || !groupDraft.pool_id) return;
    try {
      await updateGroup(groupId, { name: groupDraft.name, pool_id: groupDraft.pool_id });
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: groupDraft.name, pool_id: groupDraft.pool_id } : g));
      setEditingGroupId(null);
      setError(null);
    } catch (err) { showError(err, "Couldn't save group."); }
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      await deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setError(null);
    } catch (err) { showError(err, "Couldn't delete group."); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#07091F] px-4 sm:px-6 py-4">
        <div className="text-white font-black uppercase text-lg tracking-wide">Groups &amp; Pools</div>
        <div className="text-[#7A9CC8] text-xs mt-0.5">Manage the tournament's pool and group structure</div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 font-bold">✕</button>
          </div>
        )}

        {/* Pools */}
        <Card>
          <CardHeader><CardTitle>Pools</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input placeholder="New pool name (e.g. Pool 1)" value={newPoolName} onChange={(e) => setNewPoolName(e.target.value)} className="flex-1" />
              <Button onClick={handleAddPool} disabled={savingPool || !newPoolName} className="w-full sm:w-auto">{savingPool ? "..." : "Add pool"}</Button>
            </div>
            {loading
              ? <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              : pools.length === 0
                ? <div className="text-center py-6 text-gray-400 text-sm">No pools yet</div>
                : <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {pools.map((p) => (
                      editingPoolId === p.id ? (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5 bg-gray-50">
                          <Input value={poolDraft} onChange={(e) => setPoolDraft(e.target.value)} className="flex-1" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSavePool(p.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingPoolId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div key={p.id} className="flex items-center gap-2 px-4 py-2.5">
                          <span className="font-semibold text-sm text-gray-900 flex-1">{p.name}</span>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPoolId(p.id); setPoolDraft(p.name); }}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDeletePool(p.id)}>Delete</Button>
                        </div>
                      )
                    ))}
                  </div>
            }
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader><CardTitle>Groups</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
              <Input placeholder="New group name (e.g. Group A)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
              <Select value={newGroupPool} onChange={(e) => setNewGroupPool(e.target.value)}>
                <option value="">Select pool...</option>
                {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Button onClick={handleAddGroup} disabled={savingGroup || !newGroupName || !newGroupPool} className="w-full sm:w-auto">{savingGroup ? "..." : "Add group"}</Button>
            </div>
            {loading
              ? <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              : groups.length === 0
                ? <div className="text-center py-6 text-gray-400 text-sm">No groups yet</div>
                : <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {groups.map((g) => (
                      editingGroupId === g.id ? (
                        <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5 bg-gray-50">
                          <Input value={groupDraft.name} onChange={(e) => setGroupDraft((d) => ({ ...d, name: e.target.value }))} className="flex-1" />
                          <div className="sm:w-40 shrink-0"><Select value={groupDraft.pool_id} onChange={(e) => setGroupDraft((d) => ({ ...d, pool_id: e.target.value }))}>
                            {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </Select></div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveGroup(g.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingGroupId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div key={g.id} className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 flex-1 min-w-[100px]">{g.name}</span>
                          <span className="text-xs text-gray-400">{pools.find((p) => p.id === g.pool_id)?.name}</span>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingGroupId(g.id); setGroupDraft({ name: g.name, pool_id: g.pool_id }); }}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteGroup(g.id)}>Delete</Button>
                        </div>
                      )
                    ))}
                  </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
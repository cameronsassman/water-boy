"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Team = { id: string; name: string; short_code: string; coach: string; group_id: string; groups: { name: string; pools: { name: string }|null }|null };
type Standing = { team_id: string; team_name: string; group_id: string; played: number; won: number; goals_for: number; goals_against: number; goal_diff: number; points: number; rank: number };
type PlayerStat = { player_id: string; player_name: string; cap_number: number; position: string; team_id: string; goals: number; kickouts: number; yellow_cards: number; red_cards: number };

export default function TeamsPage() {
  const [teams,      setTeams]      = useState<Team[]>([]);
  const [standings,  setStandings]  = useState<Standing[]>([]);
  const [stats,      setStats]      = useState<PlayerStat[]>([]);
  const [activeGroup,setActiveGroup]= useState("all");
  const [expanded,   setExpanded]   = useState<string|null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("teams").select("*, groups(name, pools(name))").order("name"),
      supabase.from("group_standings").select("*").order("rank"),
      supabase.from("player_stats").select("*").order("goals", { ascending: false }),
    ]).then(([{data:t},{data:s},{data:p}]) => {
      setTeams((t as Team[])??[]); setStandings((s as Standing[])??[]); setStats((p as PlayerStat[])??[]); setLoading(false);
    });
  }, []);

  const groups = [...new Set(teams.map(t=>t.groups?.name).filter(Boolean))].sort() as string[];
  const filtered = activeGroup==="all" ? teams : teams.filter(t=>t.groups?.name===activeGroup);
  const topScorers = stats.slice(0,5);

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">32 Teams · 4 Groups</div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Teams</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Profiles · Player stats · Standings</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] border-l-2 border-[#F5C518] pl-2 mb-4">Tournament Top Scorers</div>
          {topScorers.length===0
            ? <div className="text-sm text-gray-400">No goals scored yet</div>
            : <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {topScorers.map((s,i) => (
                  <div key={s.player_id} className="flex items-center gap-3 py-1">
                    <span className="text-sm font-black text-gray-300 w-4 shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase text-xs text-gray-900 truncate">{s.player_name}</div>
                      <div className="text-[10px] text-gray-400 uppercase truncate">{teams.find(t=>t.id===s.team_id)?.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg text-[#1B6FC8] leading-none">{s.goals}</div>
                      <div className="text-[9px] text-gray-400 uppercase">goals</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <div className="border-b-2 border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {["all",...groups].map((g) => (
            <button key={g} onClick={()=>setActiveGroup(g)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-0.5 whitespace-nowrap transition-colors ${activeGroup===g?"text-[#1B6FC8] border-[#1B6FC8]":"text-gray-400 border-transparent hover:text-gray-700"}`}>
              {g==="all"?"All Groups":g}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
        {loading ? <div className="text-center py-12 text-gray-400 text-sm">Loading teams...</div>
        : filtered.map((team) => {
          const standing = standings.find(s=>s.team_id===team.id);
          const players  = stats.filter(p=>p.team_id===team.id);
          const isOpen   = expanded===team.id;
          const isCup    = (standing?.rank??99)<=4;
          return (
            <div key={team.id} className={`border bg-white ${isOpen?"border-[#1B6FC8]":"border-gray-200"}`}>
              <button className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors" onClick={()=>setExpanded(isOpen?null:team.id)}>
                <div className={`w-10 h-10 flex items-center justify-center text-xs font-black text-white shrink-0 ${isCup?"bg-[#1B6FC8]":"bg-gray-300"}`}>{team.short_code}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black uppercase text-sm text-gray-900">{team.name}</div>
                  <div className="text-[10px] text-gray-400 uppercase">{team.groups?.name} · {team.groups?.pools?.name} · Coach: {team.coach}</div>
                </div>
                {standing && (
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    {[{v:standing.goals_for,l:"GF"},{v:(standing.goal_diff>0?"+":"")+standing.goal_diff,l:"GD"},{v:standing.points,l:"Pts"}].map(({v,l})=>(
                      <div key={l} className="text-center"><div className="font-black text-sm text-[#1B6FC8] leading-none">{v}</div><div className="text-[9px] text-gray-400 uppercase">{l}</div></div>
                    ))}
                    <span className={`text-[10px] font-black uppercase px-2 py-1 ${isCup?"bg-[#1B6FC8] text-white":"bg-gray-100 text-gray-400"}`}>
                      {standing.rank}{["st","nd","rd"][standing.rank-1]??"th"}
                    </span>
                  </div>
                )}
                <span className="text-gray-400 text-xs ml-2">{isOpen?"▲":"▼"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-gray-200 px-4 py-4 bg-gray-50/50">
                  {standing && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[{v:standing.played,l:"Played"},{v:standing.goals_for,l:"Goals For"},{v:standing.goals_against,l:"Goals Against"},{v:(standing.goal_diff>0?"+":"")+standing.goal_diff,l:"GD"}].map(({v,l})=>(
                        <div key={l} className="bg-white border border-gray-200 p-3 text-center">
                          <div className="font-black text-xl text-gray-900 leading-none">{v}</div>
                          <div className="text-[9px] text-[#1B6FC8] uppercase tracking-widest mt-1">{l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {players.length>0 ? (
                    <>
                      <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mb-3">Player Stats</div>
                      <div className="bg-white border border-gray-200 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              {["#","Player","Pos","Goals","KO","YC","RC"].map((h,i)=><th key={h} className={`px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i<=1?"text-left":"text-right"} ${i===0?"w-10":""}`}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {players.sort((a,b)=>b.goals-a.goals).map((p)=>(
                              <tr key={p.player_id} className="hover:bg-gray-50">
                                <td className="px-2 py-2 font-bold text-gray-400 text-left">#{p.cap_number}</td>
                                <td className="px-2 py-2 font-bold uppercase text-gray-900 text-left">{p.player_name}</td>
                                <td className="px-2 py-2 text-center text-gray-400 text-[10px] uppercase">{p.position==="Goalkeeper"?"GK":"FD"}</td>
                                <td className={`px-2 py-2 text-right font-black ${p.goals>0?"text-[#1B6FC8]":"text-gray-300"}`}>{p.goals}</td>
                                <td className={`px-2 py-2 text-right ${p.kickouts>0?"text-gray-700":"text-gray-300"}`}>{p.kickouts||"—"}</td>
                                <td className="px-2 py-2 text-right">{p.yellow_cards>0?<span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5">{p.yellow_cards}</span>:<span className="text-gray-300">—</span>}</td>
                                <td className="px-2 py-2 text-right">{p.red_cards>0?<span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5">{p.red_cards}</span>:<span className="text-gray-300">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : <div className="text-center text-sm text-gray-400 py-4">No player data yet</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

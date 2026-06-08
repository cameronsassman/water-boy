import { getAllStandings, getGroups, getPools } from "@/lib/db";
export const revalidate = 30;
export default async function StandingsPage() {
  const [standings, groups, pools] = await Promise.all([getAllStandings(), getGroups(), getPools()]);
  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">Group Stage · Live updated</div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Standings</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Top 4 per group → Cup · Bottom 4 → Festival</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {groups.map((group: any) => {
            const pool = pools.find((p: any) => p.id === group.pool_id);
            const rows = standings.filter((s: any) => s.group_id === group.id);
            return (
              <div key={group.id} className="border border-gray-200 bg-white overflow-hidden">
                <div className="bg-[#07091F] px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-black uppercase text-base tracking-wider">{group.name}</span>
                  <span className="text-[#7A9CC8] text-xs font-bold uppercase tracking-widest">{pool?.name}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      {["#","Team","P","W","D","L","GD","Pts"].map((h,i)=><th key={h} className={`px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] ${i<=1?"text-left":"text-right"} ${i===0?"w-8":""}`}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.length === 0
                      ? <tr><td colSpan={8} className="px-4 py-4 text-center text-gray-400 text-xs">No matches yet</td></tr>
                      : rows.map((row: any) => {
                        const isCup = row.rank <= 4;
                        return (
                          <tr key={row.team_id} className={`hover:bg-gray-50 ${!isCup?"opacity-40":""}`}>
                            <td className="px-2 py-2.5"><span className={`inline-flex w-5 h-5 items-center justify-center text-[10px] font-black ${isCup?"bg-[#1B6FC8] text-white":"bg-gray-100 text-gray-400"}`}>{row.rank}</span></td>
                            <td className="px-2 py-2.5 font-black uppercase text-xs text-gray-900">{row.team_name}</td>
                            <td className="px-2 py-2.5 text-right text-xs text-gray-500">{row.played}</td>
                            <td className="px-2 py-2.5 text-right text-xs text-gray-500">{row.won}</td>
                            <td className="px-2 py-2.5 text-right text-xs text-gray-500">{row.drawn}</td>
                            <td className="px-2 py-2.5 text-right text-xs text-gray-500">{row.lost}</td>
                            <td className={`px-2 py-2.5 text-right text-xs font-bold ${row.goal_diff>0?"text-[#2DB87A]":row.goal_diff<0?"text-red-500":"text-gray-400"}`}>{row.goal_diff>0?"+":""}{row.goal_diff}</td>
                            <td className={`px-2 py-2.5 text-right text-xs font-black ${isCup?"text-[#1B6FC8]":"text-gray-400"}`}>{row.points}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="inline-flex w-4 h-4 bg-[#1B6FC8] text-white items-center justify-center text-[9px] font-black">1</span>Cup</span>
                  <span className="flex items-center gap-1"><span className="inline-flex w-4 h-4 bg-gray-100 text-gray-400 items-center justify-center text-[9px] font-black">5</span>Festival</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

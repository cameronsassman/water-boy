import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamByShortCode, getGroupStandings, getPlayerStatsByTeam } from "@/lib/db";

export const revalidate = 60;

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeamByShortCode(slug);
  if (!team) notFound();

  const [standings, players] = await Promise.all([
    getGroupStandings(team.group_id),
    getPlayerStatsByTeam(team.id),
  ]);
  const standing = standings.find((s: any) => s.team_id === team.id);
  const isCup = (standing?.rank ?? 99) <= 4;

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/teams" className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-4 inline-block hover:text-white transition-colors">← Back to Teams</Link>
          <div className="flex items-center gap-4 mt-2">
            {team.logo_url
              ? <img src={team.logo_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 shadow-md" />
              : <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md ${isCup ? "bg-[#1B6FC8]" : "bg-gray-400"}`}>
                  {team.short_code}
                </div>
            }
            <div>
              <h1 className="text-white font-black uppercase text-3xl leading-none">{team.name}</h1>
              <p className="text-[#7A9CC8] text-sm mt-1">{team.groups?.name} · {team.groups?.pools?.name} · Coach: {team.coach || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {standing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { v: standing.played, l: "Played" },
              { v: standing.goals_for, l: "Goals For" },
              { v: standing.goals_against, l: "Goals Against" },
              { v: (standing.goal_diff > 0 ? "+" : "") + standing.goal_diff, l: "Goal Diff" },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-2xl bg-white border border-gray-200 p-4 text-center">
                <div className="font-black text-2xl text-gray-900 leading-none">{v}</div>
                <div className="text-[10px] text-[#1B6FC8] uppercase tracking-widest mt-1.5">{l}</div>
              </div>
            ))}
          </div>
        )}

        {standing && (
          <div className="flex items-center gap-3 mb-8 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${isCup ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>
              {standing.rank}{["st","nd","rd"][standing.rank - 1] ?? "th"} in group
            </span>
            <span className="text-xs font-bold text-gray-500">{standing.points} pts</span>
            <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded-full ${isCup ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {isCup ? "Qualifying" : "Festival"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-[#F5C518] shrink-0" />
          <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">Player Stats</h2>
        </div>
        {players.length === 0
          ? <div className="text-center text-sm text-gray-400 py-8 rounded-2xl border border-gray-200 bg-white">No player data yet</div>
          : <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["#", "Player", "Pos", "Goals", "KO", "YC", "RC"].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i <= 1 ? "text-left" : "text-right"} ${i === 0 ? "w-12" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {players.map((p: any) => (
                    <tr key={p.player_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-bold text-gray-400 text-left">#{p.cap_number}</td>
                      <td className="px-3 py-2.5 font-bold uppercase text-gray-900 text-left">{p.player_name}</td>
                      <td className="px-3 py-2.5 text-center text-gray-400 text-[10px] uppercase">{p.position === "Goalkeeper" ? "GK" : "FD"}</td>
                      <td className={`px-3 py-2.5 text-right font-black ${p.goals > 0 ? "text-[#1B6FC8]" : "text-gray-300"}`}>{p.goals}</td>
                      <td className={`px-3 py-2.5 text-right ${p.kickouts > 0 ? "text-gray-700" : "text-gray-300"}`}>{p.kickouts || "—"}</td>
                      <td className="px-3 py-2.5 text-right">{p.yellow_cards > 0 ? <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p.yellow_cards}</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-right">{p.red_cards > 0 ? <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p.red_cards}</span> : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
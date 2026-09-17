import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamByShortCode, getPlayerStatsByTeam, getTeams } from "@/lib/db";
import { getCachedGroupStandings } from "@/lib/standings";

export const revalidate = 60;

// Pre-render every known team's page at build time instead of rendering
// on demand per-visit — without this, every single team-page request hit
// the database live, unlike every other page on the site which serves
// from a static/ISR cache.
export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((t: any) => ({ slug: t.short_code }));
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeamByShortCode(slug);
  if (!team) notFound();

  const [allStandings, players] = await Promise.all([
    getCachedGroupStandings(),
    getPlayerStatsByTeam(team.id),
  ]);
  const standings = allStandings.filter((s: any) => s.group_id === team.group_id);
  const standing = standings.find((s: any) => s.team_id === team.id);
  const isCup = (standing?.rank ?? 99) <= 4;

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats Grid */}
        {standing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: standing.played, l: "Played" },
              { v: standing.goals_for, l: "Goals For" },
              { v: standing.goals_against, l: "Goals Against" },
              { v: (standing.goal_diff > 0 ? "+" : "") + standing.goal_diff, l: "Goal Diff" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="rounded-2xl bg-white border border-[#CFE6F8] p-5 text-center shadow-sm"
              >
                <div className="font-black text-3xl text-[#07091F] leading-none">{v}</div>
                <div className="text-[10px] text-[#1B6FC8] uppercase tracking-widest font-bold mt-2">
                  {l}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standings Standing Card */}
        {standing && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#CFE6F8] bg-white px-5 py-4 shadow-sm flex-wrap">
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                isCup ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {standing.rank}
              {["st", "nd", "rd"][standing.rank - 1] ?? "th"} in group
            </span>
            <span className="text-xs font-bold text-[#5C7B9C]">{standing.points} pts</span>
            <span
              className={`ml-auto text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                isCup
                  ? "bg-[#EAF6FE] text-[#1B6FC8] border border-[#CFE6F8]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isCup ? "Qualifying" : "Festival"}
            </span>
          </div>
        )}

        {/* Player Roster & Stats */}
        <div className="rounded-2xl bg-white border border-[#CFE6F8] shadow-sm overflow-hidden">
          <div className="bg-[#07091F] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shrink-0" />
              <h2 className="font-black uppercase text-xs sm:text-sm tracking-wider text-white">
                Player Stats & Roster
              </h2>
            </div>
            <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
              {players.length} Players
            </span>
          </div>

          {players.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">No player data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F3FAFF] border-b border-[#CFE6F8]">
                    {["#", "Player", "Pos", "Goals", "KO", "YC", "RC"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C] ${
                          i <= 1 ? "text-left" : "text-right"
                        } ${i === 0 ? "w-12" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF6FE]">
                  {players.map((p: any) => (
                    <tr key={p.player_id} className="hover:bg-[#F8FCFF] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#5C7B9C] text-left">
                        #{p.cap_number}
                      </td>
                      <td className="px-4 py-3 font-bold uppercase text-gray-900 text-left">
                        {p.player_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EAF6FE] text-[#1B6FC8]">
                          {p.position === "Goalkeeper" ? "GK" : "FD"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-black ${
                          p.goals > 0 ? "text-[#1B6FC8]" : "text-gray-300"
                        }`}
                      >
                        {p.goals}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          p.kickouts > 0 ? "text-gray-700 font-medium" : "text-gray-300"
                        }`}
                      >
                        {p.kickouts || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.yellow_cards > 0 ? (
                          <span className="bg-[#F5C518]/20 text-[#A27B00] border border-[#F5C518]/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {p.yellow_cards}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.red_cards > 0 ? (
                          <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {p.red_cards}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ className = "" }: { className?: string }) {
  return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
}

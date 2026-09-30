import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTeamByShortCode,
  getGroupStandings,
  getPlayerStatsByTeam,
  getGroupStageResults,
  getGroupStageDiscipline,
} from "@/lib/db";
import { resolveGroupStandings } from "@/lib/standings";

export const revalidate = 60;

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeamByShortCode(slug);
  if (!team) notFound();

  const [rawStandings, players, matches, discipline] = await Promise.all([
    getGroupStandings(team.group_id),
    getPlayerStatsByTeam(team.id),
    getGroupStageResults(),
    getGroupStageDiscipline(),
  ]);
  const standings = resolveGroupStandings(rawStandings, matches, discipline);
  const standing = standings.find((s: any) => s.team_id === team.id);
  const isCup = (standing?.rank ?? 99) <= 4;

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Team Hero Card */}
        <div className="relative bg-white border border-[#CFE6F8] rounded-2xl sm:rounded-3xl overflow-hidden px-5 py-6 sm:px-8 sm:py-9 shadow-sm">
          <Bubble className="w-32 h-32 sm:w-40 sm:h-40 -top-12 sm:-top-16 -right-8 sm:-right-10 bg-[#EAF6FE] border-0" />
          <Bubble className="w-20 h-20 sm:w-28 sm:h-28 -bottom-8 sm:-bottom-10 -left-6 sm:-left-8 bg-[#EAF6FE] border-0" />

          <div className="relative z-10">
            <Link
              href="/teams"
              className="text-[#1B6FC8] text-[10px] sm:text-xs font-bold uppercase tracking-[2px] sm:tracking-[3px] mb-3 sm:mb-5 inline-flex items-center gap-1.5 hover:text-[#07091F] transition-colors"
            >
              ← Back to Teams
            </Link>

            <div className="flex items-center gap-3.5 sm:gap-5 mt-1">
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="w-[15%] h-[15%] object-cover shrink-0 shadow-md border-2 border-[#CFE6F8]"
                />
              ) : (
                <div
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black text-white shrink-0 shadow-md ${
                    isCup ? "bg-[#1B6FC8]" : "bg-[#07091F]"
                  }`}
                >
                  {team.short_code}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-[#07091F] font-black uppercase text-xl sm:text-3xl leading-tight truncate">
                  {team.name}
                </h1>
                <p className="text-[#5C7B9C] text-xs sm:text-sm mt-1 font-medium truncate">
                  {team.groups?.name} · Coach: {team.coach || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        {standing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              { v: standing.played, l: "Played" },
              { v: standing.goals_for, l: "Goals For" },
              { v: standing.goals_against, l: "Goals Against" },
              { v: (standing.goal_diff > 0 ? "+" : "") + standing.goal_diff, l: "Goal Diff" },
            ].map(({ v, l }) => (
              <div
                key={l}
                className="rounded-2xl bg-white border border-[#CFE6F8] p-3.5 sm:p-5 text-center shadow-sm"
              >
                <div className="font-black text-2xl sm:text-3xl text-[#07091F] leading-none">
                  {v}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#1B6FC8] uppercase tracking-widest font-bold mt-1.5 sm:mt-2">
                  {l}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player Roster & Stats */}
        <div className="rounded-2xl bg-white border border-[#CFE6F8] shadow-sm overflow-hidden">
          {players.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8 sm:py-10">No player data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[420px]">
                <thead>
                  <tr className="bg-[#F3FAFF] border-b border-[#CFE6F8]">
                    {["#", "Player", "Goals", "KO", "YC", "RC"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C] ${
                          i <= 1 ? "text-left" : "text-right"
                        } ${i === 0 ? "w-10 sm:w-12 text-left" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF6FE]">
                  {[...players]
                    .sort((a: any, b: any) => a.cap_number - b.cap_number)
                    .map((p: any) => (
                    <tr key={p.player_id} className="hover:bg-[#F8FCFF] transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-[#5C7B9C] text-left">
                        #{p.cap_number}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase text-gray-900 text-left">
                        {p.player_name}
                      </td>
                      <td
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-black ${
                          p.goals > 0 ? "text-[#1B6FC8]" : "text-gray-300"
                        }`}
                      >
                        {p.goals}
                      </td>
                      <td
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right ${
                          p.kickouts > 0 ? "text-gray-700 font-medium" : "text-gray-300"
                        }`}
                      >
                        {p.kickouts || "—"}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                        {p.yellow_cards > 0 ? (
                          <span className="bg-[#F5C518]/20 text-[#A27B00] border border-[#F5C518]/40 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {p.yellow_cards}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                        {p.red_cards > 0 ? (
                          <span className="bg-red-100 text-red-700 border border-red-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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
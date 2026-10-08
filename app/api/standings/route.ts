import { getAllStandings, getGroupStageResults, getGroupStageDiscipline } from "@/lib/db";
import { resolveGroupStandings } from "@/lib/standings";

// Uncached, fully tiebreak-resolved standings for the admin fixture generator.
// (getCachedGroupStandings is 30s-stale — not good enough right after the last group game.)
export const dynamic = "force-dynamic";

export async function GET() {
  const [raw, matches, discipline] = await Promise.all([
    getAllStandings(), getGroupStageResults(), getGroupStageDiscipline(),
  ]);
  const rows = resolveGroupStandings(raw, matches, discipline)
    .map((r: any) => ({ team_id: r.team_id, group_id: r.group_id, rank: r.rank }));
  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}
import { getAllStandings, getTeams } from "@/lib/db";
import { getTopScorers } from "@/lib/db";
import { buildTopScorers } from "@/lib/scorers";
import TeamsClient from "./TeamsClient";

export const revalidate = 60;

export default async function TeamsPage() {
  const [teams, standings, stats] = await Promise.all([
    getTeams(),
    getAllStandings(),
    getTopScorers(500),
  ]);

  const scorers = buildTopScorers(stats);

  return (
    <TeamsClient
      teams={teams}
      standings={standings.map((s: any) => ({ team_id: s.team_id, rank: s.rank }))}
      scorers={scorers}
    />
  );
}
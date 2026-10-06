import { getAllStandings, getTeams } from "@/lib/db";
import { getTopScorers } from "@/lib/db";
import TeamsClient from "./TeamsClient";

export const revalidate = 60;

export default async function TeamsPage() {
  const [teams, standings, stats] = await Promise.all([
    getTeams(),
    getAllStandings(),
    getTopScorers(50), // fetch enough for all player stats
  ]);

  return (
    <TeamsClient
      teams={teams}
      standings={standings.map((s: any) => ({ team_id: s.team_id, rank: s.rank }))}
      stats={stats.slice(0, 5).map((s: any) => ({
        player_id: s.player_id,
        player_name: s.player_name,
        team_id: s.team_id,
        goals: s.goals,
      }))}
    />
  );
}
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

  return <TeamsClient teams={teams} standings={standings} stats={stats} />;
}
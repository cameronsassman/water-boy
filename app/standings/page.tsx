import { getAllStandings, getGroups, getPools, getGroupStageResults, getGroupStageDiscipline } from "@/lib/db";
import { resolveGroupStandings } from "@/lib/standings";
import StandingsClient from "./StandingsClient";

export const revalidate = 30;

export default async function StandingsPage() {
  const [rawStandings, groups, pools, matches, discipline] = await Promise.all([
    getAllStandings(), getGroups(), getPools(), getGroupStageResults(), getGroupStageDiscipline(),
  ]);
  const standings = resolveGroupStandings(rawStandings, matches, discipline);
  return <StandingsClient standings={standings} groups={groups} pools={pools} />;
}
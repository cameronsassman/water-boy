import { getGroups, getPools } from "@/lib/db";
import { getCachedGroupStandings } from "@/lib/standings";
import StandingsClient from "./StandingsClient";

export const revalidate = 30;

export default async function StandingsPage() {
  const [standings, groups, pools] = await Promise.all([getCachedGroupStandings(), getGroups(), getPools()]);
  return <StandingsClient standings={standings} groups={groups} pools={pools} />;
}

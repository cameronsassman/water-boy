import { getFinalStandingsData } from "@/lib/finalStandingsData";
import { buildFinalStandings, applyOverrides } from "@/lib/finalStandings";
import FinalStandingsClient from "./FinalStandingsClient";

export const revalidate = 30;

export default async function FinalStandingsPage() {
  const { matches, pools, teams, overrides } = await getFinalStandingsData();
  return (
    <FinalStandingsClient
      knockout={applyOverrides(buildFinalStandings("knockout", matches, pools, teams), "knockout", overrides, teams)}
      festival={applyOverrides(buildFinalStandings("festival", matches, pools, teams), "festival", overrides, teams)}
    />
  );
}
"use client";

import ScoreCard from "./components/score_card";
import { matches } from "../lib/matches";
import { calculateStandings } from "../lib/calculations";
import StandingsTable from "./components/standings_table";

export default function WaterPoloScoreCard() {
  const standings = calculateStandings(matches);
  return (
    <>
      <ScoreCard />
      <StandingsTable standings={standings} />
    </>
  );
}

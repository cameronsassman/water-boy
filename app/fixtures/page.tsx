import { getMatchesByDay } from "@/lib/db";
import ScoreboardClient from "./ScoreboardClient";

export default async function ScoreboardPage() {
  const initialMatches = await getMatchesByDay(1);

  return <ScoreboardClient initialMatches={initialMatches} initialDay={1} />;
}
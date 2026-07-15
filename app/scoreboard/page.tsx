import { getMatchesByDay } from "@/lib/db";
import ScoreboardClient from "./ScoreboardClient";

// No revalidate — this page passes seed data to a realtime client component.
// The client immediately has content to render and subscribes to live updates.
export default async function ScoreboardPage() {
  // Default to day 1; client can switch days. Pre-fetch day 1 so first paint is instant.
  const initialMatches = await getMatchesByDay(1);

  return <ScoreboardClient initialMatches={initialMatches} initialDay={1} />;
}
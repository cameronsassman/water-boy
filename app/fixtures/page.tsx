import { getMatchesByDay } from "@/lib/db";
import ScoreboardClient from "./ScoreboardClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ScoreboardPage({
  searchParams,
}: {
  // Next 15. On Next 14 use `{ day?: string }` and drop the await.
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const d = Math.min(4, Math.max(1, Number(day) || 1));
  const initialMatches = await getMatchesByDay(d);

  return <ScoreboardClient initialMatches={initialMatches} initialDay={d} />;
}
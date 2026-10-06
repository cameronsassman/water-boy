import { notFound } from "next/navigation";
import ScoreboardClient, { type Match } from "../ScoreboardClient";
import { getFixtures } from "@/lib/fixtures";

export const revalidate = 5;
export const dynamicParams = false;

export function generateStaticParams() {
  return [1, 2, 3, 4].map((day) => ({ day: String(day) }));
}

export default async function ScoreboardPage({
  params,
}: {
  // Next 14: `{ day: string }` and drop the await
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const d = Number(day);
  if (![1, 2, 3, 4].includes(d)) notFound();

  const initialMatches = (await getFixtures(d)) as Match[];
  return <ScoreboardClient initialMatches={initialMatches} initialDay={d} />;
}
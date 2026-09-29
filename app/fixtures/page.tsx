import { headers } from "next/headers";
import ScoreboardClient from "./ScoreboardClient";

// The page itself still runs per-request (reading `day` from the URL means
// Next always treats this route as dynamic, regardless of any revalidate
// setting here). But its data now comes from /api/fixtures instead of
// calling the database directly — that route is CDN-cached for 5s, so a
// burst of simultaneous first-time visitors shares one cached response
// instead of each triggering their own database query.
export const dynamic = "force-dynamic";

async function fetchFixtures(day: number) {
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  try {
    const res = await fetch(`${protocol}://${host}/api/fixtures?day=${day}`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchFixtures failed:", err);
    return [];
  }
}

export default async function ScoreboardPage({
  searchParams,
}: {
  // Next 15+. On Next 14 use `{ day?: string }` and drop the await.
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const d = Math.min(4, Math.max(1, Number(day) || 1));
  const initialMatches = await fetchFixtures(d);

  return <ScoreboardClient initialMatches={initialMatches} initialDay={d} />;
}
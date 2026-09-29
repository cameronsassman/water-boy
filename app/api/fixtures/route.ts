import { getMatchesByDay } from "@/lib/db";

// Same pattern as /api/home — Vercel's CDN caches this response, so many
// concurrent viewers on the same day share ~1 Supabase query per window
// instead of one each. This also replaces a persistent Realtime connection
// (which counts against Supabase's 200-connection free-tier cap) with
// cheap, cacheable HTTP polling — the actual cost driver on this page.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = Math.min(4, Math.max(1, Number(searchParams.get("day")) || 1));
  const matches = await getMatchesByDay(day);
  return Response.json(matches, {
    headers: {
      "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
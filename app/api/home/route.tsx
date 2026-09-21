import { fetchHomeData } from "@/lib/home-data";

// Always executes on the server, but Vercel's CDN caches the response, so
// 1,000 viewers polling this share ~1 run (and one set of Supabase queries)
// every few seconds.
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchHomeData();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
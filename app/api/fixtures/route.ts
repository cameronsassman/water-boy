import { getFixtures } from "@/lib/fixtures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = Math.min(4, Math.max(1, Number(searchParams.get("day")) || 1));
  const matches = await getFixtures(day);
  return Response.json(matches, {
    headers: {
      "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
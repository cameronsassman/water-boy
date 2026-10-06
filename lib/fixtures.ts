import { unstable_cache } from "next/cache";
import { getMatchesByDay } from "@/lib/db";

export const getFixtures = unstable_cache(
  (day: number) => getMatchesByDay(day),
  ["fixtures"],
  { revalidate: 5 }
);
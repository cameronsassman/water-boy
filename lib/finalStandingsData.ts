import { supabase } from "./supabase";
import type { MatchRow } from "./knockoutSchedule";
import type { Override } from "./finalStandings";

// Only the columns the final standings need — no select("*").
export async function getFinalStandingsData() {
  const [m, p, t, o] = await Promise.all([
    supabase.from("matches")
      .select("id,stage,status,day,match_time,pool_id,home_team_id,away_team_id,home_score,away_score")
      .in("day", [3, 4]).neq("stage", "group"),
    supabase.from("pools").select("id,name"),
    supabase.from("teams").select("id,name"),
    supabase.from("final_standings_overrides").select("track,position,team_id"),
  ]);
  // The overrides table is optional: if it hasn't been created yet, fall back to automatic standings.
  for (const r of [m, p, t, o]) if (r.error) console.error("getFinalStandingsData failed:", r.error.message);
  return {
    matches: (m.data ?? []) as MatchRow[],
    pools: (p.data ?? []) as { id: string; name: string }[],
    teams: (t.data ?? []) as { id: string; name: string }[],
    overrides: (o.data ?? []) as Override[],
  };
}
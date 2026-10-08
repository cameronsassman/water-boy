import { supabase } from "./supabase";
import { getCachedGroupStandings } from "./standings";
import { buildTopScorers, type ScorerCard } from "./scorers";

// Only the columns the homepage renders (same FK hints as MATCH_SELECT in db.ts).
const HOME_MATCH_SELECT =
  "id,status,day,match_time,home_score,away_score," +
  "home_team:teams!matches_home_team_id_fkey(name)," +
  "away_team:teams!matches_away_team_id_fkey(name)," +
  "pools(name)";

export type MatchCard = {
  id: string;
  status: string | null;
  day: number;
  pool_name?: string;
  start_time?: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
};
export type Scorer = ScorerCard;
export type StandingRow = {
  team_id: string;
  rank: number;
  team_name: string;
  played: number;
  point_diff: number;
  points: number;
};
export type GroupStanding = { id: string; name: string; rows: StandingRow[] };
export type HomeData = {
  currentDay: number;
  live: MatchCard[];
  upcoming: MatchCard[];
  scorers: Scorer[];
  groups: GroupStanding[];
};

function log(label: string, error: { message: string; details?: string; hint?: string } | null) {
  if (error) console.error(`${label} failed:`, { message: error.message, details: error.details, hint: error.hint });
}

// Flattens the nested Supabase join shape into the small object the UI needs.
function toCard(m: any): MatchCard {
  return {
    id: m.id,
    status: m.status ?? null,
    day: m.day,
    pool_name: m.pools?.name,
    start_time: m.match_time ? String(m.match_time).slice(0, 5) : undefined,
    home_team_name: m.home_team?.name ?? "",
    away_team_name: m.away_team?.name ?? "",
    home_score: m.home_score ?? null,
    away_score: m.away_score ?? null,
  };
}

// Server-only. Called by the ISR page (first paint) and by /api/home (polling).
export async function fetchHomeData(): Promise<HomeData> {
  const [tournament, live, upcoming, scorers, groups, standings] = await Promise.all([
    supabase.from("tournaments").select("current_day").limit(1).maybeSingle(),

    supabase.from("matches").select(HOME_MATCH_SELECT)
      .eq("status", "live").order("match_time").limit(2),

    // Next two matches that aren't live or finished (null status counts as upcoming).
    supabase.from("matches").select(HOME_MATCH_SELECT)
      .or("status.is.null,status.not.in.(live,completed)")
      .order("day").order("match_time").limit(2),

    supabase.from("player_stats").select("player_id,player_name,team_name,goals")
      .gt("goals", 0).order("goals", { ascending: false }).order("player_name").limit(200),

    supabase.from("groups").select("id,name").order("name"),

    getCachedGroupStandings(),
  ]);

  log("home tournament", tournament.error);
  log("home live matches", live.error);
  log("home upcoming matches", upcoming.error);
  log("home top scorers", scorers.error);
  log("home groups", groups.error);

  const allStandings = (standings ?? []) as any[];

  return {
    currentDay: (tournament.data as any)?.current_day ?? 1,
    live: (live.data ?? []).map(toCard),
    upcoming: (upcoming.data ?? []).map(toCard),
    scorers: buildTopScorers(scorers.data ?? []),
    groups: (groups.data ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      rows: allStandings
        .filter((r) => r.group_id === g.id)
        .slice(0, 3)
        .map((r) => ({
          team_id: r.team_id,
          rank: r.rank,
          team_name: r.team_name,
          played: r.played,
          point_diff: r.point_diff,
          points: r.points,
        })),
    })),
  };
}
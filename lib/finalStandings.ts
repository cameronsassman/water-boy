// lib/finalStandings.ts
//
// Final 1st–16th rankings for the two knock-out competitions, derived from
// the placement games in lib/knockoutSchedule.ts. Pure logic — no React,
// no Supabase — so it is safe anywhere.
//
// Each placement game decides two positions: winner takes the higher one,
// loser the lower one. A game is found by its (pool, day, time) slot, the
// same way evaluateSchedule() does it, so no extra DB column is needed.

import { GAMES, type MatchRow } from "@/lib/knockoutSchedule";

export type Track = "knockout" | "festival";

// [game number, higher position]  → loser gets higher position + 1
const PLACEMENTS: Record<Track, { game: number; pos: number; label: string }[]> = {
  knockout: [
    { game: 64, pos: 1,  label: "Cup Final" },
    { game: 62, pos: 3,  label: "Cup 3rd/4th" },
    { game: 60, pos: 5,  label: "Plate Final" },
    { game: 58, pos: 7,  label: "Plate 3rd/4th" },
    { game: 56, pos: 9,  label: "Shield Final" },
    { game: 54, pos: 11, label: "Shield 3rd/4th" },
    { game: 52, pos: 13, label: "13th/14th Playoff" },
    { game: 50, pos: 15, label: "15th/16th Playoff" },
  ],
  festival: [
    { game: 63, pos: 1,  label: "Festival 1st/2nd" },
    { game: 61, pos: 3,  label: "Festival 3rd/4th" },
    { game: 59, pos: 5,  label: "Festival 5th/6th" },
    { game: 57, pos: 7,  label: "Festival 7th/8th" },
    { game: 55, pos: 9,  label: "Festival 9th/10th" },
    { game: 53, pos: 11, label: "Festival 11th/12th" },
    { game: 51, pos: 13, label: "Festival 13th/14th" },
    { game: 49, pos: 15, label: "Festival 15th/16th" },
  ],
};

export type TeamLite = { id: string; name: string };

export type FinalRow = {
  position: number;
  teamId: string | null;
  teamName: string | null;       // null = not decided yet
  decidedBy: string;             // e.g. "Cup Final"
  score?: string;                // "9–7" from the team's own perspective
  status: "final" | "pending" | "level";
  note?: string;
  manual?: boolean;              // true when an admin placed this team by hand
};

export function buildFinalStandings(
  track: Track,
  matches: MatchRow[],
  pools: { id: string; name: string }[],
  teams: TeamLite[],
): FinalRow[] {
  const poolId = {
    aquatic: pools.find((p) => /aquatic/i.test(p.name))?.id,
    high_school: pools.find((p) => /high/i.test(p.name))?.id,
  };
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Unknown team";
  const rows: FinalRow[] = [];

  for (const { game: no, pos, label } of PLACEMENTS[track]) {
    const g = GAMES.find((x) => x.no === no)!;
    const m = matches.find(
      (mm) => mm.pool_id === poolId[g.venue] && mm.day === g.day && mm.match_time.slice(0, 5) === g.time,
    );

    if (!m || m.status !== "completed") {
      rows.push({ position: pos,     teamId: null, teamName: null, decidedBy: label, status: "pending", note: m ? (m.status === "live" ? "In play" : "Awaiting result") : "Not scheduled yet" });
      rows.push({ position: pos + 1, teamId: null, teamName: null, decidedBy: label, status: "pending", note: m ? (m.status === "live" ? "In play" : "Awaiting result") : "Not scheduled yet" });
      continue;
    }
    if (m.home_score === m.away_score) {
      // Same rule the admin generator uses: a level game needs the shootout recorded as the score.
      for (const p of [pos, pos + 1])
        rows.push({ position: p, teamId: null, teamName: null, decidedBy: label, status: "level", note: "Ended level — record shootout result" });
      continue;
    }
    const homeWon = m.home_score > m.away_score;
    const winner = homeWon ? m.home_team_id : m.away_team_id;
    const loser  = homeWon ? m.away_team_id : m.home_team_id;
    const hi = Math.max(m.home_score, m.away_score), lo = Math.min(m.home_score, m.away_score);
    rows.push({ position: pos,     teamId: winner, teamName: teamName(winner), decidedBy: label, score: `${hi}–${lo}`, status: "final" });
    rows.push({ position: pos + 1, teamId: loser,  teamName: teamName(loser),  decidedBy: label, score: `${lo}–${hi}`, status: "final" });
  }
  return rows.sort((a, b) => a.position - b.position);
}

// Section a knock-out position belongs to (for the coloured badges).
export function knockoutSection(pos: number): "Cup" | "Plate" | "Shield" | "Playoff" {
  return pos <= 4 ? "Cup" : pos <= 8 ? "Plate" : pos <= 12 ? "Shield" : "Playoff";
}

// The Cup Final (game 64) decides the tournament. The Final Standings page and
// nav item stay hidden until it has a completed, non-level result.
export function isCupFinalComplete(
  matches: MatchRow[],
  pools: { id: string; name: string }[],
): boolean {
  const g = GAMES.find((x) => x.no === 64)!;
  const poolId = pools.find((p) => /aquatic/i.test(p.name))?.id;
  const m = matches.find(
    (mm) => mm.pool_id === poolId && mm.day === g.day && mm.match_time.slice(0, 5) === g.time,
  );
  return !!m && m.status === "completed" && m.home_score !== m.away_score;
}

// ── Manual placement (admin) ────────────────────────────────────────
export type Override = { track: Track; position: number; team_id: string };

// If an admin has saved a manual order for a track, it replaces the
// automatic one position by position (1..16). Positions left empty by the
// admin show as TBD. With no overrides for the track, the automatic
// standings are returned untouched.
export function applyOverrides(rows: FinalRow[], track: Track, overrides: Override[], teams: TeamLite[]): FinalRow[] {
  const mine = overrides.filter((o) => o.track === track);
  if (mine.length === 0) return rows;
  return rows.map((r) => {
    const o = mine.find((x) => x.position === r.position);
    const team = o ? teams.find((t) => t.id === o.team_id) : undefined;
    if (!team) return { ...r, teamId: null, teamName: null, score: undefined, status: "pending" as const, note: "Not placed yet", manual: true };
    return { ...r, teamId: team.id, teamName: team.name, score: undefined, status: "final" as const, note: undefined, manual: true };
  });
}
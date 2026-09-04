// lib/standings.ts
//
// Implements the tournament's group-stage ranking rules:
//   1. Points.
//   2. Two-team tie: head-to-head winner ranks ahead. If drawn, compare
//      each team's result against the highest-ranked team NOT in the
//      tie. Still tied -> goals for (season total), then goal
//      difference (season total).
//   3. Three-or-more-team tie: a sub-pool mini-league using only
//      matches between the tied teams (3/1/0 points). If that produces
//      a new two-team tie, resolve it the same way as #2 using their
//      mutual result. If 3+ remain tied, use goals for *within the
//      sub-pool matches*, then goal difference *within the sub-pool*,
//      then disciplinary record (fewest exclusions + cards, season-wide).
//
// This is a best-faith implementation of real, partially-ambiguous
// written rules — the assumptions above are the judgment calls made
// where the wording didn't fully specify an edge case.

export type StandingRow = {
  team_id: string; team_name: string; group_id: string;
  points: number; goals_for: number; goals_against: number; goal_diff: number;
  [key: string]: any;
};
export type MatchResult = {
  id: string; group_id: string | null; stage: string; status: string;
  home_team_id: string; away_team_id: string; home_score: number; away_score: number;
};

export function resolveGroupStandings(standings: StandingRow[], matches: MatchResult[], discipline: Map<string, number>): any[] {
  const byGroup = new Map<string, StandingRow[]>();
  for (const s of standings) {
    if (!byGroup.has(s.group_id)) byGroup.set(s.group_id, []);
    byGroup.get(s.group_id)!.push(s);
  }
  const result: StandingRow[] = [];
  for (const [groupId, rows] of byGroup) {
    const groupMatches = matches.filter((m) => m.group_id === groupId && m.stage === "group" && m.status === "completed");
    rankGroup(rows, groupMatches, discipline).forEach((r, i) => result.push({ ...r, rank: i + 1 }));
  }
  return result;
}

function rankGroup(rows: StandingRow[], matches: MatchResult[], discipline: Map<string, number>): StandingRow[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  const output: StandingRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].points === sorted[i].points) j++;
    const cluster = sorted.slice(i, j);
    if (cluster.length === 1) output.push(cluster[0]);
    else if (cluster.length === 2) output.push(...resolveTwoWayTie(cluster as [StandingRow, StandingRow], sorted, matches));
    else output.push(...resolveMultiWayTie(cluster, matches, discipline));
    i = j;
  }
  return output;
}

function headToHead(teamA: string, teamB: string, matches: MatchResult[]): string | "draw" | null {
  const m = matches.find((mm) =>
    (mm.home_team_id === teamA && mm.away_team_id === teamB) ||
    (mm.home_team_id === teamB && mm.away_team_id === teamA));
  if (!m) return null;
  const aScore = m.home_team_id === teamA ? m.home_score : m.away_score;
  const bScore = m.home_team_id === teamA ? m.away_score : m.home_score;
  if (aScore > bScore) return teamA;
  if (bScore > aScore) return teamB;
  return "draw";
}

function resolveTwoWayTie(pair: [StandingRow, StandingRow], allSortedRows: StandingRow[], matches: MatchResult[]): StandingRow[] {
  const [a, b] = pair;
  const h2h = headToHead(a.team_id, b.team_id, matches);
  if (h2h === a.team_id) return [a, b];
  if (h2h === b.team_id) return [b, a];

  // Drawn or never played: compare each team's result against the
  // highest-ranked team NOT involved in this tie.
  const outsiders = allSortedRows.filter((r) => r.team_id !== a.team_id && r.team_id !== b.team_id);
  if (outsiders.length > 0) {
    const ref = outsiders[0];
    const aVsRef = headToHead(a.team_id, ref.team_id, matches);
    const bVsRef = headToHead(b.team_id, ref.team_id, matches);
    const score = (res: string | "draw" | null, id: string) => res === id ? 2 : res === "draw" ? 1 : res ? 0 : null;
    const aPts = score(aVsRef, a.team_id), bPts = score(bVsRef, b.team_id);
    if (aPts !== null && bPts !== null && aPts !== bPts) return aPts > bPts ? [a, b] : [b, a];
  }

  if (a.goals_for !== b.goals_for) return a.goals_for > b.goals_for ? [a, b] : [b, a];
  if (a.goal_diff !== b.goal_diff) return a.goal_diff > b.goal_diff ? [a, b] : [b, a];
  return [a, b]; // genuinely level — stable order
}

function resolveMultiWayTie(cluster: StandingRow[], matches: MatchResult[], discipline: Map<string, number>): StandingRow[] {
  const ids = new Set(cluster.map((c) => c.team_id));
  const subMatches = matches.filter((m) => ids.has(m.home_team_id) && ids.has(m.away_team_id));

  const subPts = new Map<string, number>(), subGF = new Map<string, number>(), subGA = new Map<string, number>();
  for (const id of ids) { subPts.set(id, 0); subGF.set(id, 0); subGA.set(id, 0); }
  for (const m of subMatches) {
    subGF.set(m.home_team_id, (subGF.get(m.home_team_id) ?? 0) + m.home_score);
    subGA.set(m.home_team_id, (subGA.get(m.home_team_id) ?? 0) + m.away_score);
    subGF.set(m.away_team_id, (subGF.get(m.away_team_id) ?? 0) + m.away_score);
    subGA.set(m.away_team_id, (subGA.get(m.away_team_id) ?? 0) + m.home_score);
    if (m.home_score > m.away_score) subPts.set(m.home_team_id, (subPts.get(m.home_team_id) ?? 0) + 3);
    else if (m.away_score > m.home_score) subPts.set(m.away_team_id, (subPts.get(m.away_team_id) ?? 0) + 3);
    else { subPts.set(m.home_team_id, (subPts.get(m.home_team_id) ?? 0) + 1); subPts.set(m.away_team_id, (subPts.get(m.away_team_id) ?? 0) + 1); }
  }

  const withSub = cluster.map((c) => ({ ...c, _subPts: subPts.get(c.team_id) ?? 0, _subGF: subGF.get(c.team_id) ?? 0, _subGA: subGA.get(c.team_id) ?? 0 }));
  withSub.sort((a, b) => b._subPts - a._subPts);

  const out: StandingRow[] = [];
  let i = 0;
  while (i < withSub.length) {
    let j = i;
    while (j < withSub.length && withSub[j]._subPts === withSub[i]._subPts) j++;
    const sub = withSub.slice(i, j);
    if (sub.length === 1) out.push(sub[0]);
    else if (sub.length === 2) out.push(...resolveTwoWayTie(sub as unknown as [StandingRow, StandingRow], withSub, matches));
    else {
      const s2 = [...sub].sort((a, b) => {
        if (b._subGF !== a._subGF) return b._subGF - a._subGF;
        const aGD = a._subGF - a._subGA, bGD = b._subGF - b._subGA;
        if (bGD !== aGD) return bGD - aGD;
        return (discipline.get(a.team_id) ?? 0) - (discipline.get(b.team_id) ?? 0); // fewer cards ranks higher
      });
      out.push(...s2);
    }
    i = j;
  }
  return out;
}
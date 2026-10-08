export type ScorerCard = {
  key: string;
  rank: number;
  tied: boolean;
  goals: number;
  player_name?: string;
  team_id?: string;
  team_name?: string;
  count?: number;
};

export function buildTopScorers(rows: any[], max = 5): ScorerCard[] {
  const tiers: any[][] = [];
  for (const s of rows) {
    if (!(s.goals > 0)) continue;
    const last = tiers[tiers.length - 1];
    if (last && last[0].goals === s.goals) last.push(s);
    else tiers.push([s]);
  }

  const cards: ScorerCard[] = [];
  let rank = 1;
  for (const tier of tiers) {
    const slots = max - cards.length;
    if (slots <= 0) break;
    const tied = tier.length > 1;
    const nameLimit = rank === 1 ? 3 : 2;
    if (tier.length <= nameLimit && tier.length <= slots) {
      for (const s of tier) {
        cards.push({ key: s.player_id, rank, tied, goals: s.goals, player_name: s.player_name, team_id: s.team_id, team_name: s.team_name });
      }
    } else {
      cards.push({ key: `tier-${tier[0].goals}`, rank, tied, goals: tier[0].goals, count: tier.length });
    }
    rank += tier.length;
  }
  return cards;
}

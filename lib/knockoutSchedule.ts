// lib/knockoutSchedule.ts
//
// The 2026 knock-out schedule (Fri 9 / Sat 10 Oct) encoded exactly as in the
// published PDF: 64 games, two venues, fixed times. Pure logic — no React,
// no Supabase, no next/* imports — so it is safe in client components.
//
// A game is identified by its (day, time, pool) slot, so no extra DB column
// is needed: "Winner Game 17" = the match sitting in game 17's slot.
//
// Day 3 = Friday, Day 4 = Saturday (the app's "Knockout Stage · Day 3–4").

export type Src =
  | { t: "seed"; g: number; r: number }   // group index (A=0..D=3), final rank 1..8
  | { t: "W" | "L"; game: number };       // winner / loser of another game

export type Venue = "aquatic" | "high_school";

export type Game = {
  no: number; day: 3 | 4; time: string; venue: Venue;
  stage: string; home: Src; away: Src;
};

const S = (g: string, r: number): Src => ({ t: "seed", g: "ABCD".indexOf(g), r });
const W = (game: number): Src => ({ t: "W", game });
const L = (game: number): Src => ({ t: "L", game });

function addMin(t: string, mins: number): string {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// One block = consecutive 30-minute games at one venue.
function block(venue: Venue, day: 3 | 4, start: string, stage: string, rows: [number, Src, Src][]): Game[] {
  return rows.map(([no, home, away], i) => ({ no, day, venue, stage, home, away, time: addMin(start, i * 30) }));
}

export const GAMES: Game[] = [
  // ── FRIDAY · Aquatic Centre ──────────────────────────────────────
  ...block("aquatic", 3, "11:30", "cup_r16", [
    [1, S("A", 1), S("D", 4)], [3, S("B", 1), S("C", 4)], [5, S("C", 1), S("B", 4)], [7, S("D", 1), S("A", 4)],
    [9, S("C", 2), S("B", 3)], [11, S("D", 2), S("A", 3)], [13, S("A", 2), S("D", 3)], [15, S("B", 2), S("C", 3)],
  ]),
  ...block("aquatic", 3, "15:30", "shield_qf", [
    [17, L(1), L(9)], [19, L(11), L(3)], [21, L(5), L(13)], [23, L(15), L(7)],
  ]),
  ...block("aquatic", 3, "17:30", "cup_qf", [
    [25, W(1), W(9)], [27, W(11), W(3)], [29, W(5), W(13)], [31, W(15), W(7)],
  ]),
  // ── FRIDAY · High School (Festival) ──────────────────────────────
  ...block("high_school", 3, "11:30", "festival_t1", [
    [2, S("A", 5), S("D", 8)], [4, S("B", 5), S("C", 8)], [6, S("C", 5), S("B", 8)], [8, S("D", 5), S("A", 8)],
    [10, S("C", 6), S("B", 7)], [12, S("D", 6), S("A", 7)], [14, S("A", 6), S("D", 7)], [16, S("B", 6), S("C", 7)],
  ]),
  ...block("high_school", 3, "15:30", "festival_t2", [
    [18, L(2), L(10)], [20, L(12), L(4)], [22, L(6), L(14)], [24, L(16), L(8)],
  ]),
  ...block("high_school", 3, "17:30", "festival_t1", [
    [26, W(2), W(10)], [28, W(12), W(4)], [30, W(6), W(14)], [32, W(16), W(8)],
  ]),
  // ── SATURDAY · Aquatic Centre ────────────────────────────────────
  ...block("aquatic", 4, "07:30", "playoff_r1", [[34, L(17), L(19)], [36, L(21), L(23)]]),
  ...block("aquatic", 4, "08:30", "shield_sf",  [[38, W(17), W(19)], [40, W(21), W(23)]]),
  ...block("aquatic", 4, "09:30", "plate_sf",   [[42, L(25), L(27)], [44, L(29), L(31)]]),
  ...block("aquatic", 4, "10:30", "cup_sf",     [[46, W(25), W(27)], [48, W(29), W(31)]]),
  ...block("aquatic", 4, "11:30", "playoff_15_16", [[50, L(34), L(36)]]),
  ...block("aquatic", 4, "12:00", "playoff_13_14", [[52, W(34), W(36)]]),
  ...block("aquatic", 4, "12:30", "shield_third", [[54, L(38), L(40)]]),
  ...block("aquatic", 4, "13:00", "shield_final", [[56, W(38), W(40)]]),
  ...block("aquatic", 4, "13:30", "plate_third",  [[58, L(42), L(44)]]),
  ...block("aquatic", 4, "14:00", "plate_final",  [[60, W(42), W(44)]]),
  ...block("aquatic", 4, "14:30", "cup_third",    [[62, L(46), L(48)]]),
  ...block("aquatic", 4, "15:00", "cup_final",    [[64, W(46), W(48)]]),
  // ── SATURDAY · High School (Festival tiers + placement games) ────
  ...block("high_school", 4, "07:00", "festival_t4",    [[33, L(18), L(20)], [35, L(22), L(24)]]),
  ...block("high_school", 4, "08:00", "festival_t3",    [[37, W(18), W(20)], [39, W(22), W(24)]]),
  ...block("high_school", 4, "09:00", "festival_t2", [[41, L(26), L(28)], [43, L(30), L(32)]]),
  ...block("high_school", 4, "10:00", "festival_t1", [[45, W(26), W(28)], [47, W(30), W(32)]]),
  ...block("high_school", 4, "11:00", "festival_15_16", [[49, L(33), L(35)]]),
  ...block("high_school", 4, "11:30", "festival_13_14", [[51, W(33), W(35)]]),
  ...block("high_school", 4, "12:00", "festival_11_12", [[53, L(37), L(39)]]),
  ...block("high_school", 4, "12:30", "festival_9_10",  [[55, W(37), W(39)]]),
  ...block("high_school", 4, "13:00", "festival_7_8",   [[57, L(41), L(43)]]),
  ...block("high_school", 4, "13:30", "festival_5_6",   [[59, W(41), W(43)]]),
  ...block("high_school", 4, "14:00", "festival_3_4",   [[61, L(45), L(47)]]),
  ...block("high_school", 4, "14:30", "festival_1_2",   [[63, W(45), W(47)]]),
].sort((a, b) => a.no - b.no);

export const VENUE_LABEL: Record<Venue, string> = { aquatic: "Aquatic Centre", high_school: "High School" };

// Every stage beyond the original 11, in display order. The admin page and the
// public scoreboard build their stage lists / labels from this.
export const EXTRA_STAGES: { key: string; label: string; family: "playoff" | "festival" }[] = [
  { key: "playoff_r1",     label: "Playoff Round One", family: "playoff" },
  { key: "playoff_15_16",  label: "15th/16th Playoff", family: "playoff" },
  { key: "playoff_13_14",  label: "13th/14th Playoff", family: "playoff" },
  { key: "shield_third",   label: "Shield 3rd/4th",    family: "playoff" },
  { key: "plate_third",    label: "Plate 3rd/4th",     family: "playoff" },
  { key: "cup_third",      label: "Cup 3rd/4th",       family: "playoff" },
  { key: "festival_t1",    label: "Festival Tier One",   family: "festival" },
  { key: "festival_t2",    label: "Festival Tier Two",   family: "festival" },
  { key: "festival_t3",    label: "Festival Tier Three", family: "festival" },
  { key: "festival_t4",    label: "Festival Tier Four",  family: "festival" },
  { key: "festival_1_2",   label: "Festival 1st/2nd Playoff",   family: "festival" },
  { key: "festival_3_4",   label: "Festival 3rd/4th Playoff",   family: "festival" },
  { key: "festival_5_6",   label: "Festival 5th/6th Playoff",   family: "festival" },
  { key: "festival_7_8",   label: "Festival 7th/8th Playoff",   family: "festival" },
  { key: "festival_9_10",  label: "Festival 9th/10th Playoff",  family: "festival" },
  { key: "festival_11_12", label: "Festival 11th/12th Playoff", family: "festival" },
  { key: "festival_13_14", label: "Festival 13th/14th Playoff", family: "festival" },
  { key: "festival_15_16", label: "Festival 15th/16th Playoff", family: "festival" },
];
export const STAGE_LABEL_EXTRA: Record<string, string> = Object.fromEntries(EXTRA_STAGES.map((x) => [x.key, x.label]));
export const isFestivalStage = (stage: string) => stage === "festival" || stage.startsWith("festival_");

// Stages that have rows in bracket_slots (bracket = prefix, round = rest).
const SLOT_STAGES = ["cup_r16", "cup_qf", "cup_sf", "cup_final", "shield_qf", "shield_sf", "shield_final", "plate_sf", "plate_final"];
export function slotOf(game: Game): { bracket: string; round: string; slot_number: number } | null {
  if (!SLOT_STAGES.includes(game.stage)) return null;
  const i = game.stage.indexOf("_");
  const idx = GAMES.filter((g) => g.stage === game.stage).findIndex((g) => g.no === game.no);
  return { bracket: game.stage.slice(0, i), round: game.stage.slice(i + 1), slot_number: idx + 1 };
}

// ── Evaluation ──────────────────────────────────────────────────────
export type MatchRow = {
  id: string; stage: string; status: string; day: number; match_time: string; pool_id: string;
  home_team_id: string; away_team_id: string; home_score: number; away_score: number;
};
export type SlotRow = { id: string; bracket: string; round: string; slot_number: number; home_team_id: string | null; away_team_id: string | null };
export type StandingLite = { team_id: string; group_id: string; rank: number };

export type Ctx = {
  matches: MatchRow[];
  standings: StandingLite[];
  groups: { id: string; name: string }[];
  pools: { id: string; name: string }[];
  force: boolean; // build seeds even if group stage isn't finished (testing)
};

export type GameState = {
  game: Game;
  status: "exists" | "ready" | "waiting";
  reason?: string;
  home?: string; away?: string; // team ids (actual for existing matches)
  poolId?: string;
  match?: MatchRow;
};

export function evaluateSchedule(ctx: Ctx): { states: GameState[]; error?: string } {
  const pool = {
    aquatic: ctx.pools.find((p) => /aquatic/i.test(p.name))?.id,
    high_school: ctx.pools.find((p) => /high/i.test(p.name))?.id,
  };
  if (!pool.aquatic || !pool.high_school)
    return { states: [], error: `Couldn't match pools by name — need one containing "aquatic" and one containing "high" (found: ${ctx.pools.map((p) => p.name).join(", ") || "none"}).` };

  const groups = [...ctx.groups].sort((a, b) => a.name.localeCompare(b.name));
  if (groups.length !== 4) return { states: [], error: `Expected 4 groups (A–D), found ${groups.length}.` };

  const groupMatches = ctx.matches.filter((m) => m.stage === "group");
  const pending = groupMatches.filter((m) => m.status !== "completed").length;
  let seedBlock: string | null = null;
  if (groupMatches.length === 0) seedBlock = "No group-stage matches yet";
  else if (pending > 0 && !ctx.force) seedBlock = `${pending} group match${pending === 1 ? "" : "es"} still to complete`;

  const byGroup = groups.map((g) =>
    ctx.standings.filter((s) => s.group_id === g.id).sort((a, b) => a.rank - b.rank).map((s) => s.team_id));

  const states = new Map<number, GameState>();

  function resolve(src: Src): { id?: string; why?: string } {
    if (src.t === "seed") {
      if (seedBlock) return { why: seedBlock };
      const id = byGroup[src.g]?.[src.r - 1];
      return id ? { id } : { why: `${groups[src.g].name} has no rank-${src.r} team yet` };
    }
    const s = states.get(src.game);
    if (!s || s.status !== "exists" || !s.match) return { why: `Game ${src.game} not created yet` };
    const m = s.match;
    if (m.status !== "completed") return { why: `Game ${src.game} not completed` };
    if (m.home_score === m.away_score) return { why: `Game ${src.game} ended level — record the shootout result as the score` };
    const homeWon = m.home_score > m.away_score;
    const winner = homeWon ? m.home_team_id : m.away_team_id;
    const loser = homeWon ? m.away_team_id : m.home_team_id;
    return { id: src.t === "W" ? winner : loser };
  }

  for (const game of GAMES) {
    const poolId = pool[game.venue]!;
    const atSlot = ctx.matches.find((m) => m.pool_id === poolId && m.day === game.day && m.match_time.slice(0, 5) === game.time);
    if (atSlot && (atSlot.stage === game.stage || (isFestivalStage(atSlot.stage) && isFestivalStage(game.stage)))) {
      states.set(game.no, { game, status: "exists", poolId, match: atSlot, home: atSlot.home_team_id, away: atSlot.away_team_id });
      continue;
    }
    if (atSlot) {
      states.set(game.no, { game, status: "waiting", poolId, reason: `Slot already used by a "${atSlot.stage}" match` });
      continue;
    }
    const h = resolve(game.home), a = resolve(game.away);
    if (!h.id || !a.id) states.set(game.no, { game, status: "waiting", poolId, reason: h.why ?? a.why });
    else if (h.id === a.id) states.set(game.no, { game, status: "waiting", poolId, reason: "Same team on both sides — check standings" });
    else states.set(game.no, { game, status: "ready", poolId, home: h.id, away: a.id });
  }
  return { states: GAMES.map((g) => states.get(g.no)!) };
}
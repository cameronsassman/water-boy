import { supabase } from "./supabase";

const MATCH_SELECT = `*, home_team:teams!matches_home_team_id_fkey(id,name,short_code), away_team:teams!matches_away_team_id_fkey(id,name,short_code), groups(name), pools(name)`;

export async function getTournament() {
  const { data, error } = await supabase.from("tournaments").select("*").maybeSingle();
  if (error) console.error("getTournament failed:", { message: error.message, details: error.details, hint: error.hint });
  return data;
}
export async function getPools() {
  const { data } = await supabase.from("pools").select("*").order("name"); return data ?? [];
}
export async function getGroups() {
  const { data } = await supabase.from("groups").select("*, pools(name)").order("name"); return data ?? [];
}
export async function getTeams() {
  const { data } = await supabase.from("teams").select("*, groups(name, pool_id, pools(name))").order("name"); return data ?? [];
}
export async function getPlayersByTeam(teamId: string) {
  const { data } = await supabase.from("players").select("*").eq("team_id", teamId).order("cap_number"); return data ?? [];
}
export async function getMatches() {
  const { data } = await supabase.from("matches").select(MATCH_SELECT).order("day").order("match_time"); return data ?? [];
}
// Raw group-stage results, needed for head-to-head / sub-pool tiebreaking —
// deliberately un-joined and minimal, this feeds lib/standings.ts.
export async function getGroupStageResults() {
  const { data, error } = await supabase.from("matches")
    .select("id,group_id,stage,status,home_team_id,away_team_id,home_score,away_score")
    .eq("stage", "group").eq("status", "completed");
  if (error) { console.error("getGroupStageResults failed:", { message: error.message, details: error.details, hint: error.hint }); return []; }
  return data ?? [];
}
// Fewest exclusions/cards is the last tiebreaker step — count kickouts,
// yellows, and reds per team across group-stage matches only.
export async function getGroupStageDiscipline(): Promise<Map<string, number>> {
  const { data: matches, error: matchError } = await supabase.from("matches").select("id").eq("stage", "group");
  if (matchError) { console.error("getGroupStageDiscipline (matches) failed:", { message: matchError.message }); return new Map(); }
  const matchIds = (matches ?? []).map((m) => m.id);
  if (matchIds.length === 0) return new Map();
  const { data: events, error } = await supabase.from("match_events").select("team_id,event_type")
    .in("match_id", matchIds).in("event_type", ["kickout", "yellow_card", "red_card"]);
  if (error) { console.error("getGroupStageDiscipline (events) failed:", { message: error.message, details: error.details, hint: error.hint }); return new Map(); }
  const map = new Map<string, number>();
  for (const e of events ?? []) map.set(e.team_id, (map.get(e.team_id) ?? 0) + 1);
  return map;
}
export async function getMatchesByDay(day: number) {
  const { data } = await supabase.from("matches").select(MATCH_SELECT).eq("day", day).order("match_time"); return data ?? [];
}
export async function getLiveMatches() {
  const { data } = await supabase.from("matches").select(MATCH_SELECT).eq("status","live").order("match_time"); return data ?? [];
}
export async function getMatchEvents(matchId: string) {
  const { data } = await supabase.from("match_events").select("*, players(name,cap_number), teams(name)").eq("match_id", matchId).order("created_at"); return data ?? [];
}
export async function getAllStandings() {
  const { data } = await supabase.from("group_standings").select("*").order("group_id").order("rank"); return data ?? [];
}
export async function getGroupStandings(groupId: string) {
  const { data } = await supabase.from("group_standings").select("*").eq("group_id", groupId).order("rank"); return data ?? [];
}
export async function getTopScorers(limit = 10) {
  const { data } = await supabase.from("player_stats").select("*, teams(name,group_id)").order("goals",{ascending:false}).limit(limit); return data ?? [];
}
export async function getTeamByShortCode(code: string) {
  const { data, error } = await supabase.from("teams").select("*, groups(name, pool_id, pools(name))").ilike("short_code", code).maybeSingle();
  if (error) console.error("getTeamByShortCode failed:", { code, message: error.message, details: error.details, hint: error.hint, dbCode: error.code });
  return data;
}
export async function getPlayerStatsByTeam(teamId: string) {
  const { data, error } = await supabase.from("player_stats").select("*").eq("team_id", teamId).order("goals",{ascending:false});
  if (error) console.error("getPlayerStatsByTeam failed:", { teamId, message: error.message, details: error.details, hint: error.hint });
  return data ?? [];
}
export async function getBracketSlots() {
  const { data } = await supabase.from("bracket_slots").select(`*, home_team:teams!bracket_slots_home_team_id_fkey(id,name), away_team:teams!bracket_slots_away_team_id_fkey(id,name)`).order("bracket").order("round").order("slot_number"); return data ?? [];
}
export async function createMatch(match: { tournament_id:string; pool_id:string; group_id?:string; home_team_id:string; away_team_id:string; stage:string; day:number; match_time:string }) {
  const { data, error } = await supabase.from("matches").insert(match).select().single(); if (error) throw error; return data;
}
export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number, halfScores: { half1_home:number; half1_away:number; half2_home:number; half2_away:number }) {
  const { error } = await supabase.from("matches").update({ home_score:homeScore, away_score:awayScore, ...halfScores }).eq("id", matchId); if (error) throw error;
}
export async function updateCurrentHalf(matchId: string, half: number) {
  const { error } = await supabase.from("matches").update({ current_half: half }).eq("id", matchId); if (error) throw error;
}
export async function updateMatchStatus(matchId: string, status: "scheduled"|"live"|"completed") {
  const { error } = await supabase.from("matches").update({ status }).eq("id", matchId); if (error) throw error;
}
export async function logMatchEvent(event: { match_id:string; player_id:string; team_id:string; event_type:string; half:number; minute?:number }) {
  const { data, error } = await supabase.from("match_events").insert(event).select().single(); if (error) throw error; return data;
}
export async function deleteMatchEvent(eventId: string) {
  const { error } = await supabase.from("match_events").delete().eq("id", eventId); if (error) throw error;
}
// Correction tool for after-the-fact fixes (scorer mis-attributed a goal
// or foul). Unlike the live scorer's delete, this recomputes and writes
// the match's stored score too — the event may belong to a completed
// match, so nothing else will recompute it automatically.
export async function deleteEventAndRecomputeScore(eventId: string, matchId: string, homeTeamId?: string, awayTeamId?: string) {
  const { error: delError } = await supabase.from("match_events").delete().eq("id", eventId);
  if (delError) throw delError;
  const { data: events, error: fetchError } = await supabase.from("match_events").select("event_type,team_id,half").eq("match_id", matchId);
  if (fetchError) throw fetchError;
  const goals = (events ?? []).filter((e) => e.event_type === "goal");
  const totals = {
    home_score:  goals.filter((e) => e.team_id === homeTeamId).length,
    away_score:  goals.filter((e) => e.team_id === awayTeamId).length,
    half1_home:  goals.filter((e) => e.team_id === homeTeamId && e.half === 1).length,
    half1_away:  goals.filter((e) => e.team_id === awayTeamId && e.half === 1).length,
    half2_home:  goals.filter((e) => e.team_id === homeTeamId && e.half === 2).length,
    half2_away:  goals.filter((e) => e.team_id === awayTeamId && e.half === 2).length,
  };
  const { error: updateError } = await supabase.from("matches").update(totals).eq("id", matchId);
  if (updateError) throw updateError;
}
export async function assignBracketSlot(slotId: string, homeTeamId: string, awayTeamId: string) {
  const { error } = await supabase.from("bracket_slots").update({ home_team_id:homeTeamId, away_team_id:awayTeamId }).eq("id", slotId); if (error) throw error;
}
export async function addPlayer(player: { team_id:string; name:string; cap_number:number; position?:string }) {
  const { data, error } = await supabase.from("players").insert(player).select().single(); if (error) throw error; return data;
}
export async function updatePlayer(playerId: string, fields: { name?:string; cap_number?:number }) {
  const { data, error } = await supabase.from("players").update(fields).eq("id", playerId).select().single(); if (error) throw error; return data;
}
export async function createTeam(team: { name:string; short_code:string; coach?:string; manager?:string; group_id:string; logo_url?:string }) {
  const { data, error } = await supabase.from("teams").insert(team).select("*, groups(name, pools(name))").single(); if (error) throw error; return data;
}
export async function updateTeamLogo(teamId: string, logoUrl: string) {
  const { error } = await supabase.from("teams").update({ logo_url: logoUrl }).eq("id", teamId); if (error) throw error;
}
export async function updateTeam(teamId: string, fields: { name?:string; short_code?:string; coach?:string; manager?:string; group_id?:string }) {
  const { data, error } = await supabase.from("teams").update(fields).eq("id", teamId).select("*, groups(name, pools(name))").single(); if (error) throw error; return data;
}
export async function deleteTeam(teamId: string) {
  const { error: playersError } = await supabase.from("players").delete().eq("team_id", teamId);
  if (playersError) throw playersError;
  const { error } = await supabase.from("teams").delete().eq("id", teamId); if (error) throw error;
}
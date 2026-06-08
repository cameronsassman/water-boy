import { supabase } from "./supabase";

const MATCH_SELECT = `*, home_team:teams!matches_home_team_id_fkey(id,name,short_code), away_team:teams!matches_away_team_id_fkey(id,name,short_code), groups(name), pools(name)`;

export async function getTournament() {
  const { data, error } = await supabase.from("tournaments").select("*").single();
  if (error) throw error; return data;
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
export async function getBracketSlots() {
  const { data } = await supabase.from("bracket_slots").select(`*, home_team:teams!bracket_slots_home_team_id_fkey(id,name), away_team:teams!bracket_slots_away_team_id_fkey(id,name)`).order("bracket").order("round").order("slot_number"); return data ?? [];
}
export async function createMatch(match: { tournament_id:string; pool_id:string; group_id?:string; home_team_id:string; away_team_id:string; stage:string; day:number; match_time:string }) {
  const { data, error } = await supabase.from("matches").insert(match).select().single(); if (error) throw error; return data;
}
export async function updateMatchScore(matchId: string, homeScore: number, awayScore: number, currentHalf: number, halfScores: { half:number; home:number; away:number }) {
  const updates: Record<string,number> = { home_score:homeScore, away_score:awayScore, current_half:currentHalf };
  if (halfScores.half===1) { updates.half1_home=halfScores.home; updates.half1_away=halfScores.away; }
  else { updates.half2_home=halfScores.home; updates.half2_away=halfScores.away; }
  const { error } = await supabase.from("matches").update(updates).eq("id", matchId); if (error) throw error;
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
export async function assignBracketSlot(slotId: string, homeTeamId: string, awayTeamId: string) {
  const { error } = await supabase.from("bracket_slots").update({ home_team_id:homeTeamId, away_team_id:awayTeamId }).eq("id", slotId); if (error) throw error;
}
export async function addPlayer(player: { team_id:string; name:string; cap_number:number; position:string }) {
  const { data, error } = await supabase.from("players").insert(player).select().single(); if (error) throw error; return data;
}

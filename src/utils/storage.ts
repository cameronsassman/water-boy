import { Team, Tournament } from "@/types/team";
import { MatchResult } from "@/types/match";

const API_BASE = "/api";

export const storageUtils = {
  // Get tournament
  getTournament: async (): Promise<Tournament> => {
    try {
      const res = await fetch(`${API_BASE}/tournament`);
      if (!res.ok) throw new Error("Failed to fetch tournament");
      return await res.json();
    } catch {
      return { teams: [], pools: [], matches: [] };
    }
  },

  // Save tournament
  saveTournament: async (tournament: Tournament): Promise<void> => {
    await fetch(`${API_BASE}/tournament`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tournament),
    });
  },

  // Teams
  addTeam: async (team: Team) => {
    await fetch(`${API_BASE}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
  },

  getTeams: async (): Promise<Team[]> => {
    const res = await fetch(`${API_BASE}/teams`);
    return res.ok ? await res.json() : [];
  },

  isSchoolNameTaken: async (
    schoolName: string,
    excludeTeamId?: string
  ): Promise<boolean> => {
    const teams = await storageUtils.getTeams();
    return teams.some(
      (team) =>
        team.schoolName.toLowerCase() === schoolName.toLowerCase() &&
        team.id !== excludeTeamId
    );
  },

  getTeamById: async (teamId: string): Promise<Team | null> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}`);
    if (!res.ok) return null;
    return await res.json();
  },

  updateTeam: async (teamId: string, updatedTeam: Team) => {
    await fetch(`${API_BASE}/teams/${teamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTeam),
    });
  },

  deleteTeam: async (teamId: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: "DELETE",
    });
    return res.ok;
  },

  // Matches
  getMatchResults: async (): Promise<MatchResult[]> => {
    const res = await fetch(`${API_BASE}/results`);
    if (!res.ok) return [];
    return await res.json();
  },

  getMatchResult: async (matchId: string): Promise<MatchResult | null> => {
    const res = await fetch(`${API_BASE}/results/${matchId}`);
    if (!res.ok) return null;
    return await res.json();
  },

  saveMatchResult: async (result: MatchResult) => {
    await fetch(`${API_BASE}/results/${result.matchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
  },

  clearMatchResults: async () => {
    const results = await storageUtils.getMatchResults();
    for (const r of results) {
      await fetch(`${API_BASE}/results/${r.matchId}`, { method: "DELETE" });
    }
  },

  // Tournament progress
  getTournamentProgress: async () => {
    const tournament = await storageUtils.getTournament();
    const results = await storageUtils.getMatchResults();

    const poolMatches = tournament.matches.filter((m) => m.stage === "pool");
    const knockoutMatches = tournament.matches.filter((m) =>
      ["cup", "plate", "shield"].includes(m.stage)
    );
    const festivalMatches = tournament.matches.filter(
      (m) => m.stage === "festival"
    );

    const completedPoolMatches = poolMatches.filter((m) => m.completed);
    const completedKnockoutMatches = knockoutMatches.filter((m) => m.completed);
    const completedFestivalMatches = festivalMatches.filter((m) => m.completed);

    return {
      pool: {
        total: poolMatches.length,
        completed: completedPoolMatches.length,
        pending: poolMatches.length - completedPoolMatches.length,
        completionPercentage:
          poolMatches.length > 0
            ? Math.round(
                (completedPoolMatches.length / poolMatches.length) * 100
              )
            : 0,
      },
      knockout: {
        total: knockoutMatches.length,
        completed: completedKnockoutMatches.length,
        pending: knockoutMatches.length - completedKnockoutMatches.length,
        completionPercentage:
          knockoutMatches.length > 0
            ? Math.round(
                (completedKnockoutMatches.length / knockoutMatches.length) * 100
              )
            : 0,
      },
      festival: {
        total: festivalMatches.length,
        completed: completedFestivalMatches.length,
        pending: festivalMatches.length - completedFestivalMatches.length,
        completionPercentage:
          festivalMatches.length > 0
            ? Math.round(
                (completedFestivalMatches.length / festivalMatches.length) * 100
              )
            : 0,
      },
      overall: {
        total: tournament.matches.length,
        completed: tournament.matches.filter(m => m.completed).length,
        totalGoals: results.reduce(
          (sum, r) => sum + (r.homeScore || 0) + (r.awayScore || 0),
          0
        ),
      },
    };
  },
};

const API_BASE = '/api';

export const apiClient = {
  // Teams
  async getTeams() {
    const response = await fetch(`${API_BASE}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  async createTeam(teamData: any) {
    const response = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  async updateTeam(teamId: string, teamData: any) {
    const response = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  async deleteTeam(teamId: string) {
    const response = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete team');
    return response.json();
  },

  async checkTeamName(schoolName: string, tournamentId: string, excludeTeamId?: string) {
    const response = await fetch(`${API_BASE}/teams/check-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schoolName, tournamentId, excludeTeamId }),
    });
    if (!response.ok) throw new Error('Failed to check team name');
    return response.json();
  },

  // Tournaments
  async getTournaments() {
    const response = await fetch(`${API_BASE}/tournaments`);
    if (!response.ok) throw new Error('Failed to fetch tournaments');
    return response.json();
  },

  async createTournament(tournamentData: any) {
    const response = await fetch(`${API_BASE}/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData),
    });
    if (!response.ok) throw new Error('Failed to create tournament');
    return response.json();
  },

  // Pools
  async getPools() {
    const response = await fetch(`${API_BASE}/pools`);
    if (!response.ok) throw new Error('Failed to fetch pools');
    return response.json();
  },
};
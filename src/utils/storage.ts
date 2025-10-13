import { Team, Tournament, PlayerType } from '@/types/team';
import { Match, MatchResult, PlayerStats, NewMatchForm } from '@/types/match';

const STORAGE_KEY = 'water-polo-tournament';
const RESULTS_KEY = 'water-polo-tournament-results';

export const storageUtils = {
  // Get all tournament data
  getTournament: (): Tournament => {
    if (typeof window === 'undefined') {
      return { teams: [], pools: [], matches: [] };
    }
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { teams: [], pools: [], matches: [] };
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return { teams: [], pools: [], matches: [] };
    }
  },

  // Save tournament data
  saveTournament: (tournament: Tournament): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
  },

  // Add a new team
  addTeam: (team: Team): void => {
    const tournament = storageUtils.getTournament();
    tournament.teams.push(team);
    storageUtils.saveTournament(tournament);
  },

  // Get all teams
  getTeams: (): Team[] => {
    return storageUtils.getTournament().teams;
  },

  // Check if school name already exists
  isSchoolNameTaken: (schoolName: string, excludeTeamId?: string): boolean => {
    const teams = storageUtils.getTeams();
    return teams.some(team => 
      team.schoolName.toLowerCase() === schoolName.toLowerCase() && 
      team.id !== excludeTeamId
    );
  },

  // PHASE 2: Enhanced match result saving with auto-progression
  saveMatchResult: (result: MatchResult): void => {
    const tournament = storageUtils.getTournament();
    
    // Find and update the match
    const matchIndex = tournament.matches.findIndex(m => m.id === result.matchId);
    if (matchIndex !== -1) {
      tournament.matches[matchIndex] = {
        ...tournament.matches[matchIndex],
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        completed: result.completed
      };
    }
    
    // Store match results separately for detailed stats
    const existingResults = storageUtils.getMatchResults();
    const resultIndex = existingResults.findIndex(r => r.matchId === result.matchId);
    
    if (resultIndex !== -1) {
      existingResults[resultIndex] = result;
    } else {
      existingResults.push(result);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(existingResults));
    }
    
    storageUtils.saveTournament(tournament);
  },

  // Get match results with player stats
  getMatchResults: (): MatchResult[] => {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(RESULTS_KEY);
    
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Get specific match result
  getMatchResult: (matchId: string): MatchResult | null => {
    const results = storageUtils.getMatchResults();
    return results.find(r => r.matchId === matchId) || null;
  },

  // Clear all match results
  clearMatchResults: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RESULTS_KEY);
  },

  // Clear only pool match results
  clearPoolMatchResults: (): void => {
    if (typeof window === 'undefined') return;
    
    const tournament = storageUtils.getTournament();
    const poolMatchIds = tournament.matches
      .filter(match => match.stage === 'pool')
      .map(match => match.id);
    
    const existingResults = storageUtils.getMatchResults();
    const filteredResults = existingResults.filter(result => 
      !poolMatchIds.includes(result.matchId)
    );
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify(filteredResults));
    
    // Also clear completion status from pool matches
    tournament.matches.forEach(match => {
      if (match.stage === 'pool') {
        match.completed = false;
        match.homeScore = undefined;
        match.awayScore = undefined;
      }
    });
    
    storageUtils.saveTournament(tournament);
  },

  // PHASE 2: Clear knockout and festival match results
  clearKnockoutMatchResults: (): void => {
    if (typeof window === 'undefined') return;
    
    const tournament = storageUtils.getTournament();
    const knockoutMatchIds = tournament.matches
      .filter(match => ['cup', 'plate', 'shield', 'festival'].includes(match.stage))
      .map(match => match.id);
    
    const existingResults = storageUtils.getMatchResults();
    const filteredResults = existingResults.filter(result => 
      !knockoutMatchIds.includes(result.matchId)
    );
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify(filteredResults));
    
    // Also clear completion status from knockout matches
    tournament.matches.forEach(match => {
      if (['cup', 'plate', 'shield', 'festival'].includes(match.stage)) {
        match.completed = false;
        match.homeScore = undefined;
        match.awayScore = undefined;
      }
    });
    
    storageUtils.saveTournament(tournament);
  },

  // PHASE 2: Get tournament progress statistics
  getTournamentProgress: () => {
    const tournament = storageUtils.getTournament();
    const results = storageUtils.getMatchResults();
    
    const poolMatches = tournament.matches.filter(m => m.stage === 'pool');
    const knockoutMatches = tournament.matches.filter(m => ['cup', 'plate', 'shield'].includes(m.stage));
    const festivalMatches = tournament.matches.filter(m => m.stage === 'festival');
    
    const completedPoolMatches = poolMatches.filter(m => m.completed);
    const completedKnockoutMatches = knockoutMatches.filter(m => m.completed);
    const completedFestivalMatches = festivalMatches.filter(m => m.completed);
    
    return {
      pool: {
        total: poolMatches.length,
        completed: completedPoolMatches.length,
        pending: poolMatches.length - completedPoolMatches.length,
        completionPercentage: poolMatches.length > 0 ? Math.round((completedPoolMatches.length / poolMatches.length) * 100) : 0
      },
      knockout: {
        total: knockoutMatches.length,
        completed: completedKnockoutMatches.length,
        pending: knockoutMatches.length - completedKnockoutMatches.length,
        completionPercentage: knockoutMatches.length > 0 ? Math.round((completedKnockoutMatches.length / knockoutMatches.length) * 100) : 0
      },
      festival: {
        total: festivalMatches.length,
        completed: completedFestivalMatches.length,
        pending: festivalMatches.length - completedFestivalMatches.length,
        completionPercentage: festivalMatches.length > 0 ? Math.round((completedFestivalMatches.length / festivalMatches.length) * 100) : 0
      },
      overall: {
        total: tournament.matches.length,
        completed: tournament.matches.filter(m => m.completed).length,
        totalGoals: results.reduce((sum, r) => sum + (r.homeScore || 0) + (r.awayScore || 0), 0)
      }
    };
  },

  // PHASE 2: Get team by ID
  getTeamById: (teamId: string): Team | null => {
    const teams = storageUtils.getTeams();
    return teams.find(team => team.id === teamId) || null;
  },

  // PHASE 2: Update team data
  updateTeam: (teamId: string, updatedTeam: Team): void => {
    const tournament = storageUtils.getTournament();
    const teamIndex = tournament.teams.findIndex(t => t.id === teamId);
    
    if (teamIndex !== -1) {
      tournament.teams[teamIndex] = updatedTeam;
      storageUtils.saveTournament(tournament);
    }
  },

  // PHASE 2: Delete team (with validation)
  deleteTeam: (teamId: string): boolean => {
    const tournament = storageUtils.getTournament();
    
    // Check if team has any matches
    const hasMatches = tournament.matches.some(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );
    
    if (hasMatches) {
      return false; // Cannot delete team with existing matches
    }
    
    // Remove team from teams array
    tournament.teams = tournament.teams.filter(t => t.id !== teamId);
    
    // Remove team from pool allocation
    tournament.pools.forEach(pool => {
      pool.teams = pool.teams.filter(tId => tId !== teamId);
    });
    
    storageUtils.saveTournament(tournament);
    return true;
  },

  // Clear all data (for testing)
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
  },

  // PHASE 2: Backup and restore functionality
  exportTournamentData: (): string => {
    const tournament = storageUtils.getTournament();
    const results = storageUtils.getMatchResults();
    
    return JSON.stringify({
      tournament,
      results,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }, null, 2);
  },

  importTournamentData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.tournament || !data.results) {
        throw new Error('Invalid tournament data format');
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tournament));
        localStorage.setItem(RESULTS_KEY, JSON.stringify(data.results));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing tournament data:', error);
      return false;
    }
  },

  // PHASE 2: Get storage info for debugging
  getStorageInfo: () => {
    if (typeof window === 'undefined') return null;
    
    const tournamentData = localStorage.getItem(STORAGE_KEY);
    const resultsData = localStorage.getItem(RESULTS_KEY);
    
    return {
      tournamentSize: tournamentData ? new Blob([tournamentData]).size : 0,
      resultsSize: resultsData ? new Blob([resultsData]).size : 0,
      totalSize: (tournamentData ? new Blob([tournamentData]).size : 0) + 
                 (resultsData ? new Blob([resultsData]).size : 0),
      lastModified: new Date().toISOString()
    };
  }
};

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const teamService = {
  // Create a new team
  async createTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
    const response = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }

    return response.json();
  },

  // Get all teams
  async getTeams(): Promise<Team[]> {
    const response = await fetch(`${API_BASE}/api/teams`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    return response.json();
  },

  // Get team by ID
  async getTeam(id: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/api/teams/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch team');
    }

    return response.json();
  },

  // Delete team
  async deleteTeam(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/teams/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete team');
    }
  }
};

export type { PlayerType, Team };

// Add to your existing storage.ts file, after the teamService

export const matchService = {
  // Create a new match
  async createMatch(matchData: any): Promise<any> {
    const response = await fetch(`${API_BASE}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match');
    }

    return response.json();
  },

  // Get all matches with filters
  async getMatches(filters?: { day?: number; stage?: string; poolId?: string; completed?: boolean }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.day) params.append('day', filters.day.toString());
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.poolId) params.append('poolId', filters.poolId);
    if (filters?.completed !== undefined) params.append('completed', filters.completed.toString());

    const url = `${API_BASE}/api/matches${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }

    return response.json();
  },

  // Delete match
  async deleteMatch(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/matches/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete match');
    }
  }
};
import { Team, Tournament } from '@/types/team';
import { MatchResult } from '@/types/match';

const STORAGE_KEY = 'water-polo-tournament';

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

  // Save match result
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
    const resultsKey = `${STORAGE_KEY}-results`;
    const existingResults = storageUtils.getMatchResults();
    const resultIndex = existingResults.findIndex(r => r.matchId === result.matchId);
    
    if (resultIndex !== -1) {
      existingResults[resultIndex] = result;
    } else {
      existingResults.push(result);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(resultsKey, JSON.stringify(existingResults));
    }
    
    storageUtils.saveTournament(tournament);
  },

  // Get match results with player stats
  getMatchResults: (): MatchResult[] => {
    if (typeof window === 'undefined') return [];
    
    const resultsKey = `${STORAGE_KEY}-results`;
    const data = localStorage.getItem(resultsKey);
    
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
    const resultsKey = `${STORAGE_KEY}-results`;
    localStorage.removeItem(resultsKey);
  },

  // Clear only pool match results
  clearPoolMatchResults: (): void => {
    if (typeof window === 'undefined') return;
    
    const tournament = storageUtils.getTournament();
    const poolMatchIds = tournament.matches
      .filter(match => match.stage === 'pool')
      .map(match => match.id);
    
    const resultsKey = `${STORAGE_KEY}-results`;
    const existingResults = storageUtils.getMatchResults();
    const filteredResults = existingResults.filter(result => 
      !poolMatchIds.includes(result.matchId)
    );
    
    localStorage.setItem(resultsKey, JSON.stringify(filteredResults));
  },

  // Clear all data (for testing)
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-results`);
  }
};
// src/utils/storage.ts
import { Team, Tournament } from '@/types/team';

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

  // Clear all data (for testing)
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
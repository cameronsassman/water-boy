// src/utils/validation.ts
import { Player } from '@/types/team';

export const validationUtils = {
  // Validate school name
  validateSchoolName: (name: string): string | null => {
    if (!name.trim()) return 'School name is required';
    if (name.trim().length < 2) return 'School name must be at least 2 characters';
    if (name.trim().length > 50) return 'School name must be less than 50 characters';
    return null;
  },

  // Validate person name (coach/manager)
  validatePersonName: (name: string, role: string): string | null => {
    if (!name.trim()) return `${role} name is required`;
    if (name.trim().length < 2) return `${role} name must be at least 2 characters`;
    if (name.trim().length > 30) return `${role} name must be less than 30 characters`;
    return null;
  },

  // Validate player name
  validatePlayerName: (name: string): string | null => {
    if (!name.trim()) return 'Player name is required';
    if (name.trim().length < 2) return 'Player name must be at least 2 characters';
    if (name.trim().length > 30) return 'Player name must be less than 30 characters';
    return null;
  },

  // Validate cap number
  validateCapNumber: (capNumber: number, players: Player[], playerId?: string): string | null => {
    if (capNumber < 1 || capNumber > 15) return 'Cap number must be between 1 and 15';
    
    // Check for duplicates within the team
    const duplicate = players.find(p => 
      p.capNumber === capNumber && p.id !== playerId
    );
    
    if (duplicate) return `Cap number ${capNumber} is already taken by ${duplicate.name}`;
    return null;
  },

  // Validate team players (10-13 players required)
  validateTeamPlayers: (players: Player[]): string | null => {
    if (players.length < 10) return 'Team must have at least 10 players';
    if (players.length > 13) return 'Team cannot have more than 13 players';
    return null;
  }
};
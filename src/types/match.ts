// types/match.ts
import { PlayerStats } from './player';

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeTeamStats: PlayerStats[];
  awayTeamStats: PlayerStats[];
  completed: boolean;
  completedAt?: string;
}

export const createDefaultMatchResult = (matchId: string): MatchResult => ({
  matchId,
  homeScore: 0,
  awayScore: 0,
  homeTeamStats: [],
  awayTeamStats: [],
  completed: false
});
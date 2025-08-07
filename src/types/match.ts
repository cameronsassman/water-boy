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
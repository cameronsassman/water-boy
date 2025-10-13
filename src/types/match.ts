// types/match.ts
import { PlayerStats } from './player';

export interface MatchResult {
  id?: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeTeamStats?: PlayerStats[];
  awayTeamStats?: PlayerStats[];
  completed: boolean;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createDefaultMatchResult = (matchId: string, homeTeamId: string, awayTeamId: string): MatchResult => ({
  matchId,
  homeTeamId,
  awayTeamId,
  homeScore: 0,
  awayScore: 0,
  homeTeamStats: [],
  awayTeamStats: [],
  completed: false
});

export interface NewMatchForm {
  homeTeamId: string;
  awayTeamId: string;
  poolId?: string;
  stage: string;
  day: number;
  timeSlot: string;
  arena: number;
  round?: string;
}

// export interface PlayerStats {
//   id?: string;
//   matchResultId?: string;
//   playerId: string;
//   capNumber: number;
//   goals: number;
//   kickOuts: number;
//   yellowCards: number;
//   redCards: number;
//   createdAt?: string;
//   updatedAt?: string;
// }
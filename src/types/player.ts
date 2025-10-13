// types/player.ts
export interface PlayerStats {
    id?: string;
    matchResultId?: string;
    playerId: string;
    capNumber: number;
    goals: number;
    kickOuts: number;
    yellowCards: number;
    redCards: number;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface MatchPlayerStats {
    matchId: string;
    homeTeamStats: PlayerStats[];
    awayTeamStats: PlayerStats[];
  }
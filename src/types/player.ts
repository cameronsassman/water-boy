export interface PlayerStats {
    playerId: string;
    capNumber: number;
    goals: number;
    kickOuts: number;
    yellowCards: number;
    redCards: number;
}
  
export interface MatchPlayerStats {
    matchId: string;
    homeTeamStats: PlayerStats[];
    awayTeamStats: PlayerStats[];
}
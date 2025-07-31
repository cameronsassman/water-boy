export interface Player {
    id: string;
    name: string;
    capNumber: number;
  }
  
  export interface Team {
    id: string;
    schoolName: string;
    coachName: string;
    managerName: string;
    players: Player[];
    poolId?: string; // Will be assigned during pool allocation
  }
  
  export interface Pool {
    id: string;
    name: string; // A, B, C, D
    teams: string[]; // team IDs
  }
  
  export interface Match {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    poolId?: string;
    stage: 'pool' | 'cup' | 'plate' | 'shield' | 'festival';
    homeScore?: number;
    awayScore?: number;
    completed: boolean;
  }
  
  export interface Tournament {
    teams: Team[];
    pools: Pool[];
    matches: Match[];
  }
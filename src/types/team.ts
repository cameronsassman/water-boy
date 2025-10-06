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
  stage: 'pool' | 'cup' | 'plate' | 'shield' | "playoff" | 'festival';
  homeScore?: number;
  awayScore?: number;
  completed: boolean;
  // New knockout-specific properties
  round?: string; // 'round-of-16', 'quarter-final', 'semi-final', 'final', 'third-place'
  bracketPosition?: number; // Position in bracket for ordering
  parentMatch1?: string; // ID of first parent match (for knockout progression)
  parentMatch2?: string; // ID of second parent match (for knockout progression)
}

export interface Tournament {
  teams: Team[];
  pools: Pool[];
  matches: Match[];
}

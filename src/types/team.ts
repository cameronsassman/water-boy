// types/team.ts
export interface Player {
  id: string;
  name: string;
  capNumber: number;
  teamId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  schoolName: string;
  coachName: string;
  managerName: string;
  poolAllocation?: string;
  poolId?: string;
  teamLogo?: string;
  players: Player[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pool {
  id: string;
  name: string;
  teams: string[];
}

export interface Tournament {
  id?: string;
  name?: string;
  teams: Team[];
  pools: Pool[];
  matches: Match[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  poolId?: string;
  stage: string;
  day: number;
  timeSlot: string;
  arena: number;
  completed: boolean;
  homeScore?: number;
  awayScore?: number;
  round?: string;
  bracketPosition?: number;
  parentMatch1?: string;
  parentMatch2?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerFormData {
  name: string;
  capNumber: number;
}

export interface TeamFormData {
  schoolName: string;
  coachName: string;
  managerName: string;
  poolAllocation: string;
  teamLogo?: string;
  players: PlayerFormData[];
}
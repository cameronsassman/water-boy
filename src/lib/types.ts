// types.ts
export type Player = {
  capNumber: number;
  name: string;
  goals: number;
  kickouts: number;
  yellowCards: number;
  redCards: number;
};

export type TeamStats = {
  wins: number;
  losses: number;
  draws: number;
};

export type Team = {
  name: string;
  score: number;
  stats: TeamStats;
  players: Player[];
};

export type TeamKey = "blue" | "white";
export type StatType = "goals" | "kickouts" | "yellowCards" | "redCards";
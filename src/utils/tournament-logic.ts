import { Team, Pool, Tournament, Match } from '@/types/team';
import { storageUtils } from './storage';

export const tournamentUtils = {
  // Randomly allocate teams into 4 pools (7 teams each)
  allocateTeamsToPools: (): void => {
    const tournament = storageUtils.getTournament();
    const teams = [...tournament.teams];
    
    // Clear existing pool assignments
    teams.forEach(team => {
      team.poolId = undefined;
    });

    // Shuffle teams randomly
    const shuffledTeams = teams.sort(() => Math.random() - 0.5);
    
    // Create pools
    const pools: Pool[] = [
      { id: 'A', name: 'Pool A', teams: [] },
      { id: 'B', name: 'Pool B', teams: [] },
      { id: 'C', name: 'Pool C', teams: [] },
      { id: 'D', name: 'Pool D', teams: [] }
    ];

    // Allocate teams to pools (7 per pool)
    shuffledTeams.forEach((team, index) => {
      const poolIndex = index % 4;
      const poolId = pools[poolIndex].id;
      
      team.poolId = poolId;
      pools[poolIndex].teams.push(team.id);
    });

    // Save updated tournament data
    tournament.teams = teams;
    tournament.pools = pools;
    storageUtils.saveTournament(tournament);
  },

  // Get teams by pool
  getTeamsByPool: (poolId: string): Team[] => {
    const teams = storageUtils.getTeams();
    return teams.filter(team => team.poolId === poolId);
  },

  // Check if pools have been allocated
  arePoolsAllocated: (): boolean => {
    const tournament = storageUtils.getTournament();
    return tournament.pools.length > 0 && 
           tournament.teams.some(team => team.poolId);
  },

  // Get pool standings (initial - all teams with 0 points)
  getPoolStandings: (poolId: string): TeamStanding[] => {
    const teams = tournamentUtils.getTeamsByPool(poolId);
    
    return teams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    })).sort((a, b) => a.team.schoolName.localeCompare(b.team.schoolName));
  },

  // Reset pool allocation (for testing)
  resetPools: (): void => {
    const tournament = storageUtils.getTournament();
    tournament.teams.forEach(team => {
      team.poolId = undefined;
    });
    tournament.pools = [];
    tournament.matches = tournament.matches.filter(match => match.stage !== 'pool');
    storageUtils.saveTournament(tournament);
  },

  // Generate all pool stage matches
  generatePoolMatches: (): void => {
    const tournament = storageUtils.getTournament();
    
    // Clear existing pool matches
    tournament.matches = tournament.matches.filter(match => match.stage !== 'pool');
    
    // Generate matches for each pool
    tournament.pools.forEach(pool => {
      const poolTeams = pool.teams;
      const poolMatches = generateRoundRobinMatches(poolTeams, pool.id);
      tournament.matches.push(...poolMatches);
    });

    storageUtils.saveTournament(tournament);
  },

  // Get matches for a specific pool
  getPoolMatches: (poolId: string): Match[] => {
    const tournament = storageUtils.getTournament();
    return tournament.matches.filter(match => 
      match.poolId === poolId && match.stage === 'pool'
    );
  },

  // Get all pool matches
  getAllPoolMatches: (): Match[] => {
    const tournament = storageUtils.getTournament();
    return tournament.matches.filter(match => match.stage === 'pool');
  },

  // Check if pool matches have been generated
  arePoolMatchesGenerated: (): boolean => {
    const poolMatches = tournamentUtils.getAllPoolMatches();
    return poolMatches.length > 0;
  },

  // Get match with team details
  getMatchWithTeams: (match: Match): MatchWithTeams => {
    const teams = storageUtils.getTeams();
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    
    return {
      ...match,
      homeTeam: homeTeam!,
      awayTeam: awayTeam!
    };
  }
};

// Helper function to generate round-robin matches for a pool
function generateRoundRobinMatches(teamIds: string[], poolId: string): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const match: Match = {
        id: `${poolId}-${i}-${j}-${Date.now()}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        poolId: poolId,
        stage: 'pool',
        completed: false
      };
      matches.push(match);
    }
  }
  
  return matches;
}

export interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface MatchWithTeams extends Match {
  homeTeam: Team;
  awayTeam: Team;
}
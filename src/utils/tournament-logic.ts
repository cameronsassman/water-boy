import { Team, Pool, Tournament, Match } from '@/types/team';
import { MatchResult } from '@/types/match';
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

  // Get pool standings with real calculations based on match results
  getPoolStandings: (poolId: string): TeamStanding[] => {
    const teams = tournamentUtils.getTeamsByPool(poolId);
    const poolMatches = tournamentUtils.getPoolMatches(poolId);
    const matchResults = storageUtils.getMatchResults();
    
    // Calculate standings for each team
    const standings: TeamStanding[] = teams.map(team => {
      const teamMatches = poolMatches.filter(match => 
        match.homeTeamId === team.id || match.awayTeamId === team.id
      );
      
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      
      teamMatches.forEach(match => {
        const result = matchResults.find(r => r.matchId === match.id);
        
        if (result && result.completed) {
          played++;
          
          const isHome = match.homeTeamId === team.id;
          const teamScore = isHome ? result.homeScore : result.awayScore;
          const opponentScore = isHome ? result.awayScore : result.homeScore;
          
          goalsFor += teamScore;
          goalsAgainst += opponentScore;
          
          if (teamScore > opponentScore) {
            won++;
          } else if (teamScore < opponentScore) {
            lost++;
          } else {
            drawn++;
          }
        }
      });
      
      const goalDifference = goalsFor - goalsAgainst;
      const points = (won * 3) + (drawn * 1); // 3 points for win, 1 for draw
      
      return {
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      };
    });
    
    // Sort standings: Points desc, Goal difference desc, Goals for desc, Team name asc
    return standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.schoolName.localeCompare(b.team.schoolName);
    });
  },

  // Get top 4 teams from a pool (for Cup qualification)
  getPoolQualifiers: (poolId: string): Team[] => {
    const standings = tournamentUtils.getPoolStandings(poolId);
    return standings.slice(0, 4).map(standing => standing.team);
  },

  // Get bottom 3 teams from a pool (for Festival)
  getPoolNonQualifiers: (poolId: string): Team[] => {
    const standings = tournamentUtils.getPoolStandings(poolId);
    return standings.slice(4).map(standing => standing.team);
  },

  // Check if pool stage is complete (all matches played)
  isPoolStageComplete: (poolId?: string): boolean => {
    if (poolId) {
      const poolMatches = tournamentUtils.getPoolMatches(poolId);
      return poolMatches.every(match => match.completed);
    }
    
    // Check all pools
    const pools = ['A', 'B', 'C', 'D'];
    return pools.every(pool => tournamentUtils.isPoolStageComplete(pool));
  },

  // Get overall tournament statistics
  getTournamentStats: () => {
    const allMatches = tournamentUtils.getAllPoolMatches();
    const completedMatches = allMatches.filter(match => match.completed);
    const matchResults = storageUtils.getMatchResults();
    
    const totalGoals = matchResults.reduce((total, result) => {
      return total + result.homeScore + result.awayScore;
    }, 0);
    
    const averageGoalsPerMatch = completedMatches.length > 0 
      ? (totalGoals / completedMatches.length).toFixed(1)
      : '0.0';
    
    return {
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      pendingMatches: allMatches.length - completedMatches.length,
      totalGoals,
      averageGoalsPerMatch: parseFloat(averageGoalsPerMatch)
    };
  },

  // Get all pool standings
  getAllPoolStandings: (): { [poolId: string]: TeamStanding[] } => {
    return {
      A: tournamentUtils.getPoolStandings('A'),
      B: tournamentUtils.getPoolStandings('B'),
      C: tournamentUtils.getPoolStandings('C'),
      D: tournamentUtils.getPoolStandings('D')
    };
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
    const matchResults = storageUtils.getMatchResults();
    const result = matchResults.find(r => r.matchId === match.id);
    
    return {
      ...match,
      homeTeam: homeTeam!,
      awayTeam: awayTeam!,
      homeScore: result?.homeScore,
      awayScore: result?.awayScore,
      completed: result?.completed || false
    };
  }
};

// Helper function to generate round-robin matches for a pool
function generateRoundRobinMatches(teamIds: string[], poolId: string): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const match: Match = {
        id: `${poolId}-${i}-${j}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
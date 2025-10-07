import { Team, Pool, Match } from '@/types/team';
import { MatchResult } from '@/types/match';
import { storageUtils } from './storage';

export const tournamentUtils = {
  // Randomly allocate teams into 4 pools (7 teams each)
  allocateTeamsToPools: async (): Promise<void> => {
    const tournament = await storageUtils.getTournament();
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

    // Allocate teams to pools
    shuffledTeams.forEach((team, index) => {
      const poolIndex = index % pools.length;
      const poolId = pools[poolIndex].id;
      team.poolId = poolId;
      pools[poolIndex].teams.push(team.id);
    });

    tournament.teams = teams;
    tournament.pools = pools;
    await storageUtils.saveTournament(tournament);
  },

  // Get teams by pool
  getTeamsByPool: async (poolId: string): Promise<Team[]> => {
    const teams = await storageUtils.getTeams();
    return teams.filter(team => team.poolId === poolId);
  },

  // Check if pools are allocated
  arePoolsAllocated: async (): Promise<boolean> => {
    const tournament = await storageUtils.getTournament();
    return tournament.pools.length > 0 &&
      tournament.teams.some(team => team.poolId);
  },

  // Get pool standings
  getPoolStandings: async (poolId: string): Promise<TeamStanding[]> => {
    const teams = await tournamentUtils.getTeamsByPool(poolId);
    const poolMatches = await tournamentUtils.getPoolMatches(poolId);
    const matchResults = await storageUtils.getMatchResults();

    const standings: TeamStanding[] = teams.map(team => {
      const teamMatches = poolMatches.filter(match =>
        match.homeTeamId === team.id || match.awayTeamId === team.id
      );

      let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

      teamMatches.forEach(match => {
        const result = matchResults.find(r => r.matchId === match.id);
        if (result && result.completed) {
          played++;
          const isHome = match.homeTeamId === team.id;
          const teamScore = isHome ? result.homeScore : result.awayScore;
          const opponentScore = isHome ? result.awayScore : result.homeScore;

          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) won++;
          else if (teamScore < opponentScore) lost++;
          else drawn++;
        }
      });

      return {
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: won * 3 + drawn
      };
    });

    return standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.schoolName.localeCompare(b.team.schoolName);
    });
  },

  // Get top 4 teams for Cup
  getPoolQualifiers: async (poolId: string): Promise<Team[]> => {
    const standings = await tournamentUtils.getPoolStandings(poolId);
    return standings.slice(0, 4).map(s => s.team);
  },

  // Get bottom 3 teams for Festival
  getPoolNonQualifiers: async (poolId: string): Promise<Team[]> => {
    const standings = await tournamentUtils.getPoolStandings(poolId);
    return standings.slice(4).map(s => s.team);
  },

  // Check if pool stage complete
  isPoolStageComplete: async (poolId?: string): Promise<boolean> => {
    if (poolId) {
      const poolMatches = await tournamentUtils.getPoolMatches(poolId);
      if (poolMatches.length === 0) return false;
      return poolMatches.every(m => m.completed);
    }

    const tournament = await storageUtils.getTournament();
    return tournament.pools.length > 0 &&
      await Promise.all(tournament.pools.map(p => tournamentUtils.isPoolStageComplete(p.id)))
        .then(results => results.every(Boolean));
  },

  // Get tournament stats
  getTournamentStats: async () => {
    const allMatches = await tournamentUtils.getAllPoolMatches();
    const completedMatches = allMatches.filter(m => m.completed);
    const matchResults = await storageUtils.getMatchResults();

    const totalGoals = matchResults.reduce((sum, r) => sum + (r.homeScore || 0) + (r.awayScore || 0), 0);
    const averageGoalsPerMatch = completedMatches.length ? (totalGoals / completedMatches.length) : 0;

    return {
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      pendingMatches: allMatches.length - completedMatches.length,
      totalGoals,
      averageGoalsPerMatch
    };
  },

  // Get pool matches
  getPoolMatches: async (poolId: string): Promise<Match[]> => {
    const tournament = await storageUtils.getTournament();
    return tournament.matches.filter(m => m.poolId === poolId && m.stage === 'pool');
  },

  getAllPoolMatches: async (): Promise<Match[]> => {
    const tournament = await storageUtils.getTournament();
    console.log(tournament)
    return tournament.matches.filter(m => m.stage === 'pool');
  },

  // Save match result and update progression
  saveMatchResultWithProgression: async (result: MatchResult) => {
    await storageUtils.saveMatchResult(result);

    const tournament = await storageUtils.getTournament();
    const match = tournament.matches.find(m => m.id === result.matchId);
    if (match) {
      match.completed = result.completed;
      match.homeScore = result.homeScore;
      match.awayScore = result.awayScore;
    }
    await storageUtils.saveTournament(tournament);

    if (result.completed) {
      await tournamentUtils.updateKnockoutProgression(result.matchId);
    }
  },

  // Update knockout progression
  updateKnockoutProgression: async (completedMatchId: string) => {
    const tournament = await storageUtils.getTournament();
    const match = tournament.matches.find(m => m.id === completedMatchId);
    const result = await storageUtils.getMatchResult(completedMatchId);

    if (!match || !result || !result.completed) return;

    const winnerId = result.homeScore > result.awayScore ? match.homeTeamId : match.awayTeamId;

    const dependentMatches = tournament.matches.filter(m =>
      m.parentMatch1 === completedMatchId || m.parentMatch2 === completedMatchId
    );

    dependentMatches.forEach(dm => {
      if (dm.parentMatch1 === completedMatchId) dm.homeTeamId = winnerId;
      if (dm.parentMatch2 === completedMatchId) dm.awayTeamId = winnerId;
    });

    await storageUtils.saveTournament(tournament);
  },

  // Get match with team details
  getMatchWithTeams: (match: Match): MatchWithTeams => {
    const tournament = storageUtils.getTournament();
    const homeTeam = tournament.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = tournament.teams.find(t => t.id === match.awayTeamId);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Teams not found for match ${match.id}`);
    }

    return {
      ...match,
      homeTeam,
      awayTeam
    };
  },

  // Helpers for match winner/loser
  getMatchWinner: async (matchId: string): Promise<string | null> => {
    const result = await storageUtils.getMatchResult(matchId);
    if (!result || !result.completed) return null;
    const match = (await storageUtils.getTournament()).matches.find(m => m.id === matchId);
    return result.homeScore > result.awayScore ? match?.homeTeamId || null : match?.awayTeamId || null;
  },

  getMatchLoser: async (matchId: string): Promise<string | null> => {
    const result = await storageUtils.getMatchResult(matchId);
    if (!result || !result.completed) return null;
    const match = (await storageUtils.getTournament()).matches.find(m => m.id === matchId);
    return result.homeScore < result.awayScore ? match?.homeTeamId || null : match?.awayTeamId || null;
  }
};

// Type definitions
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

export interface KnockoutBracket {
  roundOf16: Match[];
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match;
  thirdPlace: Match;
}

export interface PlateBracket {
  round1: Match[];
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match;
  thirdPlace: Match;
}

export interface ShieldBracket {
  semiFinals: Match[];
  final: Match;
  thirdPlace: Match;
}

export interface KnockoutBracketWithTeams {
  roundOf16: MatchWithTeams[];
  quarterFinals: MatchWithTeams[];
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

export interface PlateBracketWithTeams {
  round1: MatchWithTeams[];
  quarterFinals: MatchWithTeams[];
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

export interface ShieldBracketWithTeams {
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

export interface BracketStatus {
  poolStageComplete: boolean;
  knockoutGenerated: boolean;
  cupBracket: KnockoutBracketWithTeams | null;
  plateBracket: PlateBracketWithTeams | null;
  shieldBracket: ShieldBracketWithTeams | null;
  festivalMatches: MatchWithTeams[];
}
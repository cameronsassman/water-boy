// utils/tournament-logic.ts
import { Team, Pool, Tournament, Match } from '@/types/team';
import { MatchResult } from '@/types/match';
import { teamService, matchService } from '@/utils/storage';

interface ExtendedMatch extends Match {
  parent1Result?: 'winner' | 'loser';
  parent2Result?: 'winner' | 'loser';
}

export const tournamentUtils = {
  getTournament: async (): Promise<Tournament> => {
    try {
      const teams = await teamService.getTeams();
      const matches = await matchService.getMatches();
      
      return {
        name: 'Water Polo Tournament',
        teams,
        pools: await tournamentUtils.getPoolsFromTeams(teams),
        matches
      };
    } catch (error) {
      console.error('Error getting tournament data:', error);
      throw new Error('Failed to load tournament data');
    }
  },

  getTeams: async (): Promise<Team[]> => {
    try {
      return await teamService.getTeams();
    } catch (error) {
      console.error('Error getting teams:', error);
      throw new Error('Failed to load teams');
    }
  },

  getMatches: async (): Promise<Match[]> => {
    try {
      return await matchService.getMatches();
    } catch (error) {
      console.error('Error getting matches:', error);
      throw new Error('Failed to load matches');
    }
  },

  getMatchResults: async (): Promise<MatchResult[]> => {
    try {
      const matches = await matchService.getMatches();
      return matches.map(match => ({
        matchId: match.id,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        homeTeamStats: [],
        awayTeamStats: [],
        completed: match.completed || false
      }));
    } catch (error) {
      console.error('Error getting match results:', error);
      throw new Error('Failed to load match results');
    }
  },

  getPoolsFromTeams: async (teams: Team[]): Promise<Pool[]> => {
    const pools: Pool[] = [
      { id: 'A', name: 'Pool A', teams: [] },
      { id: 'B', name: 'Pool B', teams: [] },
      { id: 'C', name: 'Pool C', teams: [] },
      { id: 'D', name: 'Pool D', teams: [] }
    ];

    teams.forEach(team => {
      const poolId = team.poolId || team.poolAllocation;
      if (poolId) {
        const pool = pools.find(p => p.id === poolId);
        if (pool) {
          pool.teams.push(team.id);
        }
      }
    });

    return pools;
  },

  allocateTeamsToPools: async (): Promise<void> => {
    try {
      const teams = await teamService.getTeams();
      
      const updatedTeams = teams.map(team => ({
        ...team,
        poolId: undefined,
        poolAllocation: undefined
      }));

      const shuffledTeams = [...updatedTeams].sort(() => Math.random() - 0.5);
      const pools = ['A', 'B', 'C', 'D'];
      
      shuffledTeams.forEach((team, index) => {
        const poolId = pools[index % pools.length];
        team.poolId = poolId;
        team.poolAllocation = poolId;
      });

      for (const team of shuffledTeams) {
        await teamService.updateTeam(team.id, team);
      }

    } catch (error) {
      console.error('Error allocating teams to pools:', error);
      throw new Error('Failed to allocate teams to pools');
    }
  },

  getTeamsByPool: async (poolId: string): Promise<Team[]> => {
    try {
      const teams = await teamService.getTeams();
      return teams.filter(team => (team.poolId === poolId || team.poolAllocation === poolId));
    } catch (error) {
      console.error('Error getting teams by pool:', error);
      throw new Error('Failed to load teams for pool');
    }
  },

  arePoolsAllocated: async (): Promise<boolean> => {
    try {
      const teams = await teamService.getTeams();
      return teams.some(team => team.poolId || team.poolAllocation);
    } catch (error) {
      console.error('Error checking pool allocation:', error);
      return false;
    }
  },

  getPoolStandings: async (poolId: string): Promise<TeamStanding[]> => {
    try {
      const teams = await tournamentUtils.getTeamsByPool(poolId);
      const poolMatches = await tournamentUtils.getPoolMatches(poolId);
      const matchResults = await tournamentUtils.getMatchResults();
      
      const standings: TeamStanding[] = await Promise.all(
        teams.map(async (team) => {
          const teamMatches = poolMatches.filter(match => 
            match.homeTeamId === team.id || match.awayTeamId === team.id
          );
          
          let played = 0;
          let won = 0;
          let drawn = 0;
          let lost = 0;
          let goalsFor = 0;
          let goalsAgainst = 0;
          
          for (const match of teamMatches) {
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
          }
          
          const goalDifference = goalsFor - goalsAgainst;
          const points = (won * 3) + (drawn * 1);
          
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
        })
      );
      
      return standings.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.schoolName.localeCompare(b.team.schoolName);
      });
    } catch (error) {
      console.error('Error getting pool standings:', error);
      throw new Error('Failed to calculate pool standings');
    }
  },

  getPoolQualifiers: async (poolId: string): Promise<Team[]> => {
    try {
      const standings = await tournamentUtils.getPoolStandings(poolId);
      return standings.slice(0, 4).map(standing => standing.team);
    } catch (error) {
      console.error('Error getting pool qualifiers:', error);
      throw new Error('Failed to get pool qualifiers');
    }
  },

  getPoolNonQualifiers: async (poolId: string): Promise<Team[]> => {
    try {
      const standings = await tournamentUtils.getPoolStandings(poolId);
      return standings.slice(4).map(standing => standing.team);
    } catch (error) {
      console.error('Error getting pool non-qualifiers:', error);
      throw new Error('Failed to get pool non-qualifiers');
    }
  },

  isPoolStageComplete: async (poolId?: string): Promise<boolean> => {
    try {
      if (poolId) {
        const poolMatches = await tournamentUtils.getPoolMatches(poolId);
        if (poolMatches.length === 0) return false; 
        return poolMatches.every(match => match.completed);
      }
      
      const pools = ['A', 'B', 'C', 'D'];
      const poolCompletion = await Promise.all(
        pools.map(pool => tournamentUtils.isPoolStageComplete(pool))
      );
      return poolCompletion.every(complete => complete);
    } catch (error) {
      console.error('Error checking pool stage completion:', error);
      return false;
    }
  },

  getTournamentStats: async () => {
    try {
      const allMatches = await tournamentUtils.getAllPoolMatches();
      const completedMatches = allMatches.filter(match => match.completed);
      const matchResults = await tournamentUtils.getMatchResults();
      
      const totalGoals = matchResults.reduce((total, result) => {
        return total + (result.homeScore || 0) + (result.awayScore || 0);
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
    } catch (error) {
      console.error('Error getting tournament stats:', error);
      throw new Error('Failed to get tournament statistics');
    }
  },

  getAllPoolStandings: async (): Promise<{ [poolId: string]: TeamStanding[] }> => {
    try {
      const pools = ['A', 'B', 'C', 'D'];
      const allStandings: { [poolId: string]: TeamStanding[] } = {};
      
      for (const poolId of pools) {
        allStandings[poolId] = await tournamentUtils.getPoolStandings(poolId);
      }
      
      return allStandings;
    } catch (error) {
      console.error('Error getting all pool standings:', error);
      throw new Error('Failed to get all pool standings');
    }
  },

  resetPools: async (): Promise<void> => {
    try {
      const teams = await teamService.getTeams();
      const matches = await matchService.getMatches();
      
      for (const team of teams) {
        if (team.poolId || team.poolAllocation) {
          await teamService.updateTeam(team.id, { 
            ...team, 
            poolId: undefined,
            poolAllocation: undefined 
          });
        }
      }
      
      const poolMatches = matches.filter(match => match.stage === 'pool');
      for (const match of poolMatches) {
        await matchService.deleteMatch(match.id);
      }
    } catch (error) {
      console.error('Error resetting pools:', error);
      throw new Error('Failed to reset pools');
    }
  },

  clearPoolMatches: async (): Promise<void> => {
    try {
      const matches = await matchService.getMatches();
      const poolMatches = matches.filter(match => match.stage === 'pool');
      
      for (const match of poolMatches) {
        await matchService.deleteMatch(match.id);
      }
    } catch (error) {
      console.error('Error clearing pool matches:', error);
      throw new Error('Failed to clear pool matches');
    }
  },

  generatePoolMatches: async (): Promise<void> => {
    try {
      const teams = await teamService.getTeams();
      const existingMatches = await matchService.getMatches();
      
      const nonPoolMatches = existingMatches.filter(match => match.stage !== 'pool');
      const newMatches: Match[] = [];
      const pools = ['A', 'B', 'C', 'D'];
      
      for (const poolId of pools) {
        const poolTeams = teams.filter(team => 
          team.poolId === poolId || team.poolAllocation === poolId
        );
        const poolTeamIds = poolTeams.map(team => team.id);
        const poolMatches = generateRoundRobinMatches(poolTeamIds, poolId, 'pool');
        newMatches.push(...poolMatches);
      }

      const allMatches = [...nonPoolMatches, ...newMatches];
      
      for (const match of existingMatches) {
        await matchService.deleteMatch(match.id);
      }
      
      for (const match of allMatches) {
        await matchService.createMatch(match);
      }
    } catch (error) {
      console.error('Error generating pool matches:', error);
      throw new Error('Failed to generate pool matches');
    }
  },

  getPoolMatches: async (poolId: string): Promise<Match[]> => {
    try {
      const matches = await matchService.getMatches();
      return matches.filter(match => 
        match.poolId === poolId && match.stage === 'pool'
      );
    } catch (error) {
      console.error('Error getting pool matches:', error);
      throw new Error('Failed to get pool matches');
    }
  },

  getAllPoolMatches: async (): Promise<Match[]> => {
    try {
      const matches = await matchService.getMatches();
      return matches.filter(match => match.stage === 'pool');
    } catch (error) {
      console.error('Error getting all pool matches:', error);
      throw new Error('Failed to get all pool matches');
    }
  },

  arePoolMatchesGenerated: async (): Promise<boolean> => {
    try {
      const poolMatches = await tournamentUtils.getAllPoolMatches();
      return poolMatches.length > 0;
    } catch (error) {
      console.error('Error checking pool matches generation:', error);
      return false;
    }
  },

  getMatchWithTeams: async (match: Match): Promise<MatchWithTeams> => {
    try {
      const teams = await teamService.getTeams();
      const homeTeam = teams.find(t => t.id === match.homeTeamId);
      const awayTeam = teams.find(t => t.id === match.awayTeamId);
      const matchResults = await tournamentUtils.getMatchResults();
      const result = matchResults.find(r => r.matchId === match.id);
      
      return {
        ...match,
        homeTeam: homeTeam!, 
        awayTeam: awayTeam!,
        homeScore: result?.homeScore,
        awayScore: result?.awayScore,
        completed: result?.completed || false
      };
    } catch (error) {
      console.error('Error getting match with teams:', error);
      throw new Error('Failed to get match with team details');
    }
  },

  getMatchWinner: async (matchId: string): Promise<string | null> => {
    try {
      const matchResults = await tournamentUtils.getMatchResults();
      const result = matchResults.find(r => r.matchId === matchId);
      if (!result || !result.completed) return null;
      
      const matches = await matchService.getMatches();
      const match = matches.find(m => m.id === matchId);
      if (!match) return null;

      return result.homeScore > result.awayScore ? match.homeTeamId : match.awayTeamId;
    } catch (error) {
      console.error('Error getting match winner:', error);
      return null;
    }
  },

  getMatchLoser: async (matchId: string): Promise<string | null> => {
    try {
      const matchResults = await tournamentUtils.getMatchResults();
      const result = matchResults.find(r => r.matchId === matchId);
      if (!result || !result.completed) return null;
      
      const matches = await matchService.getMatches();
      const match = matches.find(m => m.id === matchId);
      if (!match) return null;

      return result.homeScore < result.awayScore ? match.homeTeamId : match.awayTeamId;
    } catch (error) {
      console.error('Error getting match loser:', error);
      return null;
    }
  },

  areKnockoutBracketsGenerated: async (): Promise<boolean> => {
    try {
      const matches = await matchService.getMatches();
      return matches.some(match => match.stage === 'cup' && match.round === 'round-of-16');
    } catch (error) {
      console.error('Error checking knockout brackets:', error);
      return false;
    }
  },

  getCupBracket: async (): Promise<KnockoutBracket> => {
    try {
      const matches = await matchService.getMatches();
      const cupMatches = matches.filter(match => match.stage === 'cup');

      return {
        roundOf16: cupMatches.filter(m => m.round === 'round-of-16').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        quarterFinals: cupMatches.filter(m => m.round === 'quarter-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        semiFinals: cupMatches.filter(m => m.round === 'semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: cupMatches.find(m => m.round === 'final')!,
        thirdPlace: cupMatches.find(m => m.round === 'third-place')!
      };
    } catch (error) {
      console.error('Error getting cup bracket:', error);
      throw new Error('Failed to get cup bracket');
    }
  },

  getPlateBracket: async (): Promise<PlateBracket> => {
    try {
      const matches = await matchService.getMatches();
      const plateMatches = matches.filter(match => match.stage === 'plate');

      return {
        round1: plateMatches.filter(m => m.round === 'plate-round-1').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        quarterFinals: plateMatches.filter(m => m.round === 'plate-quarter-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        semiFinals: plateMatches.filter(m => m.round === 'plate-semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: plateMatches.find(m => m.round === 'plate-final')!,
        thirdPlace: plateMatches.find(m => m.round === 'plate-third-place')!
      };
    } catch (error) {
      console.error('Error getting plate bracket:', error);
      throw new Error('Failed to get plate bracket');
    }
  },

  getShieldBracket: async (): Promise<ShieldBracket> => {
    try {
      const matches = await matchService.getMatches();
      const shieldMatches = matches.filter(match => match.stage === 'shield');

      return {
        semiFinals: shieldMatches.filter(m => m.round === 'shield-semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: shieldMatches.find(m => m.round === 'shield-final')!,
        thirdPlace: shieldMatches.find(m => m.round === 'shield-third-place')!
      };
    } catch (error) {
      console.error('Error getting shield bracket:', error);
      throw new Error('Failed to get shield bracket');
    }
  },

  getFestivalMatches: async (): Promise<Match[]> => {
    try {
      const matches = await matchService.getMatches();
      return matches.filter(match => match.stage === 'festival');
    } catch (error) {
      console.error('Error getting festival matches:', error);
      throw new Error('Failed to get festival matches');
    }
  },

  getCupBracketWithTeams: async (): Promise<KnockoutBracketWithTeams> => {
    try {
      const bracket = await tournamentUtils.getCupBracket();
      return await mapBracketMatchesToTeams(bracket);
    } catch (error) {
      console.error('Error getting cup bracket with teams:', error);
      throw new Error('Failed to get cup bracket with teams');
    }
  },

  getPlateBracketWithTeams: async (): Promise<PlateBracketWithTeams> => {
    try {
      const bracket = await tournamentUtils.getPlateBracket();
      return await mapBracketMatchesToTeams(bracket);
    } catch (error) {
      console.error('Error getting plate bracket with teams:', error);
      throw new Error('Failed to get plate bracket with teams');
    }
  },

  getShieldBracketWithTeams: async (): Promise<ShieldBracketWithTeams> => {
    try {
      const bracket = await tournamentUtils.getShieldBracket();
      return await mapBracketMatchesToTeams(bracket);
    } catch (error) {
      console.error('Error getting shield bracket with teams:', error);
      throw new Error('Failed to get shield bracket with teams');
    }
  },

  getFestivalMatchesWithTeams: async (): Promise<MatchWithTeams[]> => {
    try {
      const festivalMatches = await tournamentUtils.getFestivalMatches();
      const matchesWithTeams: MatchWithTeams[] = [];
      
      for (const match of festivalMatches) {
        matchesWithTeams.push(await tournamentUtils.getMatchWithTeams(match));
      }
      
      return matchesWithTeams;
    } catch (error) {
      console.error('Error getting festival matches with teams:', error);
      throw new Error('Failed to get festival matches with teams');
    }
  },

  getBracketStatus: async (): Promise<BracketStatus> => {
    try {
      const poolStageComplete = await tournamentUtils.isPoolStageComplete();
      const knockoutGenerated = await tournamentUtils.areKnockoutBracketsGenerated();
      
      let cupBracket = null;
      let plateBracket = null;
      let shieldBracket = null;
      let festivalMatches: MatchWithTeams[] = [];

      if (knockoutGenerated) {
        cupBracket = await tournamentUtils.getCupBracketWithTeams();
        plateBracket = await tournamentUtils.getPlateBracketWithTeams();
        shieldBracket = await tournamentUtils.getShieldBracketWithTeams();
        festivalMatches = await tournamentUtils.getFestivalMatchesWithTeams();
      }

      return {
        poolStageComplete,
        knockoutGenerated,
        cupBracket,
        plateBracket,
        shieldBracket,
        festivalMatches
      };
    } catch (error) {
      console.error('Error getting bracket status:', error);
      throw new Error('Failed to get bracket status');
    }
  },

  areBracketsLocked: async (): Promise<boolean> => {
    try {
      const matches = await matchService.getMatches();
      const knockoutMatches = matches.filter(match => 
        ['cup', 'plate', 'shield'].includes(match.stage)
      );
      
      return knockoutMatches.some(match => match.completed);
    } catch (error) {
      console.error('Error checking bracket lock status:', error);
      return false;
    }
  },

  clearKnockoutAndFestivalMatches: async (): Promise<void> => {
    try {
      const matches = await matchService.getMatches();
      const knockoutMatches = matches.filter(match => 
        ['cup', 'plate', 'shield', 'festival'].includes(match.stage)
      );
      
      for (const match of knockoutMatches) {
        await matchService.deleteMatch(match.id);
      }
    } catch (error) {
      console.error('Error clearing knockout matches:', error);
      throw new Error('Failed to clear knockout matches');
    }
  },

  saveMatchResultWithProgression: async (result: MatchResult): Promise<void> => {
    try {
      const match = await matchService.getMatch(result.matchId);
      if (match) {
        const updatedMatch = {
          ...match,
          completed: result.completed,
          homeScore: result.homeScore,
          awayScore: result.awayScore
        };
        await matchService.updateMatch(result.matchId, updatedMatch);
      }

      if (result.completed) {
        await tournamentUtils.updateKnockoutProgression(result.matchId);
      }
    } catch (error) {
      console.error('Error saving match result with progression:', error);
      throw new Error('Failed to save match result');
    }
  },

  updateKnockoutProgression: async (completedMatchId: string): Promise<void> => {
    try {
      const matches = await matchService.getMatches();
      const completedMatch = matches.find(m => m.id === completedMatchId);
      const matchResults = await tournamentUtils.getMatchResults();
      const result = matchResults.find(r => r.matchId === completedMatchId);

      if (!completedMatch || !result || !result.completed) {
        return;
      }

      const winnerId = result.homeScore > result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;
      const loserId = result.homeScore < result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;

      const dependentMatches = matches.filter(m => 
        m.parentMatch1 === completedMatchId || m.parentMatch2 === completedMatchId
      );

      for (const dependentMatch of dependentMatches) {
        if (dependentMatch.stage === 'cup' && dependentMatch.round !== 'third-place') {
          if (dependentMatch.parentMatch1 === completedMatchId) {
            dependentMatch.homeTeamId = winnerId;
          } else if (dependentMatch.parentMatch2 === completedMatchId) {
            dependentMatch.awayTeamId = winnerId;
          }
        }
        else if (dependentMatch.stage === 'plate' || dependentMatch.stage === 'shield' || dependentMatch.round === 'third-place') {
          if (dependentMatch.parentMatch1 === completedMatchId) {
            dependentMatch.homeTeamId = loserId;
          } else if (dependentMatch.parentMatch2 === completedMatchId) {
            dependentMatch.awayTeamId = loserId;
          }
        }

        await matchService.updateMatch(dependentMatch.id, dependentMatch);
      }

      await tournamentUtils.autoGenerateSubsequentRounds();
    } catch (error) {
      console.error('Error updating knockout progression:', error);
      throw new Error('Failed to update knockout progression');
    }
  },

  autoGenerateSubsequentRounds: async (): Promise<void> => {
    console.log('Auto-generating subsequent rounds...');
  }
};

function generateRoundRobinMatches(
  teamIds: string[], 
  poolId?: string, 
  stage: 'pool' | 'festival' = 'pool'
): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const match: Match = {
        id: `${stage}-${teamIds[i]}-${teamIds[j]}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        poolId: poolId,
        stage: stage,
        day: 1,
        timeSlot: '08:00',
        arena: 1,
        completed: false
      };
      matches.push(match);
    }
  }
  
  return matches;
}

function createMatch(
  stage: 'cup' | 'plate' | 'shield' | 'pool' | 'festival' | 'playoff', 
  round: string, 
  homeTeamId: string, 
  awayTeamId: string, 
  bracketPosition?: number
): Match {
  return {
    id: `${stage}-${round}-${homeTeamId}-vs-${awayTeamId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    homeTeamId,
    awayTeamId,
    stage,
    round,
    day: 3,
    timeSlot: '08:00',
    arena: 1,
    completed: false,
    bracketPosition
  } as Match;
}

function createPlaceholderMatch(
  stage: 'cup' | 'plate' | 'shield' | 'pool' | 'festival' | 'playoff',
  round: string,
  parentMatch1Id: string,
  parentMatch2Id: string,
  bracketPosition: number,
  parent1Result: 'winner' | 'loser' = 'winner',
  parent2Result: 'winner' | 'loser' = 'winner'
): Match {
  const match: any = {
    id: `${stage}-${round}-pos${bracketPosition}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    homeTeamId: 'TBD',
    awayTeamId: 'TBD',
    stage,
    round,
    day: 3,
    timeSlot: '08:00',
    arena: 1,
    completed: false,
    bracketPosition,
    parentMatch1: parentMatch1Id,
    parentMatch2: parentMatch2Id
  };
  
  if (parent1Result !== 'winner') match.parent1Result = parent1Result;
  if (parent2Result !== 'winner') match.parent2Result = parent2Result;
  
  return match as Match;
}

async function mapBracketMatchesToTeams<T extends KnockoutBracket | PlateBracket | ShieldBracket>(
  bracket: T
): Promise<T extends KnockoutBracket ? KnockoutBracketWithTeams : T extends PlateBracket ? PlateBracketWithTeams : ShieldBracketWithTeams> {
  const teams = await tournamentUtils.getTeams();

  const getMatchWithDetails = async (match: Match): Promise<MatchWithTeams | null> => {
    if (!match) return null;
    
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    
    if (!homeTeam || !awayTeam) {
      return {
        ...match,
        homeTeam: homeTeam || { id: 'TBD', schoolName: 'TBD', coachName: '', managerName: '', players: [] },
        awayTeam: awayTeam || { id: 'TBD', schoolName: 'TBD', coachName: '', managerName: '', players: [] },
        homeScore: undefined,
        awayScore: undefined,
        completed: false
      };
    }
    
    const matchResults = await tournamentUtils.getMatchResults();
    const result = matchResults.find(r => r.matchId === match.id);
    
    return {
      ...match,
      homeTeam,
      awayTeam,
      homeScore: result?.homeScore,
      awayScore: result?.awayScore,
      completed: result?.completed || false
    };
  };

  const mappedBracket: any = {};
  for (const key in bracket) {
    if (Array.isArray((bracket as any)[key])) {
      const matches = (bracket as any)[key] as Match[];
      const matchesWithTeams = await Promise.all(
        matches.map(match => getMatchWithDetails(match))
      );
      mappedBracket[key] = matchesWithTeams.filter(Boolean);
    } else if ((bracket as any)[key]) {
      mappedBracket[key] = await getMatchWithDetails((bracket as any)[key] as Match);
    }
  }
  return mappedBracket as any;
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
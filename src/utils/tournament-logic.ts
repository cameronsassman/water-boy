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
      { id: 'C', name: 'Pool C', teams: [] }
    ];
    // Dynamically add Pool D if there are enough teams for it
    if (shuffledTeams.length > 21) { // If more than 3 pools of 7 teams
      pools.push({ id: 'D', name: 'Pool D', teams: [] });
    }


    // Allocate teams to pools (distribute evenly)
    shuffledTeams.forEach((team, index) => {
      const poolIndex = index % pools.length; // Use pools.length for dynamic allocation
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
      // If no matches generated for a pool, it's not complete
      if (poolMatches.length === 0) return false; 
      return poolMatches.every(match => match.completed);
    }
    
    // Check all pools
    const pools = storageUtils.getTournament().pools.map(p => p.id);
    // If no pools allocated, pool stage is not complete
    if (pools.length === 0) return false;
    return pools.every(pool => tournamentUtils.isPoolStageComplete(pool));
  },

  // Get overall tournament statistics
  getTournamentStats: () => {
    const allMatches = tournamentUtils.getAllPoolMatches();
    const completedMatches = allMatches.filter(match => match.completed);
    const matchResults = storageUtils.getMatchResults();
    
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
  },

  // Get all pool standings
  getAllPoolStandings: (): { [poolId: string]: TeamStanding[] } => {
    const pools = storageUtils.getTournament().pools.map(p => p.id);
    const allStandings: { [poolId: string]: TeamStanding[] } = {};
    pools.forEach(poolId => {
      allStandings[poolId] = tournamentUtils.getPoolStandings(poolId);
    });
    return allStandings;
  },

  // Reset pool allocation (for testing)
  resetPools: (): void => {
    const tournament = storageUtils.getTournament();
    tournament.teams.forEach(team => {
      team.poolId = undefined;
    });
    tournament.pools = [];
    // Keep only non-pool matches if any, though typically all would be cleared
    tournament.matches = tournament.matches.filter(match => match.stage !== 'pool');
    storageUtils.saveTournament(tournament);
    storageUtils.clearPoolMatchResults(); // Clear results for pool matches too
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
      homeTeam: homeTeam!, // Assert non-null as these should always exist for valid matches
      awayTeam: awayTeam!, // Assert non-null
      homeScore: result?.homeScore,
      awayScore: result?.awayScore,
      completed: result?.completed || false
    };
  },

  // NEW: Generate Cup Round of 16 bracket
  generateCupBracket: (): KnockoutBracket => {
    if (!tournamentUtils.isPoolStageComplete()) {
      throw new Error('Pool stage must be completed before generating knockout bracket');
    }
    if (tournamentUtils.areKnockoutBracketsGenerated()) {
      // If already generated, just return the existing bracket
      return tournamentUtils.getCupBracket();
    }

    const tournament = storageUtils.getTournament();
    
    // Get qualifiers from each pool (top 4)
    const poolAQualifiers = tournamentUtils.getPoolQualifiers('A');
    const poolBQualifiers = tournamentUtils.getPoolQualifiers('B');
    const poolCQualifiers = tournamentUtils.getPoolQualifiers('C');
    const poolDQualifiers = tournamentUtils.getPoolQualifiers('D');

    // Clear existing knockout matches (if any, though check above should prevent re-gen)
    tournament.matches = tournament.matches.filter(match => 
      !['cup', 'plate', 'shield', 'festival'].includes(match.stage)
    );

    // Generate Round of 16 matches with A vs D, B vs C alternating format
    const roundOf16Matches: Match[] = [];
    
    // A1 vs D4, A2 vs D3, A3 vs D2, A4 vs D1
    for (let i = 0; i < 4; i++) {
      const matchId = `cup-r16-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      roundOf16Matches.push({
        id: matchId,
        homeTeamId: poolAQualifiers[i].id,
        awayTeamId: poolDQualifiers[3 - i].id,
        stage: 'cup',
        completed: false,
        round: 'round-of-16',
        bracketPosition: i + 1
      });
    }

    // B1 vs C4, B2 vs C3, B3 vs C2, B4 vs C1
    for (let i = 0; i < 4; i++) {
      const matchId = `cup-r16-${i + 5}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      roundOf16Matches.push({
        id: matchId,
        homeTeamId: poolBQualifiers[i].id,
        awayTeamId: poolCQualifiers[3 - i].id,
        stage: 'cup',
        completed: false,
        round: 'round-of-16',
        bracketPosition: i + 5
      });
    }

    // Add matches to tournament
    tournament.matches.push(...roundOf16Matches);
    
    // Generate placeholder matches for subsequent Cup rounds
    const quarterFinalMatches = generatePlaceholderMatches('cup', 'quarter-final', 4, roundOf16Matches);
    const semiFinalMatches = generatePlaceholderMatches('cup', 'semi-final', 2, quarterFinalMatches);
    const cupFinal = generatePlaceholderMatches('cup', 'final', 1, semiFinalMatches);
    const cupThirdPlace = generatePlaceholderMatches('cup', 'third-place', 1, semiFinalMatches);

    tournament.matches.push(...quarterFinalMatches, ...semiFinalMatches, ...cupFinal, ...cupThirdPlace);

    // Generate Plate Bracket (for Round of 16 losers)
    const plateRound1Matches = generatePlaceholderMatches('plate', 'plate-round-1', 8, roundOf16Matches, 'loser');
    const plateQuarterFinals = generatePlaceholderMatches('plate', 'plate-quarter-final', 4, plateRound1Matches);
    const plateSemiFinals = generatePlaceholderMatches('plate', 'plate-semi-final', 2, plateQuarterFinals);
    const plateFinal = generatePlaceholderMatches('plate', 'plate-final', 1, plateSemiFinals);
    const plateThirdPlace = generatePlaceholderMatches('plate', 'plate-third-place', 1, plateSemiFinals);

    tournament.matches.push(...plateRound1Matches, ...plateQuarterFinals, ...plateSemiFinals, ...plateFinal, ...plateThirdPlace);

    // Generate Shield Bracket (for Plate Quarter Final losers)
    const shieldSemiFinals = generatePlaceholderMatches('shield', 'shield-semi-final', 2, plateQuarterFinals, 'loser');
    const shieldFinal = generatePlaceholderMatches('shield', 'shield-final', 1, shieldSemiFinals);
    const shieldThirdPlace = generatePlaceholderMatches('shield', 'shield-third-place', 1, shieldSemiFinals);

    tournament.matches.push(...shieldSemiFinals, ...shieldFinal, ...shieldThirdPlace);

    // Generate Festival Matches (for bottom 3 from pools + Plate Round 1 losers)
    const festivalTeams: string[] = [];
    tournament.pools.forEach(pool => {
      tournamentUtils.getPoolNonQualifiers(pool.id).forEach(team => festivalTeams.push(team.id));
    });
    // Plate Round 1 losers will be added to festival dynamically as matches complete
    // For initial generation, we just need the pool non-qualifiers
    const festivalMatches = generateRoundRobinMatches(festivalTeams, 'festival'); // Simple round-robin for now
    tournament.matches.push(...festivalMatches);

    storageUtils.saveTournament(tournament);

    return {
      roundOf16: roundOf16Matches,
      quarterFinals: quarterFinalMatches,
      semiFinals: semiFinalMatches,
      final: cupFinal[0],
      thirdPlace: cupThirdPlace[0]
    };
  },

  // NEW: Update knockout matches based on parent match results
  updateKnockoutProgression: (completedMatchId: string): void => {
    const tournament = storageUtils.getTournament();
    const completedMatch = tournament.matches.find(m => m.id === completedMatchId);
    const result = storageUtils.getMatchResult(completedMatchId);

    if (!completedMatch || !result || !result.completed) {
      console.warn(`Attempted to update progression for incomplete or non-existent match: ${completedMatchId}`);
      return;
    }

    const winnerId = result.homeScore > result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;
    const loserId = result.homeScore < result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;

    // Find all matches that depend on this completed match
    const dependentMatches = tournament.matches.filter(m => 
      m.parentMatch1 === completedMatchId || m.parentMatch2 === completedMatchId
    );

    dependentMatches.forEach(dependentMatch => {
      let updated = false;
      // Determine if the dependent match is for winners or losers
      // This logic assumes a standard bracket progression (winner to next round, loser to consolation)
      // For Plate/Shield, the 'loser' of a Cup match becomes a 'winner' in the Plate/Shield path.

      // Update winner progression
      if (dependentMatch.stage === 'cup' && dependentMatch.round !== 'third-place') {
        if (dependentMatch.parentMatch1 === completedMatchId) {
          dependentMatch.homeTeamId = winnerId;
          updated = true;
        } else if (dependentMatch.parentMatch2 === completedMatchId) {
          dependentMatch.awayTeamId = winnerId;
          updated = true;
        }
      } 
      // Update loser progression (e.g., to Plate or Third Place)
      else if (dependentMatch.stage === 'plate' || dependentMatch.round === 'third-place' || dependentMatch.stage === 'shield') {
        // For Plate/Shield, the 'loser' of the parent match becomes a participant
        // For 3rd place, the 'loser' of the semi-final becomes a participant
        if (dependentMatch.parentMatch1 === completedMatchId) {
          dependentMatch.homeTeamId = loserId;
          updated = true;
        } else if (dependentMatch.parentMatch2 === completedMatchId) {
          dependentMatch.awayTeamId = loserId;
          updated = true;
        }
      }

      if (updated) {
        // If both parent matches are determined, set teams to actual IDs
        if (dependentMatch.homeTeamId !== 'TBD' && dependentMatch.awayTeamId !== 'TBD') {
          // No need to set completed to false, it's already false for new matches
        }
      }
    });

    storageUtils.saveTournament(tournament);
  },

  // Check if knockout brackets have been generated
  areKnockoutBracketsGenerated: (): boolean => {
    const tournament = storageUtils.getTournament();
    return tournament.matches.some(match => match.stage === 'cup' && match.round === 'round-of-16');
  },

  // Get Cup bracket matches
  getCupBracket: (): KnockoutBracket => {
    const tournament = storageUtils.getTournament();
    const cupMatches = tournament.matches.filter(match => match.stage === 'cup');

    return {
      roundOf16: cupMatches.filter(m => m.round === 'round-of-16').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      quarterFinals: cupMatches.filter(m => m.round === 'quarter-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      semiFinals: cupMatches.filter(m => m.round === 'semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      final: cupMatches.find(m => m.round === 'final')!,
      thirdPlace: cupMatches.find(m => m.round === 'third-place')!
    };
  },

  // Get Plate bracket matches
  getPlateBracket: (): PlateBracket => {
    const tournament = storageUtils.getTournament();
    const plateMatches = tournament.matches.filter(match => match.stage === 'plate');

    return {
      round1: plateMatches.filter(m => m.round === 'plate-round-1').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      quarterFinals: plateMatches.filter(m => m.round === 'plate-quarter-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      semiFinals: plateMatches.filter(m => m.round === 'plate-semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      final: plateMatches.find(m => m.round === 'plate-final')!,
      thirdPlace: plateMatches.find(m => m.round === 'plate-third-place')!
    };
  },

  // Get Shield bracket matches
  getShieldBracket: (): ShieldBracket => {
    const tournament = storageUtils.getTournament();
    const shieldMatches = tournament.matches.filter(match => match.stage === 'shield');

    return {
      semiFinals: shieldMatches.filter(m => m.round === 'shield-semi-final').sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      final: shieldMatches.find(m => m.round === 'shield-final')!,
      thirdPlace: shieldMatches.find(m => m.round === 'shield-third-place')!
    };
  },

  // Get Festival matches
  getFestivalMatches: (): Match[] => {
    const tournament = storageUtils.getTournament();
    return tournament.matches.filter(match => match.stage === 'festival');
  },

  // Get Cup bracket with team details
  getCupBracketWithTeams: (): KnockoutBracketWithTeams => {
    const bracket = tournamentUtils.getCupBracket();
    return mapBracketMatchesToTeams(bracket);
  },

  // Get Plate bracket with team details
  getPlateBracketWithTeams: (): PlateBracketWithTeams => {
    const bracket = tournamentUtils.getPlateBracket();
    return mapBracketMatchesToTeams(bracket);
  },

  // Get Shield bracket with team details
  getShieldBracketWithTeams: (): ShieldBracketWithTeams => {
    const bracket = tournamentUtils.getShieldBracket();
    return mapBracketMatchesToTeams(bracket);
  },

  // Get Festival matches with team details
  getFestivalMatchesWithTeams: (): MatchWithTeams[] => {
    const festivalMatches = tournamentUtils.getFestivalMatches();
    return festivalMatches.map(match => tournamentUtils.getMatchWithTeams(match));
  },

  // Get tournament bracket status
  getBracketStatus: (): BracketStatus => {
    return {
      poolStageComplete: tournamentUtils.isPoolStageComplete(),
      knockoutGenerated: tournamentUtils.areKnockoutBracketsGenerated(),
      cupBracket: tournamentUtils.areKnockoutBracketsGenerated() ? tournamentUtils.getCupBracketWithTeams() : null,
      plateBracket: tournamentUtils.areKnockoutBracketsGenerated() ? tournamentUtils.getPlateBracketWithTeams() : null,
      shieldBracket: tournamentUtils.areKnockoutBracketsGenerated() ? tournamentUtils.getShieldBracketWithTeams() : null,
      festivalMatches: tournamentUtils.areKnockoutBracketsGenerated() ? tournamentUtils.getFestivalMatchesWithTeams() : []
    };
  },

  // Clear all knockout and festival matches (for re-generation)
  clearKnockoutAndFestivalMatches: (): void => {
    const tournament = storageUtils.getTournament();
    tournament.matches = tournament.matches.filter(match => 
      !['cup', 'plate', 'shield', 'festival'].includes(match.stage)
    );
    storageUtils.saveTournament(tournament);
    // Also clear results for these stages
    const resultsKey = `${STORAGE_KEY}-results`; // Assuming STORAGE_KEY is accessible or passed
    const existingResults = storageUtils.getMatchResults();
    const filteredResults = existingResults.filter(result => {
      const match = tournament.matches.find(m => m.id === result.matchId);
      return match && match.stage === 'pool'; // Keep only pool results
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(resultsKey, JSON.stringify(filteredResults));
    }
  }
};

// Helper function to generate round-robin matches for a pool
function generateRoundRobinMatches(teamIds: string[], stageId: string): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const match: Match = {
        id: `${stageId}-${teamIds[i]}-${teamIds[j]}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        poolId: stageId === 'pool' ? stageId : undefined, // Only set poolId for pool stage matches
        stage: stageId === 'pool' ? 'pool' : 'festival', // Assume 'festival' for non-pool round-robin
        completed: false
      };
      matches.push(match);
    }
  }
  
  return matches;
}

// Helper function to generate placeholder matches for knockout rounds
// parentMatches: array of matches from the previous round
// winnerOrLoser: 'winner' or 'loser' to determine which team progresses
function generatePlaceholderMatches(
  stage: 'cup' | 'plate' | 'shield', 
  round: string, 
  count: number, 
  parentMatches: Match[],
  winnerOrLoser: 'winner' | 'loser' = 'winner'
): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < count; i++) {
    const parentMatch1 = parentMatches[i * 2];
    const parentMatch2 = parentMatches[i * 2 + 1];

    matches.push({
      id: `${stage}-${round}-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      homeTeamId: 'TBD', // To Be Determined
      awayTeamId: 'TBD',
      stage: stage,
      round,
      completed: false,
      bracketPosition: i + 1,
      parentMatch1: parentMatch1 ? parentMatch1.id : undefined,
      parentMatch2: parentMatch2 ? parentMatch2.id : undefined
    });
  }
  
  return matches;
}

// Helper to map bracket matches to include team details
function mapBracketMatchesToTeams<T extends KnockoutBracket | PlateBracket | ShieldBracket>(
  bracket: T
): T extends KnockoutBracket ? KnockoutBracketWithTeams : T extends PlateBracket ? PlateBracketWithTeams : ShieldBracketWithTeams {
  const teams = storageUtils.getTeams();
  const matchResults = storageUtils.getMatchResults();

  const getMatchWithDetails = (match: Match): MatchWithTeams | null => {
    if (!match) return null;
    
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    
    // If no teams assigned yet (placeholder match), return null unless we want to show TBD
    // For now, we'll return a partial MatchWithTeams if teams are TBD
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
      mappedBracket[key] = ((bracket as any)[key] as Match[]).map(match => getMatchWithDetails(match)).filter(Boolean);
    } else if ((bracket as any)[key]) {
      mappedBracket[key] = getMatchWithDetails((bracket as any)[key] as Match);
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
  round1: Match[]; // 8 matches for R16 losers
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match;
  thirdPlace: Match;
}

export interface ShieldBracket {
  semiFinals: Match[]; // 2 matches for Plate QF losers
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

// Assuming STORAGE_KEY is defined elsewhere or passed. For this context, let's define it here.
const STORAGE_KEY = 'water-polo-tournament'; // This should ideally come from storage.ts

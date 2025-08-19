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

    // Allocate teams to pools (distribute evenly)
    shuffledTeams.forEach((team, index) => {
      const poolIndex = index % pools.length;
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
      if (poolMatches.length === 0) return false; 
      return poolMatches.every(match => match.completed);
    }
    
    // Check all pools
    const pools = storageUtils.getTournament().pools.map(p => p.id);
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
    tournament.matches = tournament.matches.filter(match => match.stage !== 'pool');
    storageUtils.saveTournament(tournament);
    storageUtils.clearPoolMatchResults();
  },

  // Clear pool matches only
  clearPoolMatches: (): void => {
    const tournament = storageUtils.getTournament();
    tournament.matches = tournament.matches.filter(match => match.stage !== 'pool');
    storageUtils.saveTournament(tournament);
    storageUtils.clearPoolMatchResults();
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
  },

  // PHASE 2: Generate Cup Round of 16 bracket and all subsequent brackets
  generateCupBracket: (): KnockoutBracket => {
    if (!tournamentUtils.isPoolStageComplete()) {
      throw new Error('Pool stage must be completed before generating knockout bracket');
    }

    const tournament = storageUtils.getTournament();
    
    // Get qualifiers from each pool (top 4)
    const poolAQualifiers = tournamentUtils.getPoolQualifiers('A');
    const poolBQualifiers = tournamentUtils.getPoolQualifiers('B');
    const poolCQualifiers = tournamentUtils.getPoolQualifiers('C');
    const poolDQualifiers = tournamentUtils.getPoolQualifiers('D');

    // Clear existing knockout matches
    tournament.matches = tournament.matches.filter(match => 
      !['cup', 'plate', 'shield', 'festival'].includes(match.stage)
    );

    // PHASE 2.1: Generate Cup Round of 16 (A vs D, B vs C format)
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

    // PHASE 2.2: Generate Cup bracket structure (QF, SF, Final, 3rd Place)
    const quarterFinalMatches = generatePlaceholderMatches('cup', 'quarter-final', 4, roundOf16Matches);
    const semiFinalMatches = generatePlaceholderMatches('cup', 'semi-final', 2, quarterFinalMatches);
    const cupFinal = generatePlaceholderMatches('cup', 'final', 1, semiFinalMatches);
    const cupThirdPlace = generatePlaceholderMatches('cup', 'third-place', 1, semiFinalMatches, 'loser');

    // PHASE 2.3: Generate Plate Bracket (for Cup R16 losers)
    const plateRound1Matches = generatePlaceholderMatches('plate', 'plate-round-1', 8, roundOf16Matches, 'loser');
    const plateQuarterFinals = generatePlaceholderMatches('plate', 'plate-quarter-final', 4, plateRound1Matches);
    const plateSemiFinals = generatePlaceholderMatches('plate', 'plate-semi-final', 2, plateQuarterFinals);
    const plateFinal = generatePlaceholderMatches('plate', 'plate-final', 1, plateSemiFinals);
    const plateThirdPlace = generatePlaceholderMatches('plate', 'plate-third-place', 1, plateSemiFinals, 'loser');

    // PHASE 2.4: Generate Shield Bracket (for Plate QF losers)
    const shieldSemiFinals = generatePlaceholderMatches('shield', 'shield-semi-final', 2, plateQuarterFinals, 'loser');
    const shieldFinal = generatePlaceholderMatches('shield', 'shield-final', 1, shieldSemiFinals);
    const shieldThirdPlace = generatePlaceholderMatches('shield', 'shield-third-place', 1, shieldSemiFinals, 'loser');

    // PHASE 2.5: Generate Festival Matches (bottom 3 from each pool + early exits)
    const festivalTeams: string[] = [];
    tournament.pools.forEach(pool => {
      tournamentUtils.getPoolNonQualifiers(pool.id).forEach(team => festivalTeams.push(team.id));
    });
    
    // Generate round-robin festival matches for pool non-qualifiers
    const festivalMatches = generateRoundRobinMatches(festivalTeams, undefined, 'festival');

    // Add all matches to tournament
    tournament.matches.push(
      ...roundOf16Matches,
      ...quarterFinalMatches, 
      ...semiFinalMatches, 
      ...cupFinal, 
      ...cupThirdPlace,
      ...plateRound1Matches, 
      ...plateQuarterFinals, 
      ...plateSemiFinals, 
      ...plateFinal, 
      ...plateThirdPlace,
      ...shieldSemiFinals, 
      ...shieldFinal, 
      ...shieldThirdPlace,
      ...festivalMatches
    );

    storageUtils.saveTournament(tournament);

    return {
      roundOf16: roundOf16Matches,
      quarterFinals: quarterFinalMatches,
      semiFinals: semiFinalMatches,
      final: cupFinal[0],
      thirdPlace: cupThirdPlace[0]
    };
  },

  // PHASE 2.6: Auto-advance teams based on match results
  updateKnockoutProgression: (completedMatchId: string): void => {
    const tournament = storageUtils.getTournament();
    const completedMatch = tournament.matches.find(m => m.id === completedMatchId);
    const result = storageUtils.getMatchResult(completedMatchId);

    if (!completedMatch || !result || !result.completed) {
      return;
    }

    // Determine winner and loser
    const winnerId = result.homeScore > result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;
    const loserId = result.homeScore < result.awayScore ? completedMatch.homeTeamId : completedMatch.awayTeamId;

    // Find matches that depend on this completed match
    const dependentMatches = tournament.matches.filter(m => 
      m.parentMatch1 === completedMatchId || m.parentMatch2 === completedMatchId
    );

    dependentMatches.forEach(dependentMatch => {
      // Advance winner to next Cup round
      if (dependentMatch.stage === 'cup' && dependentMatch.round !== 'third-place') {
        if (dependentMatch.parentMatch1 === completedMatchId) {
          dependentMatch.homeTeamId = winnerId;
        } else if (dependentMatch.parentMatch2 === completedMatchId) {
          dependentMatch.awayTeamId = winnerId;
        }
      }
      // Advance loser to consolation brackets or third place
      else if (dependentMatch.stage === 'plate' || dependentMatch.stage === 'shield' || dependentMatch.round === 'third-place') {
        if (dependentMatch.parentMatch1 === completedMatchId) {
          dependentMatch.homeTeamId = loserId;
        } else if (dependentMatch.parentMatch2 === completedMatchId) {
          dependentMatch.awayTeamId = loserId;
        }
      }
    });

    // Auto-generate subsequent rounds for Plate and Shield when ready
    tournamentUtils.autoGenerateSubsequentRounds();

    storageUtils.saveTournament(tournament);
  },

  // PHASE 2: Auto-generate subsequent rounds when parent rounds are complete
  autoGenerateSubsequentRounds: (): void => {
    const tournament = storageUtils.getTournament();
    
    // Check if Cup Quarter Finals can be generated
    const r16Matches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'round-of-16');
    if (r16Matches.length > 0 && r16Matches.every(m => m.completed)) {
      tournamentUtils.generateCupQuarterFinals();
    }

    // Check if Cup Semi Finals can be generated
    const qfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'quarter-final');
    if (qfMatches.length > 0 && qfMatches.every(m => m.completed)) {
      tournamentUtils.generateCupSemiFinals();
    }

    // Check if Cup Final can be generated
    const sfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'semi-final');
    if (sfMatches.length > 0 && sfMatches.every(m => m.completed)) {
      tournamentUtils.generateCupFinals();
    }

    // Similar logic for Plate and Shield brackets
    tournamentUtils.autoGeneratePlateRounds();
    tournamentUtils.autoGenerateShieldRounds();
  },

  // Generate Cup Quarter Finals from R16 winners
  generateCupQuarterFinals: (): void => {
    const tournament = storageUtils.getTournament();
    const r16Matches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'round-of-16');
    const qfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'quarter-final');

    qfMatches.forEach((qfMatch, index) => {
      const parentMatch1 = r16Matches[index * 2];
      const parentMatch2 = r16Matches[index * 2 + 1];
      
      if (parentMatch1 && parentMatch2 && parentMatch1.completed && parentMatch2.completed) {
        const winner1 = tournamentUtils.getMatchWinner(parentMatch1.id);
        const winner2 = tournamentUtils.getMatchWinner(parentMatch2.id);
        
        if (winner1 && winner2) {
          qfMatch.homeTeamId = winner1;
          qfMatch.awayTeamId = winner2;
        }
      }
    });

    storageUtils.saveTournament(tournament);
  },

  // Generate Cup Semi Finals from QF winners
  generateCupSemiFinals: (): void => {
    const tournament = storageUtils.getTournament();
    const qfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'quarter-final');
    const sfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'semi-final');

    sfMatches.forEach((sfMatch, index) => {
      const parentMatch1 = qfMatches[index * 2];
      const parentMatch2 = qfMatches[index * 2 + 1];
      
      if (parentMatch1 && parentMatch2 && parentMatch1.completed && parentMatch2.completed) {
        const winner1 = tournamentUtils.getMatchWinner(parentMatch1.id);
        const winner2 = tournamentUtils.getMatchWinner(parentMatch2.id);
        
        if (winner1 && winner2) {
          sfMatch.homeTeamId = winner1;
          sfMatch.awayTeamId = winner2;
        }
      }
    });

    storageUtils.saveTournament(tournament);
  },

  // Generate Cup Final and 3rd Place from SF results
  generateCupFinals: (): void => {
    const tournament = storageUtils.getTournament();
    const sfMatches = tournament.matches.filter(m => m.stage === 'cup' && m.round === 'semi-final');
    const finalMatch = tournament.matches.find(m => m.stage === 'cup' && m.round === 'final');
    const thirdPlaceMatch = tournament.matches.find(m => m.stage === 'cup' && m.round === 'third-place');

    if (sfMatches.length === 2 && sfMatches.every(m => m.completed)) {
      const winner1 = tournamentUtils.getMatchWinner(sfMatches[0].id);
      const winner2 = tournamentUtils.getMatchWinner(sfMatches[1].id);
      const loser1 = tournamentUtils.getMatchLoser(sfMatches[0].id);
      const loser2 = tournamentUtils.getMatchLoser(sfMatches[1].id);

      if (finalMatch && winner1 && winner2) {
        finalMatch.homeTeamId = winner1;
        finalMatch.awayTeamId = winner2;
      }

      if (thirdPlaceMatch && loser1 && loser2) {
        thirdPlaceMatch.homeTeamId = loser1;
        thirdPlaceMatch.awayTeamId = loser2;
      }

      storageUtils.saveTournament(tournament);
    }
  },

  // Auto-generate Plate rounds
  autoGeneratePlateRounds: (): void => {
    const tournament = storageUtils.getTournament();
    
    // Generate Plate QF when Plate R1 is complete
    const plateR1 = tournament.matches.filter(m => m.stage === 'plate' && m.round === 'plate-round-1');
    const plateQF = tournament.matches.filter(m => m.stage === 'plate' && m.round === 'plate-quarter-final');
    
    if (plateR1.length > 0 && plateR1.every(m => m.completed) && plateQF.length > 0) {
      plateQF.forEach((qfMatch, index) => {
        const parentMatch1 = plateR1[index * 2];
        const parentMatch2 = plateR1[index * 2 + 1];
        
        if (parentMatch1 && parentMatch2) {
          const winner1 = tournamentUtils.getMatchWinner(parentMatch1.id);
          const winner2 = tournamentUtils.getMatchWinner(parentMatch2.id);
          
          if (winner1 && winner2) {
            qfMatch.homeTeamId = winner1;
            qfMatch.awayTeamId = winner2;
          }
        }
      });
    }

    // Similar logic for Plate SF and Finals
    const plateSF = tournament.matches.filter(m => m.stage === 'plate' && m.round === 'plate-semi-final');
    if (plateQF.length > 0 && plateQF.every(m => m.completed) && plateSF.length > 0) {
      plateSF.forEach((sfMatch, index) => {
        const parentMatch1 = plateQF[index * 2];
        const parentMatch2 = plateQF[index * 2 + 1];
        
        if (parentMatch1 && parentMatch2) {
          const winner1 = tournamentUtils.getMatchWinner(parentMatch1.id);
          const winner2 = tournamentUtils.getMatchWinner(parentMatch2.id);
          
          if (winner1 && winner2) {
            sfMatch.homeTeamId = winner1;
            sfMatch.awayTeamId = winner2;
          }
        }
      });
    }

    // Generate Plate Finals
    if (plateSF.length === 2 && plateSF.every(m => m.completed)) {
      const plateFinalMatch = tournament.matches.find(m => m.stage === 'plate' && m.round === 'plate-final');
      const plateThirdMatch = tournament.matches.find(m => m.stage === 'plate' && m.round === 'plate-third-place');

      if (plateFinalMatch) {
        const winner1 = tournamentUtils.getMatchWinner(plateSF[0].id);
        const winner2 = tournamentUtils.getMatchWinner(plateSF[1].id);
        if (winner1 && winner2) {
          plateFinalMatch.homeTeamId = winner1;
          plateFinalMatch.awayTeamId = winner2;
        }
      }

      if (plateThirdMatch) {
        const loser1 = tournamentUtils.getMatchLoser(plateSF[0].id);
        const loser2 = tournamentUtils.getMatchLoser(plateSF[1].id);
        if (loser1 && loser2) {
          plateThirdMatch.homeTeamId = loser1;
          plateThirdMatch.awayTeamId = loser2;
        }
      }
    }

    storageUtils.saveTournament(tournament);
  },

  // Auto-generate Shield rounds  
  autoGenerateShieldRounds: (): void => {
    const tournament = storageUtils.getTournament();
    
    // Generate Shield SF when Plate QF is complete
    const plateQF = tournament.matches.filter(m => m.stage === 'plate' && m.round === 'plate-quarter-final');
    const shieldSF = tournament.matches.filter(m => m.stage === 'shield' && m.round === 'shield-semi-final');
    
    if (plateQF.length > 0 && plateQF.every(m => m.completed) && shieldSF.length > 0) {
      shieldSF.forEach((sfMatch, index) => {
        const parentMatch1 = plateQF[index * 2];
        const parentMatch2 = plateQF[index * 2 + 1];
        
        if (parentMatch1 && parentMatch2) {
          const loser1 = tournamentUtils.getMatchLoser(parentMatch1.id);
          const loser2 = tournamentUtils.getMatchLoser(parentMatch2.id);
          
          if (loser1 && loser2) {
            sfMatch.homeTeamId = loser1;
            sfMatch.awayTeamId = loser2;
          }
        }
      });
    }

    // Generate Shield Finals
    if (shieldSF.length === 2 && shieldSF.every(m => m.completed)) {
      const shieldFinalMatch = tournament.matches.find(m => m.stage === 'shield' && m.round === 'shield-final');
      const shieldThirdMatch = tournament.matches.find(m => m.stage === 'shield' && m.round === 'shield-third-place');

      if (shieldFinalMatch) {
        const winner1 = tournamentUtils.getMatchWinner(shieldSF[0].id);
        const winner2 = tournamentUtils.getMatchWinner(shieldSF[1].id);
        if (winner1 && winner2) {
          shieldFinalMatch.homeTeamId = winner1;
          shieldFinalMatch.awayTeamId = winner2;
        }
      }

      if (shieldThirdMatch) {
        const loser1 = tournamentUtils.getMatchLoser(shieldSF[0].id);
        const loser2 = tournamentUtils.getMatchLoser(shieldSF[1].id);
        if (loser1 && loser2) {
          shieldThirdMatch.homeTeamId = loser1;
          shieldThirdMatch.awayTeamId = loser2;
        }
      }
    }

    storageUtils.saveTournament(tournament);
  },

  // Helper: Get match winner
  getMatchWinner: (matchId: string): string | null => {
    const result = storageUtils.getMatchResult(matchId);
    if (!result || !result.completed) return null;
    
    const match = storageUtils.getTournament().matches.find(m => m.id === matchId);
    if (!match) return null;

    return result.homeScore > result.awayScore ? match.homeTeamId : match.awayTeamId;
  },

  // Helper: Get match loser
  getMatchLoser: (matchId: string): string | null => {
    const result = storageUtils.getMatchResult(matchId);
    if (!result || !result.completed) return null;
    
    const match = storageUtils.getTournament().matches.find(m => m.id === matchId);
    if (!match) return null;

    return result.homeScore < result.awayScore ? match.homeTeamId : match.awayTeamId;
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

  // PHASE 2.7: Lock brackets once knockout stage starts
  areBracketsLocked: (): boolean => {
    const tournament = storageUtils.getTournament();
    const knockoutMatches = tournament.matches.filter(match => 
      ['cup', 'plate', 'shield'].includes(match.stage)
    );
    
    // Brackets are locked if any knockout match has been completed
    return knockoutMatches.some(match => match.completed);
  },

  // Clear all knockout and festival matches (for re-generation)
  clearKnockoutAndFestivalMatches: (): void => {
    const tournament = storageUtils.getTournament();
    const knockoutMatchIds = tournament.matches
      .filter(match => ['cup', 'plate', 'shield', 'festival'].includes(match.stage))
      .map(match => match.id);
    
    // Remove knockout matches
    tournament.matches = tournament.matches.filter(match => 
      !['cup', 'plate', 'shield', 'festival'].includes(match.stage)
    );
    
    storageUtils.saveTournament(tournament);
    
    // Clear results for knockout matches
    const existingResults = storageUtils.getMatchResults();
    const filteredResults = existingResults.filter(result => 
      !knockoutMatchIds.includes(result.matchId)
    );
    
    if (typeof window !== 'undefined') {
      const resultsKey = 'water-polo-tournament-results';
      localStorage.setItem(resultsKey, JSON.stringify(filteredResults));
    }
  },

  // PHASE 2: Enhanced Festival Match Generation
  generateAdditionalFestivalMatches: (): void => {
    const tournament = storageUtils.getTournament();
    
    // Get all teams that should be in festival
    const festivalTeamIds: string[] = [];
    
    // Add bottom 3 from each pool
    tournament.pools.forEach(pool => {
      const nonQualifiers = tournamentUtils.getPoolNonQualifiers(pool.id);
      nonQualifiers.forEach(team => festivalTeamIds.push(team.id));
    });
    
    // Add Plate Round 1 losers to festival
    const plateR1Matches = tournament.matches.filter(m => m.stage === 'plate' && m.round === 'plate-round-1');
    plateR1Matches.forEach(match => {
      if (match.completed) {
        const loserId = tournamentUtils.getMatchLoser(match.id);
        if (loserId && !festivalTeamIds.includes(loserId)) {
          festivalTeamIds.push(loserId);
        }
      }
    });

    // Clear existing festival matches
    tournament.matches = tournament.matches.filter(match => match.stage !== 'festival');
    
    // Generate new festival matches (round-robin style with limited games per team)
    const festivalMatches = generateLimitedFestivalMatches(festivalTeamIds);
    tournament.matches.push(...festivalMatches);
    
    storageUtils.saveTournament(tournament);
  },

  // Save completed match and auto-update progressions
  saveMatchResultWithProgression: (result: MatchResult): void => {
    // Save the match result first
    storageUtils.saveMatchResult(result);
    
    // Update the match completion status in tournament data
    const tournament = storageUtils.getTournament();
    const matchIndex = tournament.matches.findIndex(m => m.id === result.matchId);
    if (matchIndex !== -1) {
      tournament.matches[matchIndex].completed = result.completed;
      tournament.matches[matchIndex].homeScore = result.homeScore;
      tournament.matches[matchIndex].awayScore = result.awayScore;
    }
    
    storageUtils.saveTournament(tournament);

    // Auto-update knockout progressions if this was a knockout match
    if (result.completed) {
      tournamentUtils.updateKnockoutProgression(result.matchId);
    }
  }
};

// Helper function to generate round-robin matches for a pool
function generateRoundRobinMatches(teamIds: string[], poolId?: string, stage: 'pool' | 'festival' = 'pool'): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const match: Match = {
        id: `${stage}-${teamIds[i]}-${teamIds[j]}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        poolId: poolId,
        stage: stage,
        completed: false
      };
      matches.push(match);
    }
  }
  
  return matches;
}

// Helper function to generate limited festival matches (4-5 games per team max)
function generateLimitedFestivalMatches(teamIds: string[]): Match[] {
  const matches: Match[] = [];
  const teamMatchCounts: { [teamId: string]: number } = {};
  
  // Initialize match counts
  teamIds.forEach(teamId => {
    teamMatchCounts[teamId] = 0;
  });
  
  const maxMatchesPerTeam = 5;
  const shuffledPairs: string[][] = [];
  
  // Generate all possible pairs
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      shuffledPairs.push([teamIds[i], teamIds[j]]);
    }
  }
  
  // Shuffle pairs and select up to max matches per team
  shuffledPairs.sort(() => Math.random() - 0.5);
  
  for (const [team1, team2] of shuffledPairs) {
    if (teamMatchCounts[team1] < maxMatchesPerTeam && teamMatchCounts[team2] < maxMatchesPerTeam) {
      matches.push({
        id: `festival-${team1}-${team2}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        homeTeamId: team1,
        awayTeamId: team2,
        stage: 'festival',
        completed: false
      });
      
      teamMatchCounts[team1]++;
      teamMatchCounts[team2]++;
    }
  }
  
  return matches;
}

// Helper function to generate placeholder matches for knockout rounds
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
      homeTeamId: 'TBD',
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
    
    // Handle TBD teams for placeholder matches
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
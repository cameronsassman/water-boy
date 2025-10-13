import { Team, Tournament, Match, Pool } from '@/types/team';
import { MatchResult } from '@/types/match';
import { matchService, teamService } from '@/utils/storage';

export const tournamentLogic = {
  // Generate pool matches for all teams
  async generatePoolMatches(teams: Team[]): Promise<Match[]> {
    try {
      const pools: { [key: string]: Team[] } = {};
      
      // Group teams by pool
      teams.forEach(team => {
        if (team.poolAllocation) {
          if (!pools[team.poolAllocation]) {
            pools[team.poolAllocation] = [];
          }
          pools[team.poolAllocation].push(team);
        }
      });

      const matches: Match[] = [];
      let matchId = 1;

      // Generate round-robin matches for each pool
      Object.keys(pools).forEach(poolId => {
        const poolTeams = pools[poolId];
        
        for (let i = 0; i < poolTeams.length; i++) {
          for (let j = i + 1; j < poolTeams.length; j++) {
            const homeTeam = poolTeams[i];
            const awayTeam = poolTeams[j];
            
            // Create matches for different days
            for (let day = 1; day <= 3; day++) {
              const match: Match = {
                id: `match-${matchId++}`,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                poolId,
                stage: 'pool',
                day,
                timeSlot: day === 1 ? '09:00' : day === 2 ? '11:00' : '14:00',
                arena: 1,
                completed: false,
                homeTeam,
                awayTeam
              };
              
              matches.push(match);
            }
          }
        }
      });

      return matches;
    } catch (error) {
      console.error('Error generating pool matches:', error);
      return [];
    }
  },

  // Calculate standings for each pool
  calculateStandings(teams: Team[], matches: Match[]): { [poolId: string]: any[] } {
    const standings: { [poolId: string]: any[] } = {};

    // Initialize standings for each team
    teams.forEach(team => {
      if (team.poolAllocation) {
        if (!standings[team.poolAllocation]) {
          standings[team.poolAllocation] = [];
        }
        
        standings[team.poolAllocation].push({
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        });
      }
    });

    // Process matches to update standings
    matches.forEach(match => {
      if (!match.completed || !match.poolId) return;

      const poolStandings = standings[match.poolId];
      if (!poolStandings) return;

      const homeTeamStanding = poolStandings.find(s => s.team.id === match.homeTeamId);
      const awayTeamStanding = poolStandings.find(s => s.team.id === match.awayTeamId);

      if (!homeTeamStanding || !awayTeamStanding) return;

      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      // Update home team stats
      homeTeamStanding.played++;
      homeTeamStanding.goalsFor += homeScore;
      homeTeamStanding.goalsAgainst += awayScore;
      homeTeamStanding.goalDifference = homeTeamStanding.goalsFor - homeTeamStanding.goalsAgainst;

      // Update away team stats
      awayTeamStanding.played++;
      awayTeamStanding.goalsFor += awayScore;
      awayTeamStanding.goalsAgainst += homeScore;
      awayTeamStanding.goalDifference = awayTeamStanding.goalsFor - awayTeamStanding.goalsAgainst;

      // Update points based on result
      if (homeScore > awayScore) {
        homeTeamStanding.won++;
        awayTeamStanding.lost++;
        homeTeamStanding.points += 3;
      } else if (homeScore < awayScore) {
        homeTeamStanding.lost++;
        awayTeamStanding.won++;
        awayTeamStanding.points += 3;
      } else {
        homeTeamStanding.drawn++;
        awayTeamStanding.drawn++;
        homeTeamStanding.points += 1;
        awayTeamStanding.points += 1;
      }
    });

    // Sort standings by points, then goal difference, then goals for
    Object.keys(standings).forEach(poolId => {
      standings[poolId].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    });

    return standings;
  },

  // Get match results from API
  async getMatchResults(): Promise<MatchResult[]> {
    try {
      const matches = await matchService.getMatches();
      return matches.map(match => ({
        matchId: match.id,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        homeTeamStats: [],
        awayTeamStats: [],
        completed: match.completed
      }));
    } catch (error) {
      console.error('Error fetching match results:', error);
      return [];
    }
  },

  // Allocate teams to pools
  async allocatePools(teams: Team[]): Promise<Team[]> {
    try {
      // Filter out teams that already have pool allocation
      const unallocatedTeams = teams.filter(team => !team.poolAllocation);
      
      if (unallocatedTeams.length === 0) {
        return teams;
      }

      const poolNames = ['A', 'B', 'C', 'D'];
      const shuffledTeams = [...unallocatedTeams].sort(() => Math.random() - 0.5);
      
      const updatedTeams = teams.map(team => {
        // If team already has allocation, keep it
        if (team.poolAllocation) {
          return team;
        }
        
        // Find the team in shuffled array and assign pool
        const shuffledIndex = shuffledTeams.findIndex(t => t.id === team.id);
        if (shuffledIndex !== -1) {
          const poolId = poolNames[shuffledIndex % poolNames.length];
          return {
            ...team,
            poolId: poolId,
            poolAllocation: poolId
          };
        }
        
        return team;
      });

      return updatedTeams;
    } catch (error) {
      console.error('Error allocating pools:', error);
      return teams;
    }
  },

  // Generate knockout stage matches
  generateKnockoutMatches(standings: { [poolId: string]: any[] }, stage: string): Match[] {
    const matches: Match[] = [];
    const poolIds = Object.keys(standings);

    switch (stage) {
      case 'cup':
        // Quarter-finals: Top 2 from each pool
        const quarterFinalists: Team[] = [];
        poolIds.forEach(poolId => {
          const poolStandings = standings[poolId];
          if (poolStandings.length >= 2) {
            quarterFinalists.push(poolStandings[0].team); // 1st place
            quarterFinalists.push(poolStandings[1].team); // 2nd place
          }
        });

        // Generate quarter-final matches
        for (let i = 0; i < quarterFinalists.length; i += 2) {
          if (quarterFinalists[i + 1]) {
            matches.push({
              id: `cup-qf-${i/2 + 1}`,
              homeTeamId: quarterFinalists[i].id,
              awayTeamId: quarterFinalists[i + 1].id,
              stage: 'cup',
              day: 4,
              timeSlot: '09:00',
              arena: 1,
              completed: false,
              round: 'quarter-final',
              homeTeam: quarterFinalists[i],
              awayTeam: quarterFinalists[i + 1]
            });
          }
        }
        break;

      case 'plate':
        // Plate competition: 3rd and 4th placed teams
        const plateTeams: Team[] = [];
        poolIds.forEach(poolId => {
          const poolStandings = standings[poolId];
          if (poolStandings.length >= 4) {
            plateTeams.push(poolStandings[2].team); // 3rd place
            plateTeams.push(poolStandings[3].team); // 4th place
          }
        });

        // Generate plate quarter-final matches
        for (let i = 0; i < plateTeams.length; i += 2) {
          if (plateTeams[i + 1]) {
            matches.push({
              id: `plate-qf-${i/2 + 1}`,
              homeTeamId: plateTeams[i].id,
              awayTeamId: plateTeams[i + 1].id,
              stage: 'plate',
              day: 4,
              timeSlot: '11:00',
              arena: 1,
              completed: false,
              round: 'quarter-final',
              homeTeam: plateTeams[i],
              awayTeam: plateTeams[i + 1]
            });
          }
        }
        break;

      case 'shield':
        // Shield competition: 5th and 6th placed teams (if applicable)
        const shieldTeams: Team[] = [];
        poolIds.forEach(poolId => {
          const poolStandings = standings[poolId];
          if (poolStandings.length >= 6) {
            shieldTeams.push(poolStandings[4].team); // 5th place
            shieldTeams.push(poolStandings[5].team); // 6th place
          }
        });

        // Generate shield matches
        for (let i = 0; i < shieldTeams.length; i += 2) {
          if (shieldTeams[i + 1]) {
            matches.push({
              id: `shield-sf-${i/2 + 1}`,
              homeTeamId: shieldTeams[i].id,
              awayTeamId: shieldTeams[i + 1].id,
              stage: 'shield',
              day: 4,
              timeSlot: '14:00',
              arena: 1,
              completed: false,
              round: 'semi-final',
              homeTeam: shieldTeams[i],
              awayTeam: shieldTeams[i + 1]
            });
          }
        }
        break;
    }

    return matches;
  },

  // Generate festival matches (friendly matches for teams not in knockout stages)
  generateFestivalMatches(standings: { [poolId: string]: any[] }): Match[] {
    const matches: Match[] = [];
    const poolIds = Object.keys(standings);
    const festivalTeams: Team[] = [];

    // Collect teams that didn't qualify for main knockout stages
    poolIds.forEach(poolId => {
      const poolStandings = standings[poolId];
      // Assuming 6 teams per pool, take positions 5-6 for festival
      if (poolStandings.length >= 5) {
        festivalTeams.push(poolStandings[4].team); // 5th place
        if (poolStandings[5]) {
          festivalTeams.push(poolStandings[5].team); // 6th place
        }
      }
    });

    // Create festival matches
    for (let i = 0; i < festivalTeams.length; i += 2) {
      if (festivalTeams[i + 1]) {
        matches.push({
          id: `festival-${i/2 + 1}`,
          homeTeamId: festivalTeams[i].id,
          awayTeamId: festivalTeams[i + 1].id,
          stage: 'festival',
          day: 4,
          timeSlot: '16:00',
          arena: 1,
          completed: false,
          round: 'friendly',
          homeTeam: festivalTeams[i],
          awayTeam: festivalTeams[i + 1]
        });
      }
    }

    return matches;
  },

  // Validate tournament setup
  validateTournamentSetup(teams: Team[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (teams.length === 0) {
      errors.push('No teams registered for the tournament');
    }

    if (teams.length < 4) {
      errors.push('Minimum 4 teams required for tournament');
    }

    if (teams.length > 24) {
      errors.push('Maximum 24 teams allowed for tournament');
    }

    // Check if all teams have players
    const teamsWithoutPlayers = teams.filter(team => !team.players || team.players.length === 0);
    if (teamsWithoutPlayers.length > 0) {
      errors.push(`The following teams have no players: ${teamsWithoutPlayers.map(t => t.schoolName).join(', ')}`);
    }

    // Check if all teams have pool allocation
    const teamsWithoutPools = teams.filter(team => !team.poolAllocation);
    if (teamsWithoutPools.length > 0) {
      errors.push(`The following teams are not allocated to pools: ${teamsWithoutPools.map(t => t.schoolName).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get tournament progress statistics
  getTournamentProgress(matches: Match[]): {
    pool: { total: number; completed: number; pending: number; completionPercentage: number };
    knockout: { total: number; completed: number; pending: number; completionPercentage: number };
    overall: { total: number; completed: number; totalGoals: number };
  } {
    const poolMatches = matches.filter(m => m.stage === 'pool');
    const knockoutMatches = matches.filter(m => ['cup', 'plate', 'shield', 'festival'].includes(m.stage));
    
    const completedPoolMatches = poolMatches.filter(m => m.completed);
    const completedKnockoutMatches = knockoutMatches.filter(m => m.completed);

    const totalGoals = matches
      .filter(m => m.completed)
      .reduce((sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0), 0);

    return {
      pool: {
        total: poolMatches.length,
        completed: completedPoolMatches.length,
        pending: poolMatches.length - completedPoolMatches.length,
        completionPercentage: poolMatches.length > 0 ? Math.round((completedPoolMatches.length / poolMatches.length) * 100) : 0
      },
      knockout: {
        total: knockoutMatches.length,
        completed: completedKnockoutMatches.length,
        pending: knockoutMatches.length - completedKnockoutMatches.length,
        completionPercentage: knockoutMatches.length > 0 ? Math.round((completedKnockoutMatches.length / knockoutMatches.length) * 100) : 0
      },
      overall: {
        total: matches.length,
        completed: matches.filter(m => m.completed).length,
        totalGoals
      }
    };
  }
};

export default tournamentLogic;
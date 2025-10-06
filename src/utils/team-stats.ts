import { Team } from '@/types/team';
import { PlayerStats } from '@/types/player';
import { storageUtils } from '@/utils/storage';

export interface PlayerStatsSummary extends PlayerStats {
  playerName: string;
  teamName: string;
  teamId: string;
  matchesPlayed: number;
  averageGoalsPerMatch: number;
  totalCardsReceived: number;
}

export interface TeamStatsSummary {
  team: Team;
  totalMatches: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winPercentage: number;
  averageGoalsPerMatch: number;
  averageGoalsAgainst: number;
  players: PlayerStatsSummary[];
  topScorer?: PlayerStatsSummary;
  mostKickOuts?: PlayerStatsSummary;
  mostCards?: PlayerStatsSummary;
  matchHistory: TeamMatchHistory[];
}

export interface TeamMatchHistory {
  matchId: string;
  opponent: Team;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  result: 'win' | 'draw' | 'loss';
  stage: string;
  round?: string;
  date?: string;
  playerStats: PlayerStats[];
}

export interface GlobalLeaderboards {
  topScorers: PlayerStatsSummary[];
  mostKickOuts: PlayerStatsSummary[];
  mostYellowCards: PlayerStatsSummary[];
  mostRedCards: PlayerStatsSummary[];
  topTeams: TeamStatsSummary[];
  bestAttack: TeamStatsSummary[];
  bestDefense: TeamStatsSummary[];
}

export const teamStatsUtils = {
  // Get comprehensive stats for a specific team
  getTeamStats: (teamId: string): TeamStatsSummary | null => {
    const team = storageUtils.getTeamById(teamId);
    if (!team) return null;

    const tournament = storageUtils.getTournament();
    const allResults = storageUtils.getMatchResults();
    
    // Get all matches for this team
    const teamMatches = tournament.matches.filter(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );

    // Get completed matches with results
    const completedMatches = teamMatches.filter(match => {
      const result = allResults.find(r => r.matchId === match.id);
      return result && result.completed;
    });

    // Calculate team statistics
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const matchHistory: TeamMatchHistory[] = [];

    // Aggregate player stats across all matches
    const playerStatsMap: { [playerId: string]: PlayerStats & { matchesPlayed: number } } = {};
    
    // Initialize player stats
    team.players.forEach(player => {
      playerStatsMap[player.id] = {
        playerId: player.id,
        capNumber: player.capNumber,
        goals: 0,
        kickOuts: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0
      };
    });

    completedMatches.forEach(match => {
      const result = allResults.find(r => r.matchId === match.id)!;
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? result.homeScore : result.awayScore;
      const opponentScore = isHome ? result.awayScore : result.homeScore;
      const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
      const opponent = storageUtils.getTeamById(opponentId);
      
      // Update team totals
      goalsFor += teamScore;
      goalsAgainst += opponentScore;
      
      if (teamScore > opponentScore) wins++;
      else if (teamScore < opponentScore) losses++;
      else draws++;

      // Add to match history
      if (opponent) {
        matchHistory.push({
          matchId: match.id,
          opponent,
          isHome,
          teamScore,
          opponentScore,
          result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
          stage: match.stage,
          round: match.round,
          date: result.completedAt,
          playerStats: isHome ? result.homeTeamStats : result.awayTeamStats
        });
      }

      // Aggregate player stats from this match
      const teamPlayerStats = isHome ? result.homeTeamStats : result.awayTeamStats;
      teamPlayerStats.forEach(playerStat => {
        if (playerStatsMap[playerStat.playerId]) {
          playerStatsMap[playerStat.playerId].goals += playerStat.goals;
          playerStatsMap[playerStat.playerId].kickOuts += playerStat.kickOuts;
          playerStatsMap[playerStat.playerId].yellowCards += playerStat.yellowCards;
          playerStatsMap[playerStat.playerId].redCards += playerStat.redCards;
          playerStatsMap[playerStat.playerId].matchesPlayed++;
        }
      });
    });

    const goalDifference = goalsFor - goalsAgainst;
    const points = (wins * 3) + (draws * 1);
    const winPercentage = completedMatches.length > 0 ? (wins / completedMatches.length) * 100 : 0;

    // Convert player stats to summary format
    const playerSummaries: PlayerStatsSummary[] = team.players.map(player => {
      const stats = playerStatsMap[player.id];
      return {
        ...stats,
        playerName: player.name,
        teamName: team.schoolName,
        teamId: team.id,
        averageGoalsPerMatch: stats.matchesPlayed > 0 ? stats.goals / stats.matchesPlayed : 0,
        totalCardsReceived: stats.yellowCards + stats.redCards
      };
    });

    // Find top performers in team
    const topScorer = playerSummaries.reduce((top, player) => 
      player.goals > top.goals ? player : top, playerSummaries[0]);
    
    const mostKickOuts = playerSummaries.reduce((top, player) => 
      player.kickOuts > top.kickOuts ? player : top, playerSummaries[0]);
    
    const mostCards = playerSummaries.reduce((top, player) => 
      player.totalCardsReceived > top.totalCardsReceived ? player : top, playerSummaries[0]);

    return {
      team,
      totalMatches: teamMatches.length,
      matchesPlayed: completedMatches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      winPercentage,
      averageGoalsPerMatch: completedMatches.length > 0 ? goalsFor / completedMatches.length : 0,
      averageGoalsAgainst: completedMatches.length > 0 ? goalsAgainst / completedMatches.length : 0,
      players: playerSummaries,
      topScorer: topScorer.goals > 0 ? topScorer : undefined,
      mostKickOuts: mostKickOuts.kickOuts > 0 ? mostKickOuts : undefined,
      mostCards: mostCards.totalCardsReceived > 0 ? mostCards : undefined,
      matchHistory: matchHistory.sort((a, b) => 
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
      )
    };
  },

  // Get stats for a specific player across all matches
  getPlayerStats: (playerId: string): PlayerStatsSummary | null => {
    const allResults = storageUtils.getMatchResults();
    const teams = storageUtils.getTeams();
    
    // Find the player and their team
    let playerTeam: Team | null = null;
    let player: { id: string; name: string; capNumber: number } | null = null;
    
    for (const team of teams) {
      const foundPlayer = team.players.find(p => p.id === playerId);
      if (foundPlayer) {
        player = foundPlayer;
        playerTeam = team;
        break;
      }
    }
    
    if (!player || !playerTeam) return null;

    // Aggregate stats across all matches
    const totalStats: PlayerStats = {
      playerId: player.id,
      capNumber: player.capNumber,
      goals: 0,
      kickOuts: 0,
      yellowCards: 0,
      redCards: 0
    };
    
    let matchesPlayed = 0;

    allResults.forEach(result => {
      if (result.completed) {
        // Check if player participated in this match
        const homeStats = result.homeTeamStats.find(s => s.playerId === playerId);
        const awayStats = result.awayTeamStats.find(s => s.playerId === playerId);
        const playerMatchStats = homeStats || awayStats;
        
        if (playerMatchStats) {
          totalStats.goals += playerMatchStats.goals;
          totalStats.kickOuts += playerMatchStats.kickOuts;
          totalStats.yellowCards += playerMatchStats.yellowCards;
          totalStats.redCards += playerMatchStats.redCards;
          matchesPlayed++;
        }
      }
    });

    return {
      ...totalStats,
      playerName: player.name,
      teamName: playerTeam.schoolName,
      teamId: playerTeam.id,
      matchesPlayed,
      averageGoalsPerMatch: matchesPlayed > 0 ? totalStats.goals / matchesPlayed : 0,
      totalCardsReceived: totalStats.yellowCards + totalStats.redCards
    };
  },

  // Get global leaderboards across all teams
  getGlobalLeaderboards: (limit: number = 10): GlobalLeaderboards => {
    const teams = storageUtils.getTeams();
    const allPlayerStats: PlayerStatsSummary[] = [];
    const teamSummaries: TeamStatsSummary[] = [];

    // Collect all player stats
    teams.forEach(team => {
      team.players.forEach(player => {
        const playerStats = teamStatsUtils.getPlayerStats(player.id);
        if (playerStats) {
          allPlayerStats.push(playerStats);
        }
      });

      // Get team stats
      const teamStats = teamStatsUtils.getTeamStats(team.id);
      if (teamStats) {
        teamSummaries.push(teamStats);
      }
    });

    return {
      topScorers: allPlayerStats
        .filter(p => p.goals > 0)
        .sort((a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          return b.averageGoalsPerMatch - a.averageGoalsPerMatch;
        })
        .slice(0, limit),
      
      mostKickOuts: allPlayerStats
        .filter(p => p.kickOuts > 0)
        .sort((a, b) => b.kickOuts - a.kickOuts)
        .slice(0, limit),
      
      mostYellowCards: allPlayerStats
        .filter(p => p.yellowCards > 0)
        .sort((a, b) => b.yellowCards - a.yellowCards)
        .slice(0, limit),
      
      mostRedCards: allPlayerStats
        .filter(p => p.redCards > 0)
        .sort((a, b) => b.redCards - a.redCards)
        .slice(0, limit),
      
      topTeams: teamSummaries
        .filter(t => t.matchesPlayed > 0)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        })
        .slice(0, limit),
      
      bestAttack: teamSummaries
        .filter(t => t.matchesPlayed > 0)
        .sort((a, b) => b.averageGoalsPerMatch - a.averageGoalsPerMatch)
        .slice(0, limit),
      
      bestDefense: teamSummaries
        .filter(t => t.matchesPlayed > 0)
        .sort((a, b) => a.averageGoalsAgainst - b.averageGoalsAgainst)
        .slice(0, limit)
    };
  },

  // Get player stats for a specific match
  getPlayerStatsForMatch: (playerId: string, matchId: string): PlayerStats | null => {
    const result = storageUtils.getMatchResult(matchId);
    if (!result || !result.completed) return null;

    // Check both home and away team stats
    const homePlayerStats = result.homeTeamStats.find(s => s.playerId === playerId);
    const awayPlayerStats = result.awayTeamStats.find(s => s.playerId === playerId);
    
    return homePlayerStats || awayPlayerStats || null;
  },

  // Get team performance trends
  getTeamPerformanceTrend: (teamId: string): TeamPerformanceTrend => {
    const teamStats = teamStatsUtils.getTeamStats(teamId);
    if (!teamStats) {
      return {
        form: [],
        goalTrend: [],
        isImproving: false,
        consistency: 0
      };
    }

    // Get last 5 matches for form
    const recentMatches = teamStats.matchHistory.slice(0, 5);
    const form = recentMatches.map(match => match.result);
    
    // Calculate goal trends
    const goalTrend = teamStats.matchHistory.map((match, index) => ({
      matchNumber: teamStats.matchHistory.length - index,
      goalsScored: match.teamScore,
      goalsConceded: match.opponentScore,
      goalDifference: match.teamScore - match.opponentScore
    })).reverse();

    // Calculate if team is improving (based on last 3 vs previous 3 matches)
    let isImproving = false;
    if (teamStats.matchHistory.length >= 6) {
      const recent3 = teamStats.matchHistory.slice(0, 3);
      const previous3 = teamStats.matchHistory.slice(3, 6);
      
      const recentPoints = recent3.reduce((sum, match) => {
        return sum + (match.result === 'win' ? 3 : match.result === 'draw' ? 1 : 0);
      }, 0);
      
      const previousPoints = previous3.reduce((sum, match) => {
        return sum + (match.result === 'win' ? 3 : match.result === 'draw' ? 1 : 0);
      }, 0);
      
      isImproving = recentPoints > previousPoints;
    }

    // Calculate consistency (standard deviation of goals scored)
    const goalVariance = teamStats.matchHistory.length > 1 ? 
      calculateVariance(teamStats.matchHistory.map(m => m.teamScore)) : 0;
    const consistency = Math.max(0, 100 - (goalVariance * 10)); // Convert to 0-100 scale

    return {
      form,
      goalTrend,
      isImproving,
      consistency: Math.round(consistency)
    };
  },

  // Get head-to-head record between two teams
  getHeadToHeadRecord: (team1Id: string, team2Id: string): HeadToHeadRecord => {
    const tournament = storageUtils.getTournament();
    const allResults = storageUtils.getMatchResults();
    
    const h2hMatches = tournament.matches.filter(match => 
      (match.homeTeamId === team1Id && match.awayTeamId === team2Id) ||
      (match.homeTeamId === team2Id && match.awayTeamId === team1Id)
    );

    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let team1Goals = 0;
    let team2Goals = 0;
    const matchResults: Array<{
      matchId: string;
      team1Score: number;
      team2Score: number;
      stage: string;
      round?: string;
      date?: string;
    }> = [];

    h2hMatches.forEach(match => {
      const result = allResults.find(r => r.matchId === match.id);
      if (result && result.completed) {
        const team1IsHome = match.homeTeamId === team1Id;
        const team1Score = team1IsHome ? result.homeScore : result.awayScore;
        const team2Score = team1IsHome ? result.awayScore : result.homeScore;
        
        team1Goals += team1Score;
        team2Goals += team2Score;
        
        if (team1Score > team2Score) team1Wins++;
        else if (team2Score > team1Score) team2Wins++;
        else draws++;
        
        matchResults.push({
          matchId: match.id,
          team1Score,
          team2Score,
          stage: match.stage,
          round: match.round,
          date: result.completedAt
        });
      }
    });

    const team1 = storageUtils.getTeamById(team1Id);
    const team2 = storageUtils.getTeamById(team2Id);

    return {
      team1: team1!,
      team2: team2!,
      matchesPlayed: matchResults.length,
      team1Wins,
      team2Wins,
      draws,
      team1Goals,
      team2Goals,
      matchResults: matchResults.sort((a, b) => 
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
      )
    };
  },

  // Get player rankings within a team
  getTeamPlayerRankings: (teamId: string): TeamPlayerRankings => {
    const teamStats = teamStatsUtils.getTeamStats(teamId);
    if (!teamStats) {
      return {
        topScorers: [],
        mostKickOuts: [],
        mostCards: [],
        mostActive: []
      };
    }

    const activePlayers = teamStats.players.filter(p => p.matchesPlayed > 0);

    return {
      topScorers: [...activePlayers]
        .sort((a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          return b.averageGoalsPerMatch - a.averageGoalsPerMatch;
        })
        .slice(0, 5),
      
      mostKickOuts: [...activePlayers]
        .sort((a, b) => b.kickOuts - a.kickOuts)
        .slice(0, 5),
      
      mostCards: [...activePlayers]
        .sort((a, b) => b.totalCardsReceived - a.totalCardsReceived)
        .slice(0, 5),
      
      mostActive: [...activePlayers]
        .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
        .slice(0, 10)
    };
  },

  // Compare two teams
  compareTeams: (team1Id: string, team2Id: string): TeamComparison => {
    const team1Stats = teamStatsUtils.getTeamStats(team1Id);
    const team2Stats = teamStatsUtils.getTeamStats(team2Id);
    const h2hRecord = teamStatsUtils.getHeadToHeadRecord(team1Id, team2Id);

    if (!team1Stats || !team2Stats) {
      throw new Error('One or both teams not found');
    }

    return {
      team1: team1Stats,
      team2: team2Stats,
      headToHead: h2hRecord,
      comparison: {
        betterAttack: team1Stats.averageGoalsPerMatch > team2Stats.averageGoalsPerMatch ? team1Stats.team : team2Stats.team,
        betterDefense: team1Stats.averageGoalsAgainst < team2Stats.averageGoalsAgainst ? team1Stats.team : team2Stats.team,
        betterForm: team1Stats.winPercentage > team2Stats.winPercentage ? team1Stats.team : team2Stats.team,
        moreExperienced: team1Stats.matchesPlayed > team2Stats.matchesPlayed ? team1Stats.team : team2Stats.team
      }
    };
  }
};

// Helper function to calculate variance
function calculateVariance(numbers: number[]): number {
  if (numbers.length <= 1) return 0;
  
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  
  return Math.sqrt(variance); // Return standard deviation
}

// Additional type definitions for Phase 3
export interface TeamPerformanceTrend {
  form: ('win' | 'draw' | 'loss')[];
  goalTrend: {
    matchNumber: number;
    goalsScored: number;
    goalsConceded: number;
    goalDifference: number;
  }[];
  isImproving: boolean;
  consistency: number; // 0-100 scale
}

export interface HeadToHeadRecord {
  team1: Team;
  team2: Team;
  matchesPlayed: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  team1Goals: number;
  team2Goals: number;
  matchResults: {
    matchId: string;
    team1Score: number;
    team2Score: number;
    stage: string;
    round?: string;
    date?: string;
  }[];
}

export interface TeamPlayerRankings {
  topScorers: PlayerStatsSummary[];
  mostKickOuts: PlayerStatsSummary[];
  mostCards: PlayerStatsSummary[];
  mostActive: PlayerStatsSummary[];
}

export interface TeamComparison {
  team1: TeamStatsSummary;
  team2: TeamStatsSummary;
  headToHead: HeadToHeadRecord;
  comparison: {
    betterAttack: Team;
    betterDefense: Team;
    betterForm: Team;
    moreExperienced: Team;
  };
}
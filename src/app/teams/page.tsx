"use client";

import { useState, useEffect } from 'react';
import { storageUtils } from '@/utils/storage';
import { tournamentUtils, MatchWithTeams, TeamStanding } from '@/utils/tournament-logic';
import { Team } from '@/types/team';
import { PlayerStats } from '@/types/player';
import { MatchResult } from '@/types/match';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Trophy, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  ArrowLeft,
  Calendar,
  BarChart3,
  Award,
  Shield,
  Crown,
  User,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';

interface TeamStats {
  team: Team;
  standing: TeamStanding;
  matches: MatchWithTeams[];
  playerStats: { [playerId: string]: AggregatedPlayerStats };
}

interface AggregatedPlayerStats {
  playerId: string;
  name: string;
  capNumber: number;
  matchesPlayed: number;
  totalGoals: number;
  totalKickOuts: number;
  totalYellowCards: number;
  totalRedCards: number;
  goalsPerMatch: number;
  disciplinaryPoints: number; // Yellow = 1, Red = 3
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'goals' | 'played'>('name');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = () => {
    const allTeams = storageUtils.getTeams();
    setTeams(allTeams);
  };

  const loadTeamStats = async (team: Team) => {
    setLoading(true);
    
    try {
      // Get team standing
      const standing = team.poolId ? tournamentUtils.getPoolStandings(team.poolId).find(s => s.team.id === team.id) : null;
      
      // Get all matches for this team
      const allMatches = storageUtils.getTournament().matches;
      const teamMatches = allMatches
        .filter(match => match.homeTeamId === team.id || match.awayTeamId === team.id)
        .map(match => tournamentUtils.getMatchWithTeams(match));

      // Calculate aggregated player stats
      const playerStats: { [playerId: string]: AggregatedPlayerStats } = {};
      
      team.players.forEach(player => {
        playerStats[player.id] = {
          playerId: player.id,
          name: player.name,
          capNumber: player.capNumber,
          matchesPlayed: 0,
          totalGoals: 0,
          totalKickOuts: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          goalsPerMatch: 0,
          disciplinaryPoints: 0
        };
      });

      // Aggregate stats from all completed matches
      teamMatches.forEach(match => {
        if (match.completed) {
          const matchResult = storageUtils.getMatchResult(match.id);
          if (matchResult) {
            const isHome = match.homeTeam.id === team.id;
            const teamMatchStats = isHome ? matchResult.homeTeamStats : matchResult.awayTeamStats;
            
            teamMatchStats.forEach(stat => {
              if (playerStats[stat.playerId]) {
                const player = playerStats[stat.playerId];
                player.matchesPlayed += 1;
                player.totalGoals += stat.goals;
                player.totalKickOuts += stat.kickOuts;
                player.totalYellowCards += stat.yellowCards;
                player.totalRedCards += stat.redCards;
                player.disciplinaryPoints += (stat.yellowCards * 1) + (stat.redCards * 3);
                player.goalsPerMatch = player.matchesPlayed > 0 ? player.totalGoals / player.matchesPlayed : 0;
              }
            });
          }
        }
      });

      setTeamStats({
        team,
        standing: standing || {
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        },
        matches: teamMatches,
        playerStats
      });
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.coachName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPool = filterPool === 'all' || team.poolId === filterPool;
    return matchesSearch && matchesPool;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.schoolName.localeCompare(b.schoolName);
      case 'points':
        const aStanding = a.poolId ? tournamentUtils.getPoolStandings(a.poolId).find(s => s.team.id === a.id) : null;
        const bStanding = b.poolId ? tournamentUtils.getPoolStandings(b.poolId).find(s => s.team.id === b.id) : null;
        return (bStanding?.points || 0) - (aStanding?.points || 0);
      case 'goals':
        const aGoals = a.poolId ? tournamentUtils.getPoolStandings(a.poolId).find(s => s.team.id === a.id)?.goalsFor || 0 : 0;
        const bGoals = b.poolId ? tournamentUtils.getPoolStandings(b.poolId).find(s => s.team.id === b.id)?.goalsFor || 0 : 0;
        return bGoals - aGoals;
      case 'played':
        const aPlayed = a.poolId ? tournamentUtils.getPoolStandings(a.poolId).find(s => s.team.id === a.id)?.played || 0 : 0;
        const bPlayed = b.poolId ? tournamentUtils.getPoolStandings(b.poolId).find(s => s.team.id === b.id)?.played || 0 : 0;
        return bPlayed - aPlayed;
      default:
        return 0;
    }
  });

  // If viewing a specific team
  if (selectedTeam && teamStats) {
    const topScorers = Object.values(teamStats.playerStats)
      .filter(p => p.totalGoals > 0)
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 5);

    const mostDisciplined = Object.values(teamStats.playerStats)
      .filter(p => p.matchesPlayed > 0)
      .sort((a, b) => a.disciplinaryPoints - b.disciplinaryPoints)
      .slice(0, 5);

    const completedMatches = teamStats.matches.filter(m => m.completed);
    const upcomingMatches = teamStats.matches.filter(m => !m.completed);

    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setSelectedTeam(null)}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Teams
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users className="text-blue-600" />
                  {teamStats.team.schoolName}
                </h1>
                <p className="text-gray-600 mt-1">
                  Coach: {teamStats.team.coachName} • Manager: {teamStats.team.managerName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {teamStats.team.poolId && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Pool {teamStats.team.poolId}
                </Badge>
              )}
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {teamStats.team.players.length} Players
              </Badge>
            </div>
          </div>
        </div>

        {/* Team Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{teamStats.standing.points}</div>
              <div className="text-sm text-gray-600">Points</div>
              <div className="text-xs text-gray-500">{teamStats.standing.won}W-{teamStats.standing.drawn}D-{teamStats.standing.lost}L</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{teamStats.standing.goalsFor}</div>
              <div className="text-sm text-gray-600">Goals For</div>
              <div className="text-xs text-gray-500">{(teamStats.standing.goalsFor / Math.max(1, teamStats.standing.played)).toFixed(1)} avg/match</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{teamStats.standing.goalsAgainst}</div>
              <div className="text-sm text-gray-600">Goals Against</div>
              <div className="text-xs text-gray-500">{(teamStats.standing.goalsAgainst / Math.max(1, teamStats.standing.played)).toFixed(1)} avg/match</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className={`text-2xl font-bold ${teamStats.standing.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {teamStats.standing.goalDifference > 0 ? '+' : ''}{teamStats.standing.goalDifference}
              </div>
              <div className="text-sm text-gray-600">Goal Difference</div>
              <div className="text-xs text-gray-500">{teamStats.standing.played} matches played</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="players">Player Stats</TabsTrigger>
            <TabsTrigger value="matches">Match History</TabsTrigger>
            <TabsTrigger value="highlights">Team Highlights</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          {/* Player Stats Tab */}
          <TabsContent value="players" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Player Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-sm text-gray-600">Player</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">MP</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">Goals</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">G/Match</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">Kick-outs</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">Yellow</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">Red</th>
                        <th className="text-center p-3 font-medium text-sm text-gray-600">Discipline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(teamStats.playerStats)
                        .sort((a, b) => b.totalGoals - a.totalGoals)
                        .map(player => (
                        <tr key={player.playerId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs">
                                {player.capNumber}
                              </Badge>
                              <span className="font-medium">{player.name}</span>
                            </div>
                          </td>
                          <td className="text-center p-3">{player.matchesPlayed}</td>
                          <td className="text-center p-3">
                            <span className="font-semibold text-blue-600">{player.totalGoals}</span>
                          </td>
                          <td className="text-center p-3">
                            <span className="text-sm">{player.goalsPerMatch.toFixed(1)}</span>
                          </td>
                          <td className="text-center p-3">{player.totalKickOuts}</td>
                          <td className="text-center p-3">
                            <span className={player.totalYellowCards > 0 ? 'text-yellow-600 font-medium' : ''}>
                              {player.totalYellowCards}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className={player.totalRedCards > 0 ? 'text-red-600 font-medium' : ''}>
                              {player.totalRedCards}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className={`text-sm ${
                              player.disciplinaryPoints === 0 ? 'text-green-600' :
                              player.disciplinaryPoints <= 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {player.disciplinaryPoints === 0 ? 'Clean' : player.disciplinaryPoints}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="matches" className="mt-6">
            <div className="space-y-4">
              {completedMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Match Results ({completedMatches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {completedMatches.map(match => {
                      const isHome = match.homeTeam.id === teamStats.team.id;
                      const teamScore = isHome ? match.homeScore : match.awayScore;
                      const opponentScore = isHome ? match.awayScore : match.homeScore;
                      const opponent = isHome ? match.awayTeam : match.homeTeam;
                      const won = teamScore !== undefined && opponentScore !== undefined && teamScore > opponentScore;
                      const lost = teamScore !== undefined && opponentScore !== undefined && teamScore < opponentScore;
                      const drawn = teamScore !== undefined && opponentScore !== undefined && teamScore === opponentScore;
                      
                      return (
                        <div key={match.id} className={`
                          p-4 rounded-lg border
                          ${won ? 'bg-green-50 border-green-200' : 
                            lost ? 'bg-red-50 border-red-200' : 
                            'bg-yellow-50 border-yellow-200'}
                        `}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="text-xs">
                                {match.stage === 'pool' ? `Pool ${match.poolId}` : 
                                 match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                                 match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                              </Badge>
                              
                              <div className="text-sm">
                                <span className="font-medium">vs {opponent.schoolName}</span>
                                <span className="text-gray-500 ml-2">({isHome ? 'Home' : 'Away'})</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className={`
                                font-bold text-lg
                                ${won ? 'text-green-600' : lost ? 'text-red-600' : 'text-blue-600'}
                              `}>
                                {teamScore} - {opponentScore}
                              </div>
                              
                              <Badge className={`
                                ${won ? 'bg-green-100 text-green-800' : 
                                  lost ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}
                              `}>
                                {won ? 'WIN' : lost ? 'LOSS' : 'DRAW'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {upcomingMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Upcoming Matches ({upcomingMatches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingMatches.map(match => {
                      const isHome = match.homeTeam.id === teamStats.team.id;
                      const opponent = isHome ? match.awayTeam : match.homeTeam;
                      const isPlaceholder = opponent.id === 'TBD';
                      
                      return (
                        <div key={match.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="text-xs">
                                {match.stage === 'pool' ? `Pool ${match.poolId}` : 
                                 match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                                 match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                              </Badge>
                              
                              <div className="text-sm">
                                <span className="font-medium">
                                  vs {isPlaceholder ? 'TBD' : opponent.schoolName}
                                </span>
                                <span className="text-gray-500 ml-2">({isHome ? 'Home' : 'Away'})</span>
                              </div>
                            </div>
                            
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {isPlaceholder ? 'Awaiting Opponent' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Team Highlights Tab */}
          <TabsContent value="highlights" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Scorers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topScorers.length > 0 ? (
                    <div className="space-y-3">
                      {topScorers.map((player, index) => (
                        <div key={player.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                              ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}
                            `}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">Cap #{player.capNumber}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{player.totalGoals}</div>
                            <div className="text-xs text-gray-500">{player.goalsPerMatch.toFixed(1)}/match</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No goals scored yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Most Disciplined */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Fair Play Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mostDisciplined.length > 0 ? (
                    <div className="space-y-3">
                      {mostDisciplined.map((player, index) => (
                        <div key={player.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">Cap #{player.capNumber}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${
                              player.disciplinaryPoints === 0 ? 'text-green-600' : 
                              player.disciplinaryPoints <= 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {player.disciplinaryPoints === 0 ? 'Clean' : player.disciplinaryPoints}
                            </div>
                            <div className="text-xs text-gray-500">
                              {player.totalYellowCards}Y {player.totalRedCards}R
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No match data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="matches" className="mt-6">
            <div className="space-y-6">
              {/* Recent Form */}
              {completedMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Recent Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      {completedMatches.slice(-5).map(match => {
                        const isHome = match.homeTeam.id === teamStats.team.id;
                        const teamScore = isHome ? match.homeScore : match.awayScore;
                        const opponentScore = isHome ? match.awayScore : match.homeScore;
                        const won = teamScore !== undefined && opponentScore !== undefined && teamScore > opponentScore;
                        const lost = teamScore !== undefined && opponentScore !== undefined && teamScore < opponentScore;
                        
                        return (
                          <div key={match.id} className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs
                            ${won ? 'bg-green-500' : lost ? 'bg-red-500' : 'bg-yellow-500'}
                          `}>
                            {won ? 'W' : lost ? 'L' : 'D'}
                          </div>
                        );
                      })}
                      <span className="text-sm text-gray-500 ml-2">
                        (Last {Math.min(5, completedMatches.length)} matches)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Match History */}
              {completedMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      All Match Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {completedMatches.reverse().map(match => {
                        const isHome = match.homeTeam.id === teamStats.team.id;
                        const teamScore = isHome ? match.homeScore : match.awayScore;
                        const opponentScore = isHome ? match.awayScore : match.homeScore;
                        const opponent = isHome ? match.awayTeam : match.homeTeam;
                        const won = teamScore !== undefined && opponentScore !== undefined && teamScore > opponentScore;
                        const lost = teamScore !== undefined && opponentScore !== undefined && teamScore < opponentScore;
                        
                        return (
                          <div key={match.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-xs">
                                  {match.stage === 'pool' ? `Pool ${match.poolId}` : 
                                   match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                                   match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                                </Badge>
                                
                                <div>
                                  <div className="font-medium">vs {opponent.schoolName}</div>
                                  <div className="text-xs text-gray-500">{isHome ? 'Home' : 'Away'}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className={`
                                  font-bold text-lg
                                  ${won ? 'text-green-600' : lost ? 'text-red-600' : 'text-blue-600'}
                                `}>
                                  {teamScore} - {opponentScore}
                                </div>
                                
                                <Badge className={`
                                  ${won ? 'bg-green-100 text-green-800' : 
                                    lost ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'}
                                `}>
                                  {won ? 'WIN' : lost ? 'LOSS' : 'DRAW'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {upcomingMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Upcoming Matches ({upcomingMatches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingMatches.map(match => {
                      const isHome = match.homeTeam.id === teamStats.team.id;
                      const opponent = isHome ? match.awayTeam : match.homeTeam;
                      const isPlaceholder = opponent.id === 'TBD';
                      
                      return (
                        <div key={match.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="text-xs">
                                {match.stage === 'pool' ? `Pool ${match.poolId}` : 
                                 match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                                 match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                              </Badge>
                              
                              <div>
                                <div className="font-medium">
                                  vs {isPlaceholder ? 'TBD' : opponent.schoolName}
                                </div>
                                <div className="text-xs text-gray-500">{isHome ? 'Home' : 'Away'}</div>
                              </div>
                            </div>
                            
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {isPlaceholder ? 'Awaiting Opponent' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Team Highlights Tab */}
          <TabsContent value="highlights" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Win Rate</span>
                    <span className="font-bold text-green-600">
                      {teamStats.standing.played > 0 ? 
                        Math.round((teamStats.standing.won / teamStats.standing.played) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Goals Per Match</span>
                    <span className="font-bold text-blue-600">
                      {(teamStats.standing.goalsFor / Math.max(1, teamStats.standing.played)).toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conceded Per Match</span>
                    <span className="font-bold text-orange-600">
                      {(teamStats.standing.goalsAgainst / Math.max(1, teamStats.standing.played)).toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clean Sheets</span>
                    <span className="font-bold text-green-600">
                      {completedMatches.filter(match => {
                        const isHome = match.homeTeam.id === teamStats.team.id;
                        const opponentScore = isHome ? match.awayScore : match.homeScore;
                        return opponentScore === 0;
                      }).length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Best Match */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-600" />
                    Best Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bestMatch = completedMatches.reduce((best, match) => {
                      const isHome = match.homeTeam.id === teamStats.team.id;
                      const teamScore = isHome ? match.homeScore : match.awayScore;
                      const opponentScore = isHome ? match.awayScore : match.homeScore;
                      const goalDiff = (teamScore || 0) - (opponentScore || 0);
                      
                      if (!best) return { match, goalDiff };
                      return goalDiff > best.goalDiff ? { match, goalDiff } : best;
                    }, null as { match: MatchWithTeams; goalDiff: number } | null);

                    if (!bestMatch || bestMatch.goalDiff <= 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No winning matches yet</p>
                        </div>
                      );
                    }

                    const match = bestMatch.match;
                    const isHome = match.homeTeam.id === teamStats.team.id;
                    const teamScore = isHome ? match.homeScore : match.awayScore;
                    const opponentScore = isHome ? match.awayScore : match.homeScore;
                    const opponent = isHome ? match.awayTeam : match.homeTeam;

                    return (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {teamScore} - {opponentScore}
                        </div>
                        <div className="font-medium mb-1">vs {opponent.schoolName}</div>
                        <div className="text-sm text-gray-500 mb-2">{isHome ? 'Home' : 'Away'}</div>
                        <Badge variant="outline" className="text-xs">
                          {match.stage === 'pool' ? `Pool ${match.poolId}` : 
                           match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                           match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                        </Badge>
                        <div className="text-xs text-green-600 mt-2">
                          +{bestMatch.goalDiff} goal margin
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Team Discipline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Discipline Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Yellow Cards</span>
                      <span className="font-bold text-yellow-600">
                        {Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.totalYellowCards, 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Red Cards</span>
                      <span className="font-bold text-red-600">
                        {Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.totalRedCards, 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Discipline Points</span>
                      <span className="font-bold text-orange-600">
                        {Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.disciplinaryPoints, 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fair Play Rating</span>
                      <span className={`font-bold ${
                        Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.disciplinaryPoints, 0) === 0 ? 'text-green-600' :
                        Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.disciplinaryPoints, 0) <= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.disciplinaryPoints, 0) === 0 ? 'Excellent' :
                         Object.values(teamStats.playerStats).reduce((sum, p) => sum + p.disciplinaryPoints, 0) <= 5 ? 'Good' : 'Poor'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pool Position */}
              {teamStats.team.poolId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Pool Standing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`
                        w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl
                        ${getPoolColor(teamStats.team.poolId)}
                      `}>
                        {(() => {
                          const poolStandings = tournamentUtils.getPoolStandings(teamStats.team.poolId);
                          const position = poolStandings.findIndex(s => s.team.id === teamStats.team.id) + 1;
                          return position;
                        })()}
                      </div>
                      <div className="text-lg font-bold mb-1">
                        {(() => {
                          const position = tournamentUtils.getPoolStandings(teamStats.team.poolId).findIndex(s => s.team.id === teamStats.team.id) + 1;
                          return position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
                        })()} in Pool {teamStats.team.poolId}
                      </div>
                      <div className="text-sm text-gray-600">
                        {teamStats.standing.points} points • {teamStats.standing.played}/6 matches played
                      </div>
                      
                      {/* Qualification Status */}
                      <div className="mt-4">
                        {(() => {
                          const position = tournamentUtils.getPoolStandings(teamStats.team.poolId).findIndex(s => s.team.id === teamStats.team.id) + 1;
                          if (position <= 4) {
                            return (
                              <Badge className="bg-green-100 text-green-800">
                                <Crown className="w-3 h-3 mr-1" />
                                Cup Qualified
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Users className="w-3 h-3 mr-1" />
                                Festival Division
                              </Badge>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Match Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Tournament Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Pool Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Pool Matches</span>
                        <span>{teamStats.standing.played}/6</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(teamStats.standing.played / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tournament Stage */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Current Stage:</div>
                      {teamStats.standing.played === 6 ? (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Pool stage complete
                        </div>
                      ) : (
                        <div className="text-sm text-orange-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pool stage in progress
                        </div>
                      )}
                    </div>

                    {/* Knockout Prospects */}
                    {teamStats.standing.played > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Knockout Prospects:</div>
                        {(() => {
                          const position = teamStats.team.poolId ? 
                            tournamentUtils.getPoolStandings(teamStats.team.poolId).findIndex(s => s.team.id === teamStats.team.id) + 1 : 0;
                          
                          if (position <= 4) {
                            return (
                              <div className="text-sm text-green-600">
                                On track for Cup competition
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm text-blue-600">
                                Heading to Festival matches
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Main teams overview
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="text-blue-600" />
              Teams Overview
            </h1>
            <p className="text-gray-600 mt-2">
              View detailed statistics and information for all tournament teams
            </p>
          </div>
          
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {teams.length} Teams
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search teams, coaches, or managers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Pool Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={filterPool}
                onChange={(e) => setFilterPool(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Pools</option>
                <option value="A">Pool A</option>
                <option value="B">Pool B</option>
                <option value="C">Pool C</option>
                <option value="D">Pool D</option>
                <option value="">Unallocated</option>
              </select>
            </div>
            
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="name">School Name</option>
                <option value="points">Points</option>
                <option value="goals">Goals Scored</option>
                <option value="played">Matches Played</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Teams Message */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Teams Registered</h3>
            <p className="text-gray-600">
              Teams need to be registered before viewing team statistics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      {sortedTeams.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map(team => {
            const standing = team.poolId ? 
              tournamentUtils.getPoolStandings(team.poolId).find(s => s.team.id === team.id) : null;
            const position = team.poolId ? 
              tournamentUtils.getPoolStandings(team.poolId).findIndex(s => s.team.id === team.id) + 1 : 0;
            
            return (
              <Card 
                key={team.id} 
                className="hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => {
                  setSelectedTeam(team);
                  loadTeamStats(team);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.schoolName}</CardTitle>
                    <div className="flex items-center gap-2">
                      {team.poolId && (
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs
                          ${getPoolColor(team.poolId)}
                        `}>
                          {team.poolId}
                        </div>
                      )}
                      {position > 0 && (
                        <Badge variant="outline" className="text-xs">
                          #{position}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Team Info */}
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Coach:</span> {team.coachName}</div>
                    <div><span className="text-gray-500">Manager:</span> {team.managerName}</div>
                    <div><span className="text-gray-500">Players:</span> {team.players.length}</div>
                  </div>
                  
                  {/* Team Stats */}
                  {standing && standing.played > 0 ? (
                    <div className="pt-3 border-t">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-bold text-green-600">{standing.points}</div>
                          <div className="text-xs text-gray-500">Points</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-600">{standing.goalsFor}</div>
                          <div className="text-xs text-gray-500">Goals</div>
                        </div>
                        <div>
                          <div className={`font-bold ${standing.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                          </div>
                          <div className="text-xs text-gray-500">Diff</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-3">
                        <div className="text-xs text-gray-500">
                          {standing.won}W-{standing.drawn}D-{standing.lost}L ({standing.played} played)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t text-center text-sm text-gray-500">
                      {team.poolId ? 'No matches played yet' : 'Not allocated to pool'}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Search Results */}
      {teams.length > 0 && sortedTeams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading team statistics...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPoolColor(poolId: string): string {
  const colors = {
    'A': 'bg-blue-600',
    'B': 'bg-green-600', 
    'C': 'bg-orange-600',
    'D': 'bg-purple-600'
  };
  return colors[poolId as keyof typeof colors] || 'bg-gray-600';
}
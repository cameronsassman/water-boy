'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { teamStatsUtils, TeamStatsSummary, TeamPerformanceTrend } from '@/utils/team-stats';
import { tournamentUtils } from '@/utils/tournament-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Trophy, Target, Award, ArrowLeft, TrendingUp, TrendingDown, 
 Star, Activity, Calendar, BarChart3, Zap, Shield, Flame,
  Clock, ChevronRight, Medal, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function TeamDetailPage() {
  const params = useParams();
  // const router = useRouter();
  const teamId = params?.id as string;

  console.log(teamId)
  
  const [teamStats, setTeamStats] = useState<TeamStatsSummary | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<TeamPerformanceTrend | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (teamId) {
          const loadTeamData = () => {
    setLoading(true);
    try {
      const stats = teamStatsUtils.getTeamStats(teamId);
      const trend = teamStatsUtils.getTeamPerformanceTrend(teamId);
      
      setTeamStats(stats);
      setPerformanceTrend(trend);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };
  
      loadTeamData();
    }
  }, [teamId]);



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!teamStats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-4">The requested team could not be found.</p>
          <Link href="/teams">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPoolColor = (poolId?: string): string => {
    const colors = {
      'A': 'bg-blue-600',
      'B': 'bg-green-600', 
      'C': 'bg-orange-600',
      'D': 'bg-purple-600'
    };
    return colors[poolId as keyof typeof colors] || 'bg-gray-600';
  };

  const getPoolStanding = () => {
    if (!teamStats.team.poolId) return null;
    const poolStandings = tournamentUtils.getPoolStandings(teamStats.team.poolId);
    const position = poolStandings.findIndex(s => s.team.id === teamId) + 1;
    return { position, total: poolStandings.length };
  };

  const poolStanding = getPoolStanding();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
          
          {teamStats.team.poolId && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getPoolColor(teamStats.team.poolId)}`}>
              {teamStats.team.poolId}
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{teamStats.team.schoolName}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>Coach: {teamStats.team.coachName}</span>
          {teamStats.team.managerName && (
            <span>Manager: {teamStats.team.managerName}</span>
          )}
          <span>{teamStats.team.players.length} Players</span>
          {poolStanding && (
            <Badge variant="outline">
              Pool {teamStats.team.poolId} • #{poolStanding.position} of {poolStanding.total}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{teamStats.points}</div>
            <div className="text-sm text-gray-600">Points</div>
            <div className="text-xs text-gray-500 mt-1">
              {teamStats.wins}W • {teamStats.draws}D • {teamStats.losses}L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{teamStats.goalsFor}</div>
            <div className="text-sm text-gray-600">Goals Scored</div>
            <div className="text-xs text-gray-500 mt-1">
              {teamStats.averageGoalsPerMatch.toFixed(1)} per match
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{teamStats.goalsAgainst}</div>
            <div className="text-sm text-gray-600">Goals Against</div>
            <div className="text-xs text-gray-500 mt-1">
              {teamStats.averageGoalsAgainst.toFixed(1)} per match
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {teamStats.goalDifference > 0 ? '+' : ''}{teamStats.goalDifference}
            </div>
            <div className="text-sm text-gray-600">Goal Difference</div>
            <div className="text-xs text-gray-500 mt-1">
              {teamStats.winPercentage.toFixed(0)}% win rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="matches">Match History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="awards">Team Awards</TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Statistics Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
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
                          <th className="text-center p-3 font-medium text-sm text-gray-600">Avg/M</th>
                          <th className="text-center p-3 font-medium text-sm text-gray-600">K/O</th>
                          <th className="text-center p-3 font-medium text-sm text-gray-600">YC</th>
                          <th className="text-center p-3 font-medium text-sm text-gray-600">RC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamStats.players
                          .sort((a, b) => b.goals - a.goals)
                          .map(player => (
                          <tr key={player.playerId} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs">
                                  {player.capNumber}
                                </Badge>
                                <div>
                                  <div className="font-medium text-sm">{player.playerName}</div>
                                  {player.matchesPlayed === 0 && (
                                    <div className="text-xs text-gray-400">Not played</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-3 text-sm">{player.matchesPlayed}</td>
                            <td className="text-center p-3">
                              <span className={`font-medium ${player.goals > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {player.goals}
                              </span>
                            </td>
                            <td className="text-center p-3 text-sm text-gray-600">
                              {player.averageGoalsPerMatch.toFixed(1)}
                            </td>
                            <td className="text-center p-3">
                              <span className={`${player.kickOuts > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                {player.kickOuts}
                              </span>
                            </td>
                            <td className="text-center p-3">
                              <span className={`${player.yellowCards > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                {player.yellowCards}
                              </span>
                            </td>
                            <td className="text-center p-3">
                              <span className={`${player.redCards > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {player.redCards}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Leaders */}
            <div className="space-y-4">
              {/* Top Scorer */}
              {teamStats.topScorer && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      Top Scorer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs bg-yellow-100 text-yellow-800">
                        {teamStats.topScorer.capNumber}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{teamStats.topScorer.playerName}</div>
                        <div className="text-xs text-gray-500">
                          {teamStats.topScorer.goals} goals in {teamStats.topScorer.matchesPlayed} matches
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {teamStats.topScorer.goals}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Most Kick-outs */}
              {teamStats.mostKickOuts && teamStats.mostKickOuts.kickOuts > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      Most Aggressive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs bg-orange-100 text-orange-800">
                        {teamStats.mostKickOuts.capNumber}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{teamStats.mostKickOuts.playerName}</div>
                        <div className="text-xs text-gray-500">
                          {teamStats.mostKickOuts.kickOuts} kick-outs
                        </div>
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {teamStats.mostKickOuts.kickOuts}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Most Cards */}
              {teamStats.mostCards && teamStats.mostCards.totalCardsReceived > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Most Carded
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs bg-red-100 text-red-800">
                        {teamStats.mostCards.capNumber}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{teamStats.mostCards.playerName}</div>
                        <div className="text-xs text-gray-500">
                          {teamStats.mostCards.yellowCards}Y • {teamStats.mostCards.redCards}R
                        </div>
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {teamStats.mostCards.totalCardsReceived}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team Form */}
              {performanceTrend && performanceTrend.form.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Recent Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 mb-2">
                      {performanceTrend.form.map((result, index) => (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            result === 'win' ? 'bg-green-600' :
                            result === 'draw' ? 'bg-blue-600' : 'bg-red-600'
                          }`}
                        >
                          {result.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {performanceTrend.isImproving ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-green-600">Improving</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500">Stable</span>
                        </>
                      )}
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {performanceTrend.consistency}% consistent
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Match History Tab */}
        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Match History ({teamStats.matchHistory.length} matches)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {teamStats.matchHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No matches played yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {teamStats.matchHistory.map(match => (
                    <div key={match.matchId} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Result indicator */}
                          <div className={`w-3 h-3 rounded-full ${
                            match.result === 'win' ? 'bg-green-600' :
                            match.result === 'draw' ? 'bg-blue-600' : 'bg-red-600'
                          }`}></div>
                          
                          <div>
                            <div className="font-medium text-sm">
                              vs {match.opponent.schoolName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {match.stage === 'pool' ? `Pool ${teamStats.team.poolId}` : 
                                 match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : 
                                 match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                              </Badge>
                              {match.isHome ? 'Home' : 'Away'}
                              {match.date && (
                                <span>• {new Date(match.date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Score */}
                          <div className="text-right">
                            <div className={`font-bold ${
                              match.result === 'win' ? 'text-green-600' :
                              match.result === 'draw' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {match.teamScore} - {match.opponentScore}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {match.result}
                            </div>
                          </div>
                          
                          {/* View details */}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Goal scorers preview */}
                      {match.playerStats.filter(p => p.goals > 0).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-600 mb-1">Goal scorers:</div>
                          <div className="flex flex-wrap gap-1">
                            {match.playerStats
                              .filter(p => p.goals > 0)
                              .map(p => {
                                const player = teamStats.team.players.find(pl => pl.id === p.playerId);
                                return player ? (
                                  <Badge key={p.playerId} variant="secondary" className="text-xs">
                                    #{p.capNumber} {player.name} ({p.goals})
                                  </Badge>
                                ) : null;
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {teamStats.winPercentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {teamStats.averageGoalsPerMatch.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Goals/Match</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {teamStats.averageGoalsAgainst.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Conceded/Match</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {performanceTrend?.consistency || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Consistency</div>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Team Analysis</h4>
                  
                  {teamStats.averageGoalsPerMatch > 3 && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                      <Flame className="w-4 h-4" />
                      Strong attacking play ({teamStats.averageGoalsPerMatch.toFixed(1)} goals/match)
                    </div>
                  )}
                  
                  {teamStats.averageGoalsAgainst < 2 && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      <Shield className="w-4 h-4" />
                      Solid defensive record ({teamStats.averageGoalsAgainst.toFixed(1)} conceded/match)
                    </div>
                  )}
                  
                  {teamStats.winPercentage > 60 && (
                    <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-2 rounded">
                      <Trophy className="w-4 h-4" />
                      Excellent win rate ({teamStats.winPercentage.toFixed(0)}%)
                    </div>
                  )}
                  
                  {performanceTrend?.isImproving && (
                    <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 p-2 rounded">
                      <TrendingUp className="w-4 h-4" />
                      Improving form in recent matches
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goal Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Goal Scoring Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceTrend && performanceTrend.goalTrend.length > 0 ? (
                  <div className="space-y-4">
                    {/* Simple trend visualization */}
                    <div className="grid grid-cols-1 gap-2">
                      {performanceTrend.goalTrend.slice(-5).map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">Match {trend.matchNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-600">
                              {trend.goalsScored}
                            </span>
                            <span className="text-xs text-gray-400">-</span>
                            <span className="text-sm font-medium text-red-600">
                              {trend.goalsConceded}
                            </span>
                            <span className={`text-xs font-medium ml-2 ${
                              trend.goalDifference > 0 ? 'text-green-600' :
                              trend.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              ({trend.goalDifference > 0 ? '+' : ''}{trend.goalDifference})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Last 5 matches shown
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No match data available for trend analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tournament Position */}
            {poolStanding && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Medal className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                  <div className="text-3xl font-bold mb-2">#{poolStanding.position}</div>
                  <div className="text-sm text-gray-600">
                    Pool {teamStats.team.poolId} Position
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    out of {poolStanding.total} teams
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Qualification Status */}
            <Card>
              <CardContent className="p-6 text-center">
                {poolStanding && poolStanding.position <= 4 ? (
                  <>
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <div className="text-lg font-bold text-green-700 mb-2">Cup Qualified</div>
                    <div className="text-sm text-gray-600">
                      Advanced to knockout stage
                    </div>
                  </>
                ) : poolStanding ? (
                  <>
                    <Target className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <div className="text-lg font-bold text-blue-700 mb-2">Festival</div>
                    <div className="text-sm text-gray-600">
                      Competing in festival matches
                    </div>
                  </>
                ) : (
                  <>
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <div className="text-lg font-bold text-gray-600 mb-2">In Progress</div>
                    <div className="text-sm text-gray-600">
                      Pool stage ongoing
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Records */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Team Records
                </h4>
                
                <div className="space-y-3">
                  {teamStats.wins > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Wins</span>
                      <span className="font-bold text-green-600">{teamStats.wins}</span>
                    </div>
                  )}
                  
                  {teamStats.goalsFor > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Goals</span>
                      <span className="font-bold text-blue-600">{teamStats.goalsFor}</span>
                    </div>
                  )}
                  
                  {teamStats.topScorer && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top Scorer</span>
                      <span className="font-bold text-yellow-600">
                        #{teamStats.topScorer.capNumber} ({teamStats.topScorer.goals})
                      </span>
                    </div>
                  )}
                  
                  {teamStats.goalDifference > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Goal Difference</span>
                      <span className="font-bold text-green-600">+{teamStats.goalDifference}</span>
                    </div>
                  )}

                  {teamStats.matchesPlayed === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No records yet</p>
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { tournamentUtils, TeamStanding } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Users, Target, Award, Calendar, CheckCircle, 
   BarChart3, RefreshCw, TrendingUp 
} from 'lucide-react';

export default function TournamentDashboard() {
  const [allStandings, setAllStandings] = useState<{[key: string]: TeamStanding[]}>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
      const loadTournamentData = async () => {
    setIsLoading(true);
    try {
      if (await tournamentUtils.arePoolsAllocated()) {
        const standings = tournamentUtils.getAllPoolStandings();
        setAllStandings(standings);
        
        const stats = tournamentUtils.getTournamentStats();
        setTournamentStats(stats);
        
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

    loadTournamentData();
  }, []);

  const loadTournamentData = async () => {
    setIsLoading(true);
    try {
      if (await tournamentUtils.arePoolsAllocated()) {
        const standings = tournamentUtils.getAllPoolStandings();
        setAllStandings(standings);
        
        const stats = tournamentUtils.getTournamentStats();
        setTournamentStats(stats);
        
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopScorers = async (limit: number = 5) => {
    const allResults = await storageUtils.getMatchResults();
    const playerGoals: {[key: string]: {name: string, team: string, goals: number, capNumber: number}} = {};
    
    const teams = await storageUtils.getTeams();
    
    allResults.forEach(result => {
      if (result.completed) {
        [...result.homeTeamStats, ...result.awayTeamStats].forEach(playerStat => {
          if (playerStat.goals > 0) {
            const key = playerStat.playerId;
            
            // Find player and team info
            let playerInfo = null;
            let teamName = '';
            
            for (const team of teams) {
              const player = team.players.find(p => p.id === playerStat.playerId);
              if (player) {
                playerInfo = player;
                teamName = team.schoolName;
                break;
              }
            }
            
            if (playerInfo) {
              if (!playerGoals[key]) {
                playerGoals[key] = {
                  name: playerInfo.name,
                  team: teamName,
                  goals: 0,
                  capNumber: playerInfo.capNumber
                };
              }
              playerGoals[key].goals += playerStat.goals;
            }
          }
        });
      }
    });
    
    return Object.values(playerGoals)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limit);
  };

  const getPoolLeaders = () => {
    return Object.entries(allStandings).map(([poolId, standings]) => {
      const leader = standings[0];
      return leader ? {
        poolId,
        team: leader.team,
        points: leader.points,
        played: leader.played,
        goalDifference: leader.goalDifference
      } : null;
    }).filter(Boolean);
  };

  if (isLoading || !tournamentStats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament dashboard...</p>
        </div>
      </div>
    );
  }

  const topScorers = getTopScorers();
  const poolLeaders = getPoolLeaders();
  const hasResults = tournamentStats.completedMatches > 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="text-blue-600" />
              Tournament Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Live standings and tournament statistics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              Last updated: {lastUpdated}
            </Badge>
            <Button
              onClick={loadTournamentData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tournament Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{tournamentStats.completedMatches}</div>
            <div className="text-sm text-gray-600">Completed Matches</div>
            <div className="text-xs text-gray-500">of {tournamentStats.totalMatches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{tournamentStats.totalGoals}</div>
            <div className="text-sm text-gray-600">Goals Scored</div>
            <div className="text-xs text-gray-500">{tournamentStats.averageGoalsPerMatch} per match</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(allStandings).reduce((total, standings) => 
                total + standings.filter(s => s.played > 0).length, 0
              )}
            </div>
            <div className="text-sm text-gray-600">Active Teams</div>
            <div className="text-xs text-gray-500">with results</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Pool Complete</div>
            <div className="text-xs text-gray-500">{tournamentStats.pendingMatches} remaining</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Pool Leaders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Pool Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poolLeaders.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {poolLeaders.map((leader: any, index) => (
                  <div key={leader.poolId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(leader.poolId)}`}>
                        {leader.poolId}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Pool {leader.poolId} Leader</div>
                        <div className="text-xs text-gray-600">
                          {leader.played > 0 ? `${leader.points} pts` : 'No matches yet'}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium text-lg">{leader.team.schoolName}</div>
                    {leader.played > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{leader.played} matches</span>
                        <span className={leader.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {leader.goalDifference >= 0 ? '+' : ''}{leader.goalDifference} GD
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pool leaders yet</p>
                <p className="text-sm">Complete some matches to see standings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Scorers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScorers && topScorers.length > 0 ? (
              <div className="space-y-3">
                {topScorers.map((scorer, index) => (
                  <div key={`${scorer.name}-${scorer.team}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {scorer.name}
                        <Badge variant="outline" className="text-xs">#{scorer.capNumber}</Badge>
                      </div>
                      <div className="text-xs text-gray-600">{scorer.team}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{scorer.goals}</div>
                      <div className="text-xs text-gray-500">goals</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No goals scored yet</p>
                <p className="text-sm">Complete matches to see scorers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Pool Standings */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {Object.entries(allStandings).map(([poolId, standings]) => (
          <Card key={poolId}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                    {poolId}
                  </div>
                  Pool {poolId} Standings
                </span>
                <Badge variant="outline">{standings.length} teams</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium text-xs text-gray-600">Team</th>
                        <th className="text-center p-2 font-medium text-xs text-gray-600 w-8">P</th>
                        <th className="text-center p-2 font-medium text-xs text-gray-600 w-8">Pts</th>
                        <th className="text-center p-2 font-medium text-xs text-gray-600 w-12">GD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.slice(0, 7).map((standing, index) => {
                        const position = index + 1;
                        const isQualifying = position <= 4;
                        
                        return (
                          <tr 
                            key={standing.team.id} 
                            className={`border-b text-sm hover:bg-gray-50 ${
                              isQualifying && hasResults ? 'bg-green-50' : 
                              position > 4 && hasResults ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isQualifying && hasResults ? 'bg-green-600 text-white' :
                                  position > 4 && hasResults ? 'bg-blue-600 text-white' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {position}
                                </span>
                                <div>
                                  <div className="font-medium text-xs truncate max-w-32" title={standing.team.schoolName}>
                                    {standing.team.schoolName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-2 text-xs font-medium">{standing.played}</td>
                            <td className="text-center p-2">
                              <span className="font-bold text-xs">{standing.points}</span>
                            </td>
                            <td className="text-center p-2 text-xs">
                              <span className={
                                standing.goalDifference > 0 ? 'text-green-600 font-medium' : 
                                standing.goalDifference < 0 ? 'text-red-600 font-medium' : 'text-gray-600'
                              }>
                                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No teams in this pool</p>
                </div>
              )}
              
              {standings.length > 0 && hasResults && (
                <div className="border-t bg-gray-50 p-2">
                  <div className="flex justify-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Cup (Top 4)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Festival</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Progress */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tournament Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(tournamentStats.completedMatches / tournamentStats.totalMatches) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['A', 'B', 'C', 'D'].map(poolId => {
                const poolComplete = tournamentUtils.isPoolStageComplete(poolId);
                const poolMatches = tournamentUtils.getPoolMatches(poolId);
                const completedPoolMatches = poolMatches.filter(m => m.completed).length;
                const completion = poolMatches.length > 0 ? Math.round((completedPoolMatches / poolMatches.length) * 100) : 0;
                
                return (
                  <div key={poolId} className={`p-3 rounded-lg border ${poolComplete ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${getPoolColor(poolId)}`}>
                        {poolId}
                      </div>
                      <div className="text-sm font-medium">Pool {poolId}</div>
                      {poolComplete && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {completedPoolMatches}/{poolMatches.length} matches
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getPoolProgressColor(poolId)}`}
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {tournamentUtils.isPoolStageComplete() && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="font-semibold text-green-800 mb-1">Pool Stage Complete!</div>
                <div className="text-sm text-green-700">Ready to generate knockout brackets</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasResults && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Tournament Ready</h3>
            <p className="text-gray-600 mb-4">
              All teams are allocated and fixtures are generated. Start playing matches to see live standings!
            </p>
            <div className="text-sm text-gray-500">
              <p>{tournamentStats.totalMatches} total pool matches to be played</p>
              <p>Each team plays 6 matches in their pool</p>
            </div>
          </CardContent>
        </Card>
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

function getPoolProgressColor(poolId: string): string {
  const colors = {
    'A': 'bg-blue-500',
    'B': 'bg-green-500', 
    'C': 'bg-orange-500',
    'D': 'bg-purple-500'
  };
  return colors[poolId as keyof typeof colors] || 'bg-gray-500';
}
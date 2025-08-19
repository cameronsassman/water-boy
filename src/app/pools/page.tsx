'use client';

import { useState, useEffect } from 'react';
import { tournamentUtils, TeamStanding } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import PoolStandings from '@/components/guests/pool-standings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, RefreshCw, Shuffle, Trophy, Target, 
  AlertCircle, CheckCircle, Clock, Award
} from 'lucide-react';

export default function PoolsPage() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [poolStandings, setPoolStandings] = useState<{[key: string]: TeamStanding[]}>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [allPoolsComplete, setAllPoolsComplete] = useState(false);
  const [poolCompletionStatus, setPoolCompletionStatus] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadPoolData();
  }, []);

  const loadPoolData = () => {
    try {
      const allocated = tournamentUtils.arePoolsAllocated();
      const teams = storageUtils.getTeams();
      
      setIsAllocated(allocated);
      setTotalTeams(teams.length);

      if (allocated) {
        // Load standings for all pools
        const standings = tournamentUtils.getAllPoolStandings();
        setPoolStandings(standings);
        
        // Check completion status for each pool
        const completionStatus: {[key: string]: boolean} = {};
        const poolIds = ['A', 'B', 'C', 'D'];
        
        poolIds.forEach(poolId => {
          completionStatus[poolId] = tournamentUtils.isPoolStageComplete(poolId);
        });
        
        setPoolCompletionStatus(completionStatus);
        setAllPoolsComplete(tournamentUtils.isPoolStageComplete());
      }
    } catch (error) {
      console.error('Error loading pool data:', error);
    }
  };

  const handleAllocatePools = async () => {
    setIsAllocating(true);
    
    try {
      // Simulate allocation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      tournamentUtils.allocateTeamsToPools();
      loadPoolData();
    } catch (error) {
      console.error('Error allocating pools:', error);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleResetPools = async () => {
    if (!confirm('Are you sure you want to reset pool allocation? This will clear all pools and matches.')) {
      return;
    }
    
    setIsAllocating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      tournamentUtils.resetPools();
      loadPoolData();
    } catch (error) {
      console.error('Error resetting pools:', error);
    } finally {
      setIsAllocating(false);
    }
  };

  const getPoolStats = (poolId: string) => {
    const standings = poolStandings[poolId] || [];
    const teamsCount = standings.length;
    const matchesPlayed = standings.reduce((total, standing) => total + standing.played, 0) / 2; // Divide by 2 to avoid double counting
    const totalExpectedMatches = teamsCount > 0 ? (teamsCount * (teamsCount - 1)) / 2 : 0;
    const completionPercentage = totalExpectedMatches > 0 ? Math.round((matchesPlayed / totalExpectedMatches) * 100) : 0;
    
    return {
      teamsCount,
      matchesPlayed,
      totalExpectedMatches,
      completionPercentage,
      isComplete: poolCompletionStatus[poolId] || false
    };
  };

  // Show loading state initially
  if (totalTeams === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="text-blue-600" />
              Tournament Pools
            </h1>
            <p className="text-gray-600 mt-2">
              Pool allocation and standings for the tournament
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
            {!isAllocated && (
              <Button
                onClick={handleAllocatePools}
                disabled={isAllocating || totalTeams === 0}
                className="min-w-40"
              >
                {isAllocating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Allocate Pools
                  </>
                )}
              </Button>
            )}

            {isAllocated && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAllocatePools}
                  disabled={isAllocating}
                  variant="outline"
                  size="sm"
                >
                  {isAllocating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Re-allocating...
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 mr-2" />
                      Re-allocate
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleResetPools}
                  disabled={isAllocating}
                  variant="destructive"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Pools
                </Button>
              </div>
            )}

            <Button
              onClick={loadPoolData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Teams Not Allocated */}
      {!isAllocated && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Ready for Pool Allocation</h3>
            <p className="text-gray-600 mb-4">
              {totalTeams} teams are registered and ready to be randomly allocated into pools.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Target: 7 teams per pool across 4 pools (28 teams total)</p>
              <p>Current: {totalTeams} teams registered</p>
              
              {totalTeams !== 28 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-orange-700 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">
                    {totalTeams < 28 
                      ? `${28 - totalTeams} more teams needed for optimal allocation`
                      : `${totalTeams - 28} extra teams will be distributed evenly`
                    }
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pool Allocation Complete */}
      {isAllocated && (
        <>
          {/* Tournament Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {['A', 'B', 'C', 'D'].map(poolId => {
              const stats = getPoolStats(poolId);
              return (
                <Card key={poolId}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                      {poolId}
                    </div>
                    <div className="text-lg font-bold">{stats.teamsCount}</div>
                    <div className="text-sm text-gray-600 mb-1">Teams</div>
                    
                    <div className="text-xs text-gray-500">
                      {stats.matchesPlayed}/{stats.totalExpectedMatches} matches
                    </div>
                    
                    {stats.isComplete ? (
                      <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 mt-2 text-orange-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{stats.completionPercentage}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tournament Status Banner */}
          {allPoolsComplete && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">Pool Stage Complete!</h3>
                      <p className="text-green-700 text-sm">All pool matches have been played. Ready for knockout stage.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="text-green-800 font-medium">Top 4 → Cup</div>
                      <div className="text-blue-800 font-medium">Bottom 3 → Festival</div>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Brackets
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pool Standings Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="A">Pool A</TabsTrigger>
              <TabsTrigger value="B">Pool B</TabsTrigger>
              <TabsTrigger value="C">Pool C</TabsTrigger>
              <TabsTrigger value="D">Pool D</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid gap-6">
                {/* All Pools Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {['A', 'B', 'C', 'D'].map(poolId => {
                    const standings = poolStandings[poolId] || [];
                    const stats = getPoolStats(poolId);
                    
                    return (
                      <Card key={poolId} className={`${stats.isComplete ? 'border-green-200 bg-green-50' : ''}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                                {poolId}
                              </div>
                              Pool {poolId}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {stats.teamsCount} teams
                              </Badge>
                              {stats.isComplete ? (
                                <Badge className="bg-green-600 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {stats.completionPercentage}%
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Quick Standings Preview */}
                          <div className="space-y-2">
                            {standings.slice(0, 3).map((standing, index) => (
                              <div key={standing.team.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
                                    index < 4 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span className="truncate max-w-32" title={standing.team.schoolName}>
                                    {standing.team.schoolName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="font-medium">{standing.points} pts</span>
                                  <span className="text-gray-500">{standing.played}P</span>
                                </div>
                              </div>
                            ))}
                            
                            {standings.length > 3 && (
                              <div className="text-center text-xs text-gray-500 pt-2 border-t">
                                +{standings.length - 3} more teams
                              </div>
                            )}
                          </div>
                          
                          {/* Pool Progress */}
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                              <span>Matches Progress</span>
                              <span>{stats.matchesPlayed}/{stats.totalExpectedMatches}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${stats.isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${stats.completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Tournament Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Tournament Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Qualification Preview */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          Cup Qualification
                        </h4>
                        <div className="space-y-2 text-sm">
                          {['A', 'B', 'C', 'D'].map(poolId => {
                            const qualifiers = (poolStandings[poolId] || []).slice(0, 4);
                            return (
                              <div key={poolId} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${getPoolColor(poolId)}`}></div>
                                <span className="font-medium">Pool {poolId}:</span>
                                <span className="text-gray-600">
                                  {qualifiers.length > 0 ? `${qualifiers.length} qualified` : 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Festival Preview */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-500" />
                          Festival Matches
                        </h4>
                        <div className="space-y-2 text-sm">
                          {['A', 'B', 'C', 'D'].map(poolId => {
                            const nonQualifiers = (poolStandings[poolId] || []).slice(4);
                            return (
                              <div key={poolId} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${getPoolColor(poolId)}`}></div>
                                <span className="font-medium">Pool {poolId}:</span>
                                <span className="text-gray-600">
                                  {nonQualifiers.length > 0 ? `${nonQualifiers.length} teams` : 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tournament Status */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Status
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Teams Allocated:</span>
                            <span className="font-medium text-green-600">
                              {Object.values(poolStandings).reduce((total, standings) => total + standings.length, 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pools Complete:</span>
                            <span className="font-medium">
                              {Object.values(poolCompletionStatus).filter(Boolean).length}/4
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stage Status:</span>
                            <span className={`font-medium ${allPoolsComplete ? 'text-green-600' : 'text-orange-600'}`}>
                              {allPoolsComplete ? 'Ready for Knockout' : 'In Progress'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Individual Pool Tabs */}
            {['A', 'B', 'C', 'D'].map(poolId => (
              <TabsContent key={poolId} value={poolId}>
                <PoolStandings 
                  poolId={poolId}
                  poolName={`Pool ${poolId}`}
                  standings={poolStandings[poolId] || []}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Pool Stage Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Pool Stage Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Match Format</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Each team plays 6 matches (vs every other team in pool)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>3 points for win, 1 point for draw, 0 for loss</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span>Ranked by: Points → Goal Difference → Goals For</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Qualification</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <span>Top 4 teams per pool → Cup Round of 16</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Bottom 3 teams per pool → Festival matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span>Cup losers → Plate/Shield brackets</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
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
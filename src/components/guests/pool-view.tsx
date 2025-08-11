import { useState, useEffect } from 'react';
import { tournamentUtils } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import PoolStandings from '../guests/pool-standings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Trophy, AlertCircle, Target, BarChart3, RefreshCw } from 'lucide-react';

export default function PoolsView() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [totalTeams, setTotalTeams] = useState(0);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [poolStandings, setPoolStandings] = useState<{[key: string]: any[]}>({});
  const [tournamentStats, setTournamentStats] = useState<any>(null);

  useEffect(() => {
    loadPoolData();
  }, []);

  const loadPoolData = () => {
    const teams = storageUtils.getTeams();
    const allocated = tournamentUtils.arePoolsAllocated();
    
    setTotalTeams(teams.length);
    setIsAllocated(allocated);

    if (allocated) {
      const standings = {
        A: tournamentUtils.getPoolStandings('A'),
        B: tournamentUtils.getPoolStandings('B'),
        C: tournamentUtils.getPoolStandings('C'),
        D: tournamentUtils.getPoolStandings('D')
      };
      setPoolStandings(standings);
      
      // Get tournament statistics
      const stats = tournamentUtils.getTournamentStats();
      setTournamentStats(stats);
    }
  };

  const handleAllocateTeams = async () => {
    if (totalTeams === 0) return;
    
    setIsAllocating(true);
    
    // Simulate allocation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    tournamentUtils.allocateTeamsToPools();
    loadPoolData();
    
    setIsAllocating(false);
  };

  const handleReallocate = async () => {
    setIsAllocating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    tournamentUtils.resetPools();
    tournamentUtils.allocateTeamsToPools();
    loadPoolData();
    
    setIsAllocating(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    loadPoolData();
    setIsRefreshing(false);
  };

  const hasMatchResults = tournamentStats && tournamentStats.completedMatches > 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="text-blue-600" />
              Tournament Pools
            </h1>
            <p className="text-gray-600 mt-2">
              View pool allocations and current standings
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
            {isAllocated && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            
            {totalTeams > 0 && (
              <Button
                onClick={isAllocated ? handleReallocate : handleAllocateTeams}
                disabled={isAllocating}
                className="min-w-32"
              >
                {isAllocating ? (
                  <>
                    <Shuffle className="w-4 h-4 mr-2 animate-spin" />
                    {isAllocated ? 'Re-allocating...' : 'Allocating...'}
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    {isAllocated ? 'Re-allocate' : 'Allocate Teams'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Statistics */}
      {isAllocated && tournamentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{tournamentStats.completedMatches}</div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-xs text-gray-500">of {tournamentStats.totalMatches} matches</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{tournamentStats.totalGoals}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
              <div className="text-xs text-gray-500">{tournamentStats.averageGoalsPerMatch} avg/match</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {Object.values(poolStandings).reduce((count, standings) => 
                  count + standings.filter(s => s.played > 0).length, 0
                )}
              </div>
              <div className="text-sm text-gray-600">Active Teams</div>
              <div className="text-xs text-gray-500">with match results</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{tournamentStats.pendingMatches}</div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-xs text-gray-500">matches remaining</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Teams Message */}
      {totalTeams === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Teams Registered</h3>
            <p className="text-gray-600 mb-4">
              Teams need to be registered before pool allocation can begin.
            </p>
            <p className="text-sm text-gray-500">
              Ask an administrator to register teams first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Teams Registered but Not Allocated */}
      {totalTeams > 0 && !isAllocated && (
        <Card>
          <CardContent className="text-center py-12">
            <Shuffle className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Ready for Pool Allocation</h3>
            <p className="text-gray-600 mb-4">
              {totalTeams} teams are registered and ready to be allocated into pools.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Each pool will have {Math.floor(totalTeams / 4)} teams 
              {totalTeams % 4 > 0 && `, with ${totalTeams % 4} pool${totalTeams % 4 > 1 ? 's' : ''} having one extra team`}.
            </p>
            
            {totalTeams < 28 && (
              <div className="flex items-center justify-center gap-2 mb-4 text-orange-700 bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  Tournament is designed for 28 teams (7 per pool). Currently have {totalTeams} teams.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pool Standings */}
      {isAllocated && (
        <>
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <PoolStandings 
              poolId="A" 
              poolName="Pool A" 
              standings={poolStandings.A || []} 
            />
            <PoolStandings 
              poolId="B" 
              poolName="Pool B" 
              standings={poolStandings.B || []} 
            />
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            <PoolStandings 
              poolId="C" 
              poolName="Pool C" 
              standings={poolStandings.C || []} 
            />
            <PoolStandings 
              poolId="D" 
              poolName="Pool D" 
              standings={poolStandings.D || []} 
            />
          </div>

          {/* Pool Summary and Tournament Progress */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            {/* Pool Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Pool Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                  {['A', 'B', 'C', 'D'].map(poolId => {
                    const standings = poolStandings[poolId] || [];
                    const count = standings.length;
                    const activeTeams = standings.filter(s => s.played > 0).length;
                    return (
                      <div key={poolId} className="p-4 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                          {poolId}
                        </div>
                        <div className="font-semibold">Pool {poolId}</div>
                        <div className="text-sm text-gray-600">{count} teams</div>
                        {hasMatchResults && (
                          <div className="text-xs text-blue-600 mt-1">{activeTeams} active</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center text-sm text-gray-600 space-y-1">
                  <p>Each team plays 6 matches within their pool.</p>
                  <p className="flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-green-600" />
                    Top 4 teams from each pool advance to Cup knockout stage.
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Bottom 3 teams participate in Festival matches.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Progress */}
            {hasMatchResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Tournament Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Pool Stage Completion</span>
                        <span>{Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(tournamentStats.completedMatches / tournamentStats.totalMatches) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pool Completion Status */}
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map(poolId => {
                        const poolComplete = tournamentUtils.isPoolStageComplete(poolId);
                        const poolMatches = tournamentUtils.getPoolMatches(poolId);
                        const completedPoolMatches = poolMatches.filter(m => m.completed).length;
                        
                        return (
                          <div key={poolId} className={`p-3 rounded-lg ${poolComplete ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${getPoolColor(poolId)}`}>
                                {poolId}
                              </div>
                              <div>
                                <div className="text-sm font-medium">Pool {poolId}</div>
                                <div className="text-xs text-gray-600">
                                  {completedPoolMatches}/{poolMatches.length} matches
                                </div>
                              </div>
                              {poolComplete && (
                                <Trophy className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Next Steps */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Next Steps:</div>
                      {tournamentUtils.isPoolStageComplete() ? (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Pool stage complete - ready for knockout generation!
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Complete remaining pool matches to advance to knockout stage
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
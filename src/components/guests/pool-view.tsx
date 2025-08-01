import { useState, useEffect } from 'react';
import { tournamentUtils } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import PoolStandings from '../guests/pool-standings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Trophy, AlertCircle } from 'lucide-react';

export default function PoolsView() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [totalTeams, setTotalTeams] = useState(0);
  const [isAllocating, setIsAllocating] = useState(false);
  const [poolStandings, setPoolStandings] = useState<{[key: string]: any[]}>({});

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
              View pool allocations and initial standings
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
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

          {/* Pool Summary */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Pool Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {['A', 'B', 'C', 'D'].map(poolId => {
                  const count = poolStandings[poolId]?.length || 0;
                  return (
                    <div key={poolId} className="p-4 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                        {poolId}
                      </div>
                      <div className="font-semibold">Pool {poolId}</div>
                      <div className="text-sm text-gray-600">{count} teams</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Each team will play 6 matches within their pool.</p>
                <p>Top 4 teams from each pool advance to the Cup knockout stage.</p>
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  capNumber: number;
}

interface Team {
  id: string;
  schoolName: string;
  coachName: string;
  managerName: string;
  poolAllocation: string;
  teamLogo?: string;
  players: Player[];
}

interface TeamStanding {
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

interface PoolStandingsProps {
  poolId: string;
  poolName: string;
  standings?: TeamStanding[]; // Make it optional since we'll fetch data
}

export default function PoolStandings({ poolId, poolName, standings: initialStandings }: PoolStandingsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [standings, setStandings] = useState<TeamStanding[]>(initialStandings || []);
  const [isLoading, setIsLoading] = useState(!initialStandings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Fetch standings if not provided via props
    if (!initialStandings) {
      fetchPoolStandings();
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [poolId, initialStandings]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const fetchPoolStandings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/standings?pool=${poolId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pool standings');
      }
      
      const data = await response.json();
      setStandings(data.standings || []);
    } catch (error) {
      console.error('Error fetching pool standings:', error);
      setError('Failed to load standings data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3 border-b border-blue-200 bg-white/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-800">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                {poolId}
              </div>
              {poolName}
            </span>
            <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-blue-500">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p>Loading standings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader className="pb-3 border-b border-red-200 bg-white/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-red-800">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                {poolId}
              </div>
              {poolName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p className="mb-2">{error}</p>
            <button 
              onClick={fetchPoolStandings}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (standings.length === 0) {
    return (
      <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3 border-b border-blue-200 bg-white/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-800">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                {poolId}
              </div>
              {poolName}
            </span>
            <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">0 teams</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-blue-500">
            <p>No teams allocated to this pool yet</p>
            <button 
              onClick={fetchPoolStandings}
              className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md mt-2 transition-colors"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasMatchResults = standings.some(standing => standing.played > 0);

  if (isMobile) {
    return (
      <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3 border-b border-blue-200 bg-white/50">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-800">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                {poolId}
              </div>
              {poolName}
            </span>
            <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
              {standings.length} teams
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {standings.map((standing, index) => {
              const position = index + 1;
              const isQualifying = position <= 4;
              const isFestival = position > 4;

              return (
                <div 
                  key={standing.team.id}
                  className={`bg-white rounded-lg border-2 p-4 ${
                    isQualifying && hasMatchResults ? 'border-green-300 bg-green-50/80' : 
                    isFestival && hasMatchResults ? 'border-red-300 bg-red-100/80' : 
                    'border-gray-200'
                  }`}
                >
                  {/* Header with position and team name */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                        isQualifying && hasMatchResults ? 'bg-green-600 text-white border-green-700' :
                        isFestival && hasMatchResults ? 'bg-blue-600 text-white border-blue-700' :
                        'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {standing.team.schoolName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {standing.team.players.length} players
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold text-sm px-3 py-1 rounded-full min-w-[60px] text-center ${
                      position === 1 && hasMatchResults ? 'bg-green-100 text-green-700 border border-green-200' : 
                      standing.points > 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {standing.points} pts
                    </div>
                  </div>

                  {/* Stats Grid - 3 columns for better alignment */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Played</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.played}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Won</div>
                      <div className="text-sm font-semibold text-green-600">{standing.won}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Drawn</div>
                      <div className="text-sm font-semibold text-blue-600">{standing.drawn}</div>
                    </div>
                  </div>

                  {/* Second Stats Row - 3 columns */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Lost</div>
                      <div className="text-sm font-semibold text-red-600">{standing.lost}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">G/F</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.goalsFor}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">G/A</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.goalsAgainst}</div>
                    </div>
                  </div>

                  {/* Goals Difference and Status */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-gray-200">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">G/D</div>
                      <div className={`text-sm font-semibold ${
                        standing.goalDifference > 0 ? 'text-green-600' : 
                        standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
                      <div className={`text-xs font-semibold ${
                        isQualifying && hasMatchResults ? 'text-green-600' : 
                        isFestival && hasMatchResults ? 'text-blue-600' : 
                        'text-gray-500'
                      }`}>
                        {isQualifying && hasMatchResults ? 'Qualifying' : 
                         isFestival && hasMatchResults ? 'Festival' : 
                         'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop/Tablet View
  return (
    <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-3 border-b border-blue-200 bg-white/50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-blue-800">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
              {poolId}
            </div>
            Group {poolId}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-200 bg-blue-500 text-white">
                <th className="text-center p-4 font-semibold text-sm w-16">Pos</th>
                <th className="text-left p-4 font-semibold text-sm min-w-[200px]">Team</th>
                <th className="text-center p-4 font-semibold text-sm w-20">Played</th>
                <th className="text-center p-4 font-semibold text-sm w-16">Won</th>
                <th className="text-center p-4 font-semibold text-sm w-20">Drawn</th>
                <th className="text-center p-4 font-semibold text-sm w-16">Lost</th>
                <th className="text-center p-4 font-semibold text-sm w-16">G/F</th>
                <th className="text-center p-4 font-semibold text-sm w-16">G/A</th>
                <th className="text-center p-4 font-semibold text-sm w-20">G/D</th>
                <th className="text-center p-4 font-semibold text-sm w-20">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => {
                const position = index + 1;
                const isQualifying = position <= 4;
                const isFestival = position > 4;
                
                return (
                  <tr 
                    key={standing.team.id} 
                    className={`border-b border-gray-100 ${
                      isQualifying && hasMatchResults ? 'bg-green-50/80 hover:bg-green-100/80' : 
                      isFestival && hasMatchResults ? 'bg-red-100/80 hover:bg-red-200/80' : 
                      index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-100/30'
                    } transition-colors`}
                  >
                    <td className="text-center p-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mx-auto ${
                        isQualifying && hasMatchResults ? 'bg-green-600 text-white border-green-700' :
                        isFestival && hasMatchResults ? 'bg-blue-600 text-white border-blue-700' :
                        'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {position}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-base truncate">
                          {standing.team.schoolName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {standing.team.coachName}
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-4 text-base font-semibold text-gray-700">{standing.played}</td>
                    <td className="text-center p-4 text-base font-semibold text-green-600">{standing.won}</td>
                    <td className="text-center p-4 text-base font-semibold text-blue-600">{standing.drawn}</td>
                    <td className="text-center p-4 text-base font-semibold text-red-600">{standing.lost}</td>
                    <td className="text-center p-4 text-base font-semibold text-gray-700">{standing.goalsFor}</td>
                    <td className="text-center p-4 text-base font-semibold text-gray-700">{standing.goalsAgainst}</td>
                    <td className="text-center p-4 text-base font-semibold">
                      <span className={
                        standing.goalDifference > 0 ? 'text-green-600 font-bold' : 
                        standing.goalDifference < 0 ? 'text-red-600 font-bold' : 'text-gray-600'
                      }>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className={`font-bold text-sm px-3 py-2 rounded-full min-w-[60px] inline-block ${
                        position === 1 && hasMatchResults ? 'bg-green-100 text-green-700 border border-green-200' : 
                        standing.points > 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {standing.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
import { TeamStanding } from '@/utils/tournament-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface PoolStandingsProps {
  poolId: string;
  poolName: string;
  standings: TeamStanding[];
}

export default function PoolStandings({ poolId, poolName, standings }: PoolStandingsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

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
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-3">
            {standings.map((standing, index) => {
              const position = index + 1;
              const isQualifying = position <= 4;
              const isFestival = position > 4;

              return (
                <div 
                  key={standing.team.id}
                  className={`bg-white rounded-lg border-2 p-3 ${
                    isQualifying && hasMatchResults ? 'border-green-300 bg-green-50/80' : 
                    isFestival && hasMatchResults ? 'border-red-300 bg-red-100/80' : 
                    'border-gray-200'
                  }`}
                >
                  {/* Header with position and team name */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        isQualifying && hasMatchResults ? 'bg-green-600 text-white border-green-700' :
                        isFestival && hasMatchResults ? 'bg-blue-600 text-white border-blue-700' :
                        'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {position}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {standing.team.schoolName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {standing.team.players.length} players
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold text-sm px-2 py-1 rounded-full ${
                      position === 1 && hasMatchResults ? 'bg-green-100 text-green-700 border border-green-200' : 
                      standing.points > 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {standing.points} pts
                    </div>
                  </div>

                  {/* Stats Grid - 3 columns for better alignment */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-2">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Played</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.played}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Won</div>
                      <div className="text-sm font-semibold text-green-600">{standing.won}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Drawn</div>
                      <div className="text-sm font-semibold text-blue-600">{standing.drawn}</div>
                    </div>
                  </div>

                  {/* Second Stats Row - 3 columns */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-2">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Lost</div>
                      <div className="text-sm font-semibold text-red-600">{standing.lost}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">G/F</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.goalsFor}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">G/A</div>
                      <div className="text-sm font-semibold text-gray-700">{standing.goalsAgainst}</div>
                    </div>
                  </div>

                  {/* Goals Difference and Status */}
                  <div className="grid grid-cols-2 gap-3 text-center pt-2 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">G/D</div>
                      <div className={`text-sm font-semibold ${
                        standing.goalDifference > 0 ? 'text-green-600' : 
                        standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
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
            {poolName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-200 bg-blue-500 text-white">
                <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Team</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-12">Played</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-12">Won</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-12">Drawn</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-12">Lost</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-16">G/F</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-16">G/A</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-16">G/D</th>
                <th className="text-center p-3 sm:p-4 font-semibold text-xs sm:text-sm w-16">Points</th>
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
                    className={`border-b border-grey-100 ${
                      isQualifying && hasMatchResults ? 'bg-green-50/80' : 
                      isFestival && hasMatchResults ? 'bg-red-100/80' : 
                      index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                    }`}
                  >
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isQualifying && hasMatchResults ? 'bg-green-600 text-white border-green-700' :
                            isFestival && hasMatchResults ? 'bg-blue-600 text-white border-blue-700' :
                            'bg-gray-200 text-gray-600 border-gray-300'
                          }`}>
                            {position}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                            {standing.team.schoolName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {standing.team.players.length} players
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-gray-700">{standing.played}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-green-600">{standing.won}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-blue-600">{standing.drawn}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-red-600">{standing.lost}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-gray-700">{standing.goalsFor}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold text-gray-700">{standing.goalsAgainst}</td>
                    <td className="text-center p-3 sm:p-4 text-sm font-semibold">
                      <span className={
                        standing.goalDifference > 0 ? 'text-green-600 font-bold' : 
                        standing.goalDifference < 0 ? 'text-red-600 font-bold' : 'text-gray-600'
                      }>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </span>
                    </td>
                    <td className="text-center p-3 sm:p-4">
                      <span className={`font-bold text-xs sm:text-sm px-2 py-1 rounded-full ${
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
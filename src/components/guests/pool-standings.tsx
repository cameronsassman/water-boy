import { TeamStanding } from '@/utils/tournament-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Target, Award } from 'lucide-react';

interface PoolStandingsProps {
  poolId: string;
  poolName: string;
  standings: TeamStanding[];
}

export default function PoolStandings({ poolId, poolName, standings }: PoolStandingsProps) {
  if (standings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                {poolId}
              </div>
              {poolName}
            </span>
            <Badge variant="outline">0 teams</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No teams allocated to this pool yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if any matches have been played
  const hasMatchResults = standings.some(standing => standing.played > 0);
  
  // Determine qualification positions
  const qualifyingTeams = standings.slice(0, 4);
  const festivalTeams = standings.slice(4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
              {poolId}
            </div>
            {poolName}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{standings.length} teams</Badge>
            {hasMatchResults && (
              <Badge variant="secondary" className="text-xs">
                {standings.filter(s => s.played > 0).length} active
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium text-sm text-gray-600">Team</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-12">P</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-12">W</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-12">D</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-12">L</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-16">GF</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-16">GA</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-16">GD</th>
                <th className="text-center p-3 font-medium text-sm text-gray-600 w-16">Pts</th>
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
                    className={`border-b hover:bg-gray-50 ${
                      isQualifying && hasMatchResults ? 'bg-green-50' : 
                      isFestival && hasMatchResults ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isQualifying && hasMatchResults ? 'bg-green-600 text-white' :
                            isFestival && hasMatchResults ? 'bg-blue-600 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {position}
                          </span>
                          {hasMatchResults && (
                            <div className="text-xs mt-1">
                              {isQualifying ? (
                                <Trophy className="w-3 h-3 text-green-600" />
                              ) : (
                                <Target className="w-3 h-3 text-blue-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {standing.team.schoolName}
                            {position === 1 && hasMatchResults && standing.points > 0 && (
                              <Award className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {standing.team.players.length} players
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-3 text-sm font-medium">{standing.played}</td>
                    <td className="text-center p-3 text-sm font-medium text-green-600">{standing.won}</td>
                    <td className="text-center p-3 text-sm font-medium text-blue-600">{standing.drawn}</td>
                    <td className="text-center p-3 text-sm font-medium text-red-600">{standing.lost}</td>
                    <td className="text-center p-3 text-sm font-medium">{standing.goalsFor}</td>
                    <td className="text-center p-3 text-sm font-medium">{standing.goalsAgainst}</td>
                    <td className="text-center p-3 text-sm font-medium">
                      <span className={
                        standing.goalDifference > 0 ? 'text-green-600 font-semibold' : 
                        standing.goalDifference < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className={`font-bold text-sm ${
                        position === 1 && hasMatchResults ? 'text-green-600 text-base' : 
                        standing.points > 0 ? 'text-blue-600' : 'text-gray-600'
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
        
        {/* Pool Status Footer */}
        <div className="border-t bg-gray-50 p-3">
          {standings.length < 7 ? (
            <div className="text-center text-sm text-yellow-700">
              Pool needs {7 - standings.length} more team{7 - standings.length !== 1 ? 's' : ''} (target: 7 per pool)
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs text-gray-600">
              <div className="flex items-center gap-4">
                {hasMatchResults ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span>Top 4 → Cup</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span>Bottom 3 → Festival</span>
                    </div>
                  </>
                ) : (
                  <span>Pool complete - ready for matches</span>
                )}
              </div>
              
              {hasMatchResults && (
                <div className="text-xs">
                  {standings.reduce((total, s) => total + s.played, 0)} matches played
                </div>
              )}
            </div>
          )}
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
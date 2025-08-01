import { Team } from '@/types/team';
import { TeamStanding } from '@/utils/tournament-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

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
          <Badge variant="outline">{standings.length} teams</Badge>
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
              {standings.map((standing, index) => (
                <tr key={standing.team.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{standing.team.schoolName}</div>
                        <div className="text-xs text-gray-500">
                          {standing.team.players.length} players
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center p-3 text-sm">{standing.played}</td>
                  <td className="text-center p-3 text-sm">{standing.won}</td>
                  <td className="text-center p-3 text-sm">{standing.drawn}</td>
                  <td className="text-center p-3 text-sm">{standing.lost}</td>
                  <td className="text-center p-3 text-sm">{standing.goalsFor}</td>
                  <td className="text-center p-3 text-sm">{standing.goalsAgainst}</td>
                  <td className="text-center p-3 text-sm">
                    <span className={standing.goalDifference > 0 ? 'text-green-600' : 
                                   standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className="font-bold text-sm">{standing.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {standings.length < 7 && (
          <div className="p-3 bg-yellow-50 border-t text-center text-sm text-yellow-700">
            Pool needs {7 - standings.length} more team{7 - standings.length !== 1 ? 's' : ''} (target: 7 per pool)
          </div>
        )}
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
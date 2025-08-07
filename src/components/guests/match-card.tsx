import { MatchWithTeams } from '@/utils/tournament-logic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';

interface MatchCardProps {
  match: MatchWithTeams;
  showPool?: boolean;
}

export default function MatchCard({ match, showPool = false }: MatchCardProps) {
  const isCompleted = match.completed;
  
  return (
    <Card className={`${isCompleted ? 'bg-gray-50' : 'bg-white'} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          {showPool && match.poolId && (
            <Badge variant="outline" className="text-xs">
              Pool {match.poolId}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isCompleted ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="font-medium text-sm truncate" title={match.homeTeam.schoolName}>
              {match.homeTeam.schoolName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {match.homeTeam.players.length} players
            </div>
          </div>
          
          {/* Score or VS */}
          <div className="px-4 py-2 mx-2 bg-gray-100 rounded-lg min-w-20 text-center">
            {isCompleted ? (
              <div className="font-bold text-lg">
                <span className={match.homeScore! > match.awayScore! ? 'text-green-600' : 
                               match.homeScore! < match.awayScore! ? 'text-red-600' : 'text-blue-600'}>
                  {match.homeScore}
                </span>
                <span className="text-gray-400 mx-1">-</span>
                <span className={match.awayScore! > match.homeScore! ? 'text-green-600' : 
                               match.awayScore! < match.homeScore! ? 'text-red-600' : 'text-blue-600'}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <div className="text-gray-500 font-medium">vs</div>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="font-medium text-sm truncate" title={match.awayTeam.schoolName}>
              {match.awayTeam.schoolName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {match.awayTeam.players.length} players
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
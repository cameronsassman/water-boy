import { MatchWithTeams as TournamentMatchWithTeams } from '@/utils/tournament-logic';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Medal, Clock, CheckCircle } from 'lucide-react';

interface BracketDisplayProps {
  roundOf16: TournamentMatchWithTeams[];
  quarterFinals: TournamentMatchWithTeams[];
  semiFinals: TournamentMatchWithTeams[];
  final: TournamentMatchWithTeams | null;
  thirdPlace: TournamentMatchWithTeams | null;
}

export default function BracketDisplay({ 
  roundOf16, 
  quarterFinals, 
  semiFinals, 
  final, 
  thirdPlace 
}: BracketDisplayProps) {
  
  const BracketMatch = ({ 
    match, 
    size = 'normal',
    highlight = false 
  }: { 
    match: TournamentMatchWithTeams | null; 
    size?: 'small' | 'normal' | 'large';
    highlight?: boolean;
  }) => {
    if (!match || (match.homeTeam.id === 'TBD' && match.awayTeam.id === 'TBD')) {
      return (
        <div className={`
          bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-3 text-center
          ${size === 'small' ? 'min-h-16' : size === 'large' ? 'min-h-24' : 'min-h-20'}
          flex items-center justify-center
        `}>
          <div className="text-xs text-gray-400">TBD</div>
        </div>
      );
    }

    const isCompleted = match.completed;
    const homeWon = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore;
    const awayWon = match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore;
    
    return (
      <Card className={`
        ${highlight ? 'ring-2 ring-yellow-400' : ''} 
        ${isCompleted ? 'bg-gray-50' : 'bg-white'} 
        hover:shadow-md transition-shadow
        ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}
      `}>
        <CardContent className={`
          ${size === 'small' ? 'p-2' : size === 'large' ? 'p-4' : 'p-3'}
        `}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Complete</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className={`
              flex items-center justify-between p-1 rounded
              ${homeWon ? 'bg-green-100 font-semibold' : ''}
            `}>
              <span className={`truncate ${size === 'small' ? 'max-w-20' : 'max-w-32'}`} title={match.homeTeam.schoolName}>
                {match.homeTeam.schoolName}
              </span>
              <span className={`font-bold ${homeWon ? 'text-green-600' : ''}`}>
                {match.homeScore ?? '-'}
              </span>
            </div>
            
            <div className={`
              flex items-center justify-between p-1 rounded
              ${awayWon ? 'bg-green-100 font-semibold' : ''}
            `}>
              <span className={`truncate ${size === 'small' ? 'max-w-20' : 'max-w-32'}`} title={match.awayTeam.schoolName}>
                {match.awayTeam.schoolName}
              </span>
              <span className={`font-bold ${awayWon ? 'text-green-600' : ''}`}>
                {match.awayScore ?? '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 overflow-x-auto">
      <div className="min-w-4xl">
        <div className="grid grid-cols-7 gap-4 items-center">
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-center mb-2">Round of 16</h4>
            <div className="space-y-2">
              {roundOf16.slice(0, 4).map(match => (
                <BracketMatch key={match.id} match={match} size="small" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-center mb-2">Quarter Finals</h4>
            <div className="space-y-4">
              {quarterFinals.slice(0, 2).map(match => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-center mb-4">Semi Finals</h4>
            <div className="space-y-8">
              {semiFinals.slice(0,1).map(match => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-center mb-2 flex items-center justify-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                Final
              </h4>
              <BracketMatch match={final} size="large" highlight={true} />
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-center mb-2 flex items-center justify-center gap-1">
                <Medal className="w-4 h-4 text-orange-500" />
                3rd Place
              </h4>
              <BracketMatch match={thirdPlace} />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-center mb-4">Semi Finals</h4>
            <div className="space-y-8">
              {semiFinals.slice(1,2).map(match => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-center mb-2">Quarter Finals</h4>
            <div className="space-y-4">
              {quarterFinals.slice(2, 4).map(match => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-center mb-2">Round of 16</h4>
            <div className="space-y-2">
              {roundOf16.slice(4, 8).map(match => (
                <BracketMatch key={match.id} match={match} size="small" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded border"></div>
              <span>Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-50 rounded border"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded border"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded"></div>
              <span>TBD</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
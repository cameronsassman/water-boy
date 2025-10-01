import { MatchWithTeams } from '@/utils/tournament-logic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Trophy, Target, Award, Users } from 'lucide-react';

interface ScheduledMatch extends MatchWithTeams {
  day?: number;
  timeSlot?: string;
  arena?: 1 | 2;
}

interface MatchCardProps {
  match: ScheduledMatch;
  showPool?: boolean;
  size?: 'small' | 'normal' | 'large';
  showProgression?: boolean;
}

export default function MatchCard({ 
  match, 
  showPool = false, 
  size = 'normal',
  showProgression = false 
}: MatchCardProps) {
  const isCompleted = match?.completed || false;
  const homeScore = match?.homeScore;
  const awayScore = match?.awayScore;
  const homeTeam = match?.homeTeam;
  const awayTeam = match?.awayTeam;
  const stage = match?.stage || 'pool';
  const poolId = match?.poolId;
  const round = match?.round;
  
  const homeWon = homeScore !== undefined && awayScore !== undefined && homeScore > awayScore;
  const awayWon = homeScore !== undefined && awayScore !== undefined && awayScore > homeScore;
  const isDraw = homeScore !== undefined && awayScore !== undefined && homeScore === awayScore;
  
  const isPlaceholder = !homeTeam || !awayTeam || 
                       homeTeam.id === 'TBD' || awayTeam.id === 'TBD' ||
                       !homeTeam.schoolName || !awayTeam.schoolName;
  
  const isScheduled = match?.day && match?.timeSlot && match?.arena;
  
  const getStageInfo = () => {
    switch (stage) {
      case 'cup':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Trophy,
          label: getRoundLabel(round)
        };
      case 'plate':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Target,
          label: getRoundLabel(round)
        };
      case 'shield':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: Award,
          label: getRoundLabel(round)
        };
      case 'festival':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: Users,
          label: 'Festival'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Users,
          label: 'Pool'
        };
    }
  };

  const getRoundLabel = (round?: string): string => {
    if (!round) return stage === 'pool' ? 'Pool' : 'Match';
    
    const roundLabels: { [key: string]: string } = {
      'round-of-16': 'R16',
      'quarter-final': 'QF',
      'semi-final': 'SF',
      'final': 'Final',
      'third-place': '3rd',
      'plate-round-1': 'Plate R1',
      'plate-quarter-final': 'Plate QF',
      'plate-semi-final': 'Plate SF',
      'plate-final': 'Plate Final',
      'plate-third-place': 'Plate 3rd',
      'shield-semi-final': 'Shield SF',
      'shield-final': 'Shield Final',
      'shield-third-place': 'Shield 3rd'
    };
    return roundLabels[round] || round || 'Match';
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  if (!match) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="p-3 sm:p-4 text-center text-gray-500 text-sm">
          Invalid match data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`
      ${isCompleted ? 'bg-gray-50' : 'bg-white'} 
      ${isPlaceholder ? 'border-dashed border-gray-300' : ''}
      ${stage !== 'pool' ? `${stageInfo.borderColor} ${stageInfo.bgColor}` : ''}
      hover:shadow-md transition-shadow
      ${size === 'small' ? 'text-xs sm:text-sm' : size === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}
    `}>
      <CardContent className={`
        ${size === 'small' ? 'p-2 sm:p-3' : size === 'large' ? 'p-4 sm:p-6' : 'p-3 sm:p-4'}
      `}>
        {/* Header Section - Fixed overlapping */}
        <div className="flex flex-col gap-2 mb-3">
          {/* Top row - Stage, Pool, Arena badges */}
          <div className="flex items-center gap-1 flex-wrap min-h-6">
            {stage !== 'pool' && (
              <Badge variant="outline" className={`text-xs ${stageInfo.color} flex items-center gap-1 flex-shrink-0`}>
                <StageIcon className="w-3 h-3" />
                <span>{stageInfo.label}</span>
              </Badge>
            )}
            
            {showPool && poolId && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                Pool {poolId}
              </Badge>
            )}
            
            {match.arena && (
              <Badge variant="outline" className={`text-xs flex-shrink-0 ${match.arena === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                Arena {match.arena}
              </Badge>
            )}
            
            {isPlaceholder && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                TBD
              </Badge>
            )}
          </div>

          {/* Bottom row - Schedule and Status */}
          <div className="flex items-center justify-between gap-2">
            {isScheduled && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                <span className="hidden sm:inline">Day {match.day} - {match.timeSlot}</span>
                <span className="sm:hidden">D{match.day} {match.timeSlot}</span>
              </Badge>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span className="text-green-600">Completed</span>
                </>
              ) : isPlaceholder ? (
                <>
                  <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 hidden xs:inline">Awaiting Teams</span>
                  <span className="text-gray-400 xs:hidden">TBD</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Teams and Score Section - Fixed overlapping */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Home Team */}
          <div className="flex-1 min-w-0 text-center">
            <div className={`
              font-medium break-words line-clamp-2
              ${homeWon ? 'text-green-600 font-semibold' : ''}
              ${isPlaceholder ? 'text-gray-400' : ''}
              ${size === 'small' ? 'text-xs leading-tight' : 'text-sm leading-tight'}
            `}>
              {homeTeam?.schoolName || 'TBD'}
            </div>
            {!isPlaceholder && homeTeam && (
              <div className={`text-gray-500 mt-1 text-xs`}>
                {homeTeam.players?.length || 0} players
              </div>
            )}
          </div>
          
          {/* Score Box */}
          <div className={`
            px-3 py-2 mx-1 sm:mx-2 bg-gray-100 rounded-lg text-center flex-shrink-0
            ${size === 'small' ? 'min-w-14' : size === 'large' ? 'min-w-20 sm:min-w-24' : 'min-w-16'}
          `}>
            {isCompleted && !isPlaceholder ? (
              <div className={`font-bold ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'}`}>
                <span className={homeWon ? 'text-green-600' : awayWon ? 'text-red-600' : 'text-blue-600'}>
                  {homeScore}
                </span>
                <span className="text-gray-400 mx-1">-</span>
                <span className={awayWon ? 'text-green-600' : homeWon ? 'text-red-600' : 'text-blue-600'}>
                  {awayScore}
                </span>
              </div>
            ) : (
              <div className={`text-gray-500 font-medium ${size === 'large' ? 'text-base' : 'text-sm'}`}>
                {isPlaceholder ? 'TBD' : 'vs'}
              </div>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex-1 min-w-0 text-center">
            <div className={`
              font-medium break-words line-clamp-2
              ${awayWon ? 'text-green-600 font-semibold' : ''}
              ${isPlaceholder ? 'text-gray-400' : ''}
              ${size === 'small' ? 'text-xs leading-tight' : 'text-sm leading-tight'}
            `}>
              {awayTeam?.schoolName || 'TBD'}
            </div>
            {!isPlaceholder && awayTeam && (
              <div className={`text-gray-500 mt-1 text-xs`}>
                {awayTeam.players?.length || 0} players
              </div>
            )}
          </div>
        </div>

        {/* Progression Section */}
        {showProgression && stage !== 'pool' && stage !== 'festival' && isCompleted && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 text-xs text-gray-600">
              <span>Winner advances:</span>
              <span className="font-medium">
                {getNextRoundLabel(stage, round)}
              </span>
            </div>
            {stage === 'cup' && round === 'round-of-16' && (
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 text-xs text-gray-600 mt-1">
                <span>Loser advances:</span>
                <span className="font-medium text-blue-600">Plate R1</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getNextRoundLabel(stage: string, currentRound?: string): string {
  const progression: { [key: string]: string } = {
    'round-of-16': 'QF',
    'quarter-final': 'SF', 
    'semi-final': 'Final',
    'plate-round-1': 'Plate QF',
    'plate-quarter-final': 'Plate SF',
    'plate-semi-final': 'Plate Final',
    'shield-semi-final': 'Shield Final'
  };
  
  const key = currentRound || '';
  return progression[key] || 'Next Round';
}
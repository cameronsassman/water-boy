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
  const isCompleted = match.completed;
  const homeWon = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore;
  const awayWon = match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore;
  const isDraw = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore === match.awayScore;
  
  // Determine if teams are placeholder (TBD)
  const isPlaceholder = match.homeTeam.id === 'TBD' || match.awayTeam.id === 'TBD';
  
  // Check if this is a scheduled match with day/time info
  const isScheduled = match.day && match.timeSlot && match.arena;
  
  // Get stage-specific styling and icons
  const getStageInfo = () => {
    switch (match.stage) {
      case 'cup':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Trophy,
          label: getRoundLabel(match.round)
        };
      case 'plate':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Target,
          label: getRoundLabel(match.round)
        };
      case 'shield':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: Award,
          label: getRoundLabel(match.round)
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
    const roundLabels: { [key: string]: string } = {
      'round-of-16': 'Round of 16',
      'quarter-final': 'Quarter Final',
      'semi-final': 'Semi Final',
      'final': 'Final',
      'third-place': '3rd Place',
      'plate-round-1': 'Plate R1',
      'plate-quarter-final': 'Plate QF',
      'plate-semi-final': 'Plate SF',
      'plate-final': 'Plate Final',
      'plate-third-place': 'Plate 3rd',
      'shield-semi-final': 'Shield SF',
      'shield-final': 'Shield Final',
      'shield-third-place': 'Shield 3rd'
    };
    return roundLabels[round || ''] || round || 'Match';
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  return (
    <Card className={`
      ${isCompleted ? 'bg-gray-50' : 'bg-white'} 
      ${isPlaceholder ? 'border-dashed border-gray-300' : ''}
      ${match.stage !== 'pool' ? `${stageInfo.borderColor} ${stageInfo.bgColor}` : ''}
      hover:shadow-md transition-shadow
      ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : ''}
    `}>
      <CardContent className={`
        ${size === 'small' ? 'p-3' : size === 'large' ? 'p-6' : 'p-4'}
      `}>
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stage Badge */}
            {match.stage !== 'pool' && (
              <Badge variant="outline" className={`text-xs ${stageInfo.color}`}>
                <StageIcon className="w-3 h-3 mr-1" />
                {stageInfo.label}
              </Badge>
            )}
            
            {/* Pool Badge */}
            {showPool && match.poolId && (
              <Badge variant="outline" className="text-xs">
                Pool {match.poolId}
              </Badge>
            )}
            
            {/* Schedule Badge */}
            {isScheduled && (
              <Badge variant="secondary" className="text-xs">
                Day {match.day} - {match.timeSlot}
              </Badge>
            )}
            
            {/* Arena Badge */}
            {match.arena && (
              <Badge variant="outline" className={`text-xs ${match.arena === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                Arena {match.arena}
              </Badge>
            )}
            
            {/* Placeholder indicator */}
            {isPlaceholder && (
              <Badge variant="secondary" className="text-xs">
                TBD
              </Badge>
            )}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isCompleted ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Completed</span>
              </>
            ) : isPlaceholder ? (
              <>
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Awaiting Teams</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </>
            )}
          </div>
        </div>
        
        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className={`
              font-medium truncate
              ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}
              ${homeWon ? 'text-green-600 font-semibold' : ''}
              ${isPlaceholder ? 'text-gray-400' : ''}
            `} 
            title={match.homeTeam.schoolName}>
              {match.homeTeam.schoolName}
            </div>
            {!isPlaceholder && (
              <div className={`text-gray-500 mt-1 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
                {match.homeTeam.players.length} players
              </div>
            )}
          </div>
          
          {/* Score or VS */}
          <div className={`
            px-4 py-2 mx-2 bg-gray-100 rounded-lg text-center
            ${size === 'small' ? 'min-w-16 px-2' : size === 'large' ? 'min-w-28 px-6' : 'min-w-20'}
          `}>
            {isCompleted && !isPlaceholder ? (
              <div className={`font-bold ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg'}`}>
                <span className={homeWon ? 'text-green-600' : awayWon ? 'text-red-600' : 'text-blue-600'}>
                  {match.homeScore}
                </span>
                <span className="text-gray-400 mx-1">-</span>
                <span className={awayWon ? 'text-green-600' : homeWon ? 'text-red-600' : 'text-blue-600'}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <div className={`text-gray-500 font-medium ${size === 'large' ? 'text-lg' : ''}`}>
                {isPlaceholder ? 'TBD' : 'vs'}
              </div>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className={`
              font-medium truncate
              ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}
              ${awayWon ? 'text-green-600 font-semibold' : ''}
              ${isPlaceholder ? 'text-gray-400' : ''}
            `} 
            title={match.awayTeam.schoolName}>
              {match.awayTeam.schoolName}
            </div>
            {!isPlaceholder && (
              <div className={`text-gray-500 mt-1 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
                {match.awayTeam.players.length} players
              </div>
            )}
          </div>
        </div>

        {/* Match Progression Info */}
        {showProgression && match.stage !== 'pool' && match.stage !== 'festival' && isCompleted && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Winner advances to:</span>
              <span className="font-medium">
                {getNextRoundLabel(match.stage, match.round)}
              </span>
            </div>
            {match.stage === 'cup' && match.round === 'round-of-16' && (
              <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                <span>Loser advances to:</span>
                <span className="font-medium text-blue-600">Plate Round 1</span>
              </div>
            )}
          </div>
        )}

        {/* Draw indicator */}
        {isDraw && isCompleted && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Draw
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get next round label
function getNextRoundLabel(stage: string, currentRound?: string): string {
  const progression: { [key: string]: string } = {
    // Cup progression
    'cup-round-of-16': 'Quarter Final',
    'cup-quarter-final': 'Semi Final', 
    'cup-semi-final': 'Final',
    
    // Plate progression
    'plate-round-1': 'Plate Quarter Final',
    'plate-quarter-final': 'Plate Semi Final',
    'plate-semi-final': 'Plate Final',
    
    // Shield progression
    'shield-semi-final': 'Shield Final'
  };
  
  const key = `${stage}-${currentRound}`;
  return progression[key] || 'Next Round';
}
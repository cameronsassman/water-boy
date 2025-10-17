import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Trophy, Target, Award, Users } from 'lucide-react';
import { Team, Match } from '@/types/team';

// Define MatchWithTeams locally since it's not exported from tournament-logic
interface MatchWithTeams extends Match {
  homeTeam?: Team;
  awayTeam?: Team;
}

// Use intersection type instead of extending to avoid property conflicts
type ScheduledMatch = MatchWithTeams & {
  timeSlot?: string;
  arena?: 1 | 2;
};

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
  // Safe destructuring with fallbacks
  const isCompleted = match?.completed || false;
  const homeScore = match?.homeScore;
  const awayScore = match?.awayScore;
  const homeTeam = match?.homeTeam;
  const awayTeam = match?.awayTeam;
  const stage = match?.stage || 'group';
  const poolId = match?.poolId;
  const round = match?.round;
  const day = match?.day || 1; // Default to day 1 if undefined
  const timeSlot = match?.timeSlot;
  const arena = match?.arena;
  
  // Safe score comparisons
  const homeWon = homeScore !== undefined && awayScore !== undefined && homeScore > awayScore;
  const awayWon = homeScore !== undefined && awayScore !== undefined && awayScore > homeScore;
  const isDraw = homeScore !== undefined && awayScore !== undefined && homeScore === awayScore;
  
  // Safe placeholder check
  const isPlaceholder = !homeTeam || !awayTeam || 
                       homeTeam.id === 'TBD' || awayTeam.id === 'TBD' ||
                       !homeTeam.schoolName || !awayTeam.schoolName;
  
  const isScheduled = timeSlot && arena;

  const getStageInfo = () => {
    const baseInfo = {
      color: '',
      bgColor: '',
      borderColor: '',
      label: '',
      description: '',
      priority: 0
    };

    switch (stage) {
      case 'cup':
        return {
          ...baseInfo,
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          label: getRoundLabel(round),
          description: 'Championship Bracket',
          priority: 6
        };
      case 'plate':
        return {
          ...baseInfo,
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          label: getRoundLabel(round),
          description: 'Plate Competition',
          priority: 5
        };
      case 'shield':
        return {
          ...baseInfo,
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-300',
          label: getRoundLabel(round),
          description: 'Shield Competition',
          priority: 4
        };
      case 'festival':
        return {
          ...baseInfo,
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          label: getRoundLabel(round),
          description: 'Festival Games',
          priority: 3
        };
      case 'playoff':
        return {
          ...baseInfo,
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          label: getRoundLabel(round),
          description: 'Placement Playoffs',
          priority: 2
        };
      case 'pool':
      default:
        return {
          ...baseInfo,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          label: poolId ? `Pool ${poolId}` : 'Group Stage',
          description: 'Group Stage',
          priority: 1
        };
    }
  };

  const getRoundLabel = (round?: string): string => {
    if (!round) return stage === 'pool' ? 'Group' : 'Match';
    
    const roundLabels: { [key: string]: string } = {
      // Cup rounds
      'round-of-16': 'Round of 16',
      'quarter-final': 'Quarter Final',
      'semi-final': 'Semi Final',
      'final': 'Final',
      'third-place': '3rd Place',
      
      // Plate rounds
      'plate-semi-final': 'Plate Semi',
      'plate-final': 'Plate Final',
      'plate-third-place': 'Plate 3rd',
      
      // Shield rounds  
      'shield-quarter-final': 'Shield QF',
      'shield-semi-final': 'Shield Semi',
      'shield-final': 'Shield Final',
      'shield-third-place': 'Shield 3rd',
      
      // Playoff rounds
      'playoff-round-1': 'Playoff R1',
      '13th-14th': '13th/14th',
      '15th-16th': '15th/16th',
      
      // Festival tiers
      'festival-tier-one': 'Tier 1',
      'festival-tier-two': 'Tier 2', 
      'festival-tier-three': 'Tier 3',
      'festival-tier-four': 'Tier 4',
      
      // Friendly matches
      'friendly': 'Friendly',
      'exhibition': 'Exhibition'
    };
    
    return roundLabels[round] || round.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Match';
  };

  const stageInfo = getStageInfo();

  // Early return for invalid match
  if (!match) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="p-3 sm:p-4 text-center text-gray-500 text-sm">
          Invalid match data
        </CardContent>
      </Card>
    );
  }

  // Safe player count calculation
  const homePlayerCount = homeTeam?.players?.length || 0;
  const awayPlayerCount = awayTeam?.players?.length || 0;

  return (
    <Card className={`
      ${isCompleted ? 'bg-gray-50' : 'bg-white'} 
      ${isPlaceholder ? 'border-dashed border-gray-300' : 'border-gray-200'}
      ${stage !== 'group' ? `${stageInfo.borderColor} border-2` : 'border'}
      hover:shadow-md transition-shadow duration-200
      ${size === 'small' ? 'text-xs sm:text-sm' : size === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}
    `}>
      <CardContent className={`
        ${size === 'small' ? 'p-2 sm:p-3' : size === 'large' ? 'p-4 sm:p-6' : 'p-3 sm:p-4'}
      `}>
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-3">
          {/* Top row - Stage, Pool, Arena badges */}
          <div className="flex items-center gap-1 flex-wrap min-h-6">
            <Badge 
              variant="outline" 
              className={`
                text-xs flex items-center gap-1 flex-shrink-0
                ${stageInfo.color} border ${stageInfo.borderColor} ${stageInfo.bgColor}
              `}
            >
              <span>{stageInfo.label}</span>
            </Badge>
            
            {/* Only show pool badge if it's different from stage label */}
            {stage === 'pool' && poolId && (
              <Badge variant="outline" className="text-xs flex-shrink-0 border-gray-300 bg-white">
                Group {poolId}
              </Badge>
            )}
            
            {isPlaceholder && (
              <Badge variant="secondary" className="text-xs flex-shrink-0 bg-gray-100 text-gray-600">
                TBD
              </Badge>
            )}
          </div>
        </div>
        
        {/* Teams and Score Section */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Home Team */}
          <div className="flex-1 min-w-0 text-center">
            <div 
              className={`
                font-medium break-words line-clamp-2 mb-1
                ${homeWon ? 'text-green-600 font-semibold' : isPlaceholder ? 'text-gray-400' : 'text-gray-900'}
                ${size === 'small' ? 'text-xs leading-tight' : 'text-sm leading-tight'}
              `}
              title={homeTeam?.schoolName || 'TBD'}
            >
              {homeTeam?.schoolName || 'TBD'}
            </div>
          </div>
          
          {/* Score Box */}
          <div className={`
            px-3 py-2 mx-1 sm:mx-2 bg-gray-100 rounded-lg text-center flex-shrink-0
            ${size === 'small' ? 'min-w-14' : size === 'large' ? 'min-w-20 sm:min-w-24' : 'min-w-16'}
            ${isCompleted && !isPlaceholder ? 'bg-gray-200' : 'bg-gray-100'}
          `}>
            {isCompleted && !isPlaceholder ? (
              <div className={`font-bold ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'}`}>
                <span className={homeWon ? 'text-green-600' : awayWon ? 'text-red-600' : 'text-blue-600'}>
                  {homeScore ?? 0}
                </span>
                <span className="text-gray-400 mx-1">-</span>
                <span className={awayWon ? 'text-green-600' : homeWon ? 'text-red-600' : 'text-blue-600'}>
                  {awayScore ?? 0}
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
            <div 
              className={`
                font-medium break-words line-clamp-2 mb-1
                ${awayWon ? 'text-green-600 font-semibold' : isPlaceholder ? 'text-gray-400' : 'text-gray-900'}
                ${size === 'small' ? 'text-xs leading-tight' : 'text-sm leading-tight'}
              `}
              title={awayTeam?.schoolName || 'TBD'}
            >
              {awayTeam?.schoolName || 'TBD'}
            </div>
          </div>
        </div>
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
    'shield-semi-final': 'Shield Final',
    'final': 'Champion',
    'plate-final': 'Plate Champion',
    'shield-final': 'Shield Champion'
  };
  
  const key = currentRound || '';
  return progression[key] || 'Next Round';
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Save, X, CheckCircle, Loader2 } from 'lucide-react';

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
  players: Player[];
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  poolId?: string;
  stage: string;
  round?: string;
  day: number;
  timeSlot: string;
  arena: number;
  completed: boolean;
  homeScore?: number;
  awayScore?: number;
}

interface PlayerStats {
  playerId: string;
  capNumber: number;
  goals: number;
  kickOuts: number;
  yellowCards: number;
  redCards: number;
}

export default function ScoreInput() {
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeTeamStats, setHomeTeamStats] = useState<PlayerStats[]>([]);
  const [awayTeamStats, setAwayTeamStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadMatches();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 1024); // Tablet and mobile
  };

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/matches?completed=false');
      
      if (!response.ok) {
        throw new Error('Failed to load matches');
      }
      
      const matches: Match[] = await response.json();
      
      // Filter matches that have both teams loaded
      const validMatches = matches.filter(match => 
        match.homeTeam && 
        match.awayTeam && 
        match.homeTeam.players && 
        match.awayTeam.players
      );
      
      setAvailableMatches(validMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectMatch = async (match: Match) => {
    setSelectedMatch(match);
    setError(null);

    try {
      // Check if there's an existing result
      const response = await fetch(`/api/match-results?matchId=${match.id}`);
      
      if (response.ok) {
        const existingResult = await response.json();
        
        if (existingResult) {
          // Load existing player stats
          const statsResponse = await fetch(`/api/player-stats?matchResultId=${existingResult.id}`);
          
          if (statsResponse.ok) {
            const playerStats = await statsResponse.json();
            
            // Separate home and away team stats
            const homeStats: PlayerStats[] = [];
            const awayStats: PlayerStats[] = [];
            
            playerStats.forEach((stat: any) => {
              const playerStat: PlayerStats = {
                playerId: stat.playerId,
                capNumber: stat.capNumber,
                goals: stat.goals,
                kickOuts: stat.kickOuts,
                yellowCards: stat.yellowCards,
                redCards: stat.redCards
              };
              
              if (match.homeTeam.players.some(p => p.id === stat.playerId)) {
                homeStats.push(playerStat);
              } else {
                awayStats.push(playerStat);
              }
            });
            
            setHomeTeamStats(homeStats);
            setAwayTeamStats(awayStats);
            return;
          }
        }
      }
      
      // Initialize new stats if no existing result
      const homeStats = match.homeTeam.players.map(player => ({
        playerId: player.id,
        capNumber: player.capNumber,
        goals: 0,
        kickOuts: 0,
        yellowCards: 0,
        redCards: 0
      }));

      const awayStats = match.awayTeam.players.map(player => ({
        playerId: player.id,
        capNumber: player.capNumber,
        goals: 0,
        kickOuts: 0,
        yellowCards: 0,
        redCards: 0
      }));

      setHomeTeamStats(homeStats);
      setAwayTeamStats(awayStats);
      
    } catch (error) {
      console.error('Error loading match result:', error);
      setError('Failed to load match data. Please try again.');
    }
  };

  const updatePlayerStat = (
    teamType: 'home' | 'away',
    playerId: string,
    statType: keyof Omit<PlayerStats, 'playerId' | 'capNumber'>,
    value: number
  ) => {
    const updater = teamType === 'home' ? setHomeTeamStats : setAwayTeamStats;
    const currentStats = teamType === 'home' ? homeTeamStats : awayTeamStats;

    updater(currentStats.map(stat =>
      stat.playerId === playerId
        ? { ...stat, [statType]: Math.max(0, value) }
        : stat
    ));
  };

  const calculateTeamScore = (teamStats: PlayerStats[]): number => {
    return teamStats.reduce((total, player) => total + player.goals, 0);
  };

  const saveMatchResult = async () => {
    if (!selectedMatch) return;

    setIsSaving(true);
    setError(null);

    try {
      const homeScore = calculateTeamScore(homeTeamStats);
      const awayScore = calculateTeamScore(awayTeamStats);

      // Create match result
      const resultResponse = await fetch('/api/match-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          homeTeamId: selectedMatch.homeTeamId,
          awayTeamId: selectedMatch.awayTeamId,
          homeScore,
          awayScore,
          completed: true
        }),
      });

      if (!resultResponse.ok) {
        const errorData = await resultResponse.json();
        throw new Error(errorData.error || 'Failed to save match result');
      }

      const matchResult = await resultResponse.json();

      // Save player stats
      const allStats = [...homeTeamStats, ...awayTeamStats];
      
      for (const stat of allStats) {
        const statResponse = await fetch('/api/player-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchResultId: matchResult.id,
            playerId: stat.playerId,
            capNumber: stat.capNumber,
            goals: stat.goals,
            kickOuts: stat.kickOuts,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards
          }),
        });

        if (!statResponse.ok) {
          const errorData = await statResponse.json();
          throw new Error(errorData.error || 'Failed to save player stats');
        }
      }

      // Update match completion status
      const matchResponse = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          homeScore,
          awayScore
        }),
      });

      if (!matchResponse.ok) {
        const errorData = await matchResponse.json();
        throw new Error(errorData.error || 'Failed to update match status');
      }

      // Reload matches
      await loadMatches();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error: any) {
      console.error('Error saving match result:', error);
      setError(error.message || 'Failed to save match result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMatch = () => {
    setSelectedMatch(null);
    setHomeTeamStats([]);
    setAwayTeamStats([]);
    setError(null);
  };

  const renderPlayerTable = (
    players: Player[],
    statsArr: PlayerStats[],
    team: "home" | "away"
  ) => {
    const statTypes = ["goals", "kickOuts", "yellowCards", "redCards"] as const;
    const teamColor = team === "home" ? "from-blue-500 to-blue-600" : "from-emerald-500 to-emerald-600";
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-2 font-semibold text-gray-700 sticky top-0 bg-gray-50 text-left w-[30%] min-w-[120px]">
                Player
              </th>
              <th className="py-3 px-1 font-semibold text-gray-700 text-center sticky top-0 bg-gray-50 w-[17.5%]">
                Goals
              </th>
              <th className="py-3 px-1 font-semibold text-gray-700 text-center sticky top-0 bg-gray-50 w-[17.5%]">
                Fouls
              </th>
              <th className="py-3 px-1 font-semibold text-gray-700 text-center sticky top-0 bg-gray-50 w-[17.5%]">
                Yellow
              </th>
              <th className="py-3 px-1 font-semibold text-gray-700 text-center sticky top-0 bg-gray-50 w-[17.5%]">
                Red
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player) => {
              const stats = statsArr.find((s) => s.playerId === player.id);
              if (!stats) return null;
  
              return (
                <tr
                  key={player.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-2 text-left">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 bg-gradient-to-br ${teamColor}`}
                      >
                        {player.capNumber}
                      </div>
                      {!isMobile && (
                        <span className="font-medium text-gray-900 truncate text-xs">
                          {player.name}
                        </span>
                      )}
                    </div>
                  </td>
  
                  {statTypes.map((statType) => (
                    <td
                      key={statType}
                      className="py-2 px-1 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            updatePlayerStat(
                              team,
                              player.id,
                              statType,
                              stats[statType] - 1
                            )
                          }
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-600 font-bold transition-colors flex-shrink-0 text-xs"
                        >
                          −
                        </button>
  
                        <span className="w-6 text-center font-semibold text-gray-900 text-sm">
                          {stats[statType]}
                        </span>
  
                        <button
                          onClick={() =>
                            updatePlayerStat(
                              team,
                              player.id,
                              statType,
                              stats[statType] + 1
                            )
                          }
                          className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold transition-all shadow-sm hover:shadow flex-shrink-0 text-xs
                            ${
                              statType === "goals"
                                ? `bg-gradient-to-br ${teamColor} hover:brightness-110`
                                : statType === "kickOuts"
                                ? "bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
                                : statType === "yellowCards"
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900"
                                : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            }`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  if (!selectedMatch) {
    return (
      <div className="w-full p-0">
        <div className="mb-6 p-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-blue-600" />
            Match Scorecard
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Select a match to enter scores and player statistics
          </p>
        </div>

        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {availableMatches.length === 0 ? (
          <div className="mx-4">
            <Card>
              <CardContent className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-semibold mb-1">No Pending Matches Available</h3>
                <p className="text-gray-600 text-sm">
                  Either all matches are completed, or no fixtures have been created yet.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4">
            {availableMatches.map(match => (
              <Card key={match.id} className="hover:shadow-md cursor-pointer transition-shadow" onClick={() => selectMatch(match)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {match.stage === 'pool'
                        ? `Pool ${match.poolId}`
                        : match.round
                          ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}`
                          : match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Pending
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-xs truncate">{match.homeTeam.schoolName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-xs truncate">{match.awayTeam.schoolName}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Day {match.day} • {match.timeSlot} • Arena {match.arena}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const homeScore = calculateTeamScore(homeTeamStats);
  const awayScore = calculateTeamScore(awayTeamStats);

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header with match info */}
      <div className="w-full px-0 pt-0 pb-2 flex-shrink-0">
        <div className="bg-white rounded-none shadow-sm border-b border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">HOME</div>
              <div className="font-semibold text-gray-900 text-sm truncate">
                {selectedMatch.homeTeam.schoolName}
              </div>
            </div>

            <div className="text-center">
              <div className="flex justify-center items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{homeScore}</div>
                <div className="text-xl font-light text-gray-400">-</div>
                <div className="text-2xl font-bold text-emerald-600">{awayScore}</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">AWAY</div>
              <div className="font-semibold text-gray-900 text-sm truncate">
                {selectedMatch.awayTeam.schoolName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="w-full px-0 pb-1 flex-shrink-0">
          <div className="mx-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            {error}
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="w-full px-0 pb-1 flex-shrink-0">
          <div className="mx-4 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            <span>Match result saved successfully</span>
          </div>
        </div>
      )}

      {/* Teams Scorecards */}
      <div className="w-full grid grid-cols-2 gap-0 flex-1 px-0 pb-0 min-h-0">
        {/* Home Team */}
        <div className="flex flex-col bg-white rounded-none shadow-sm border-r border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 px-3 flex-shrink-0">
            <div className="text-xs font-medium opacity-90">Home Team</div>
            <div className="text-sm font-bold truncate">{selectedMatch.homeTeam.schoolName}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPlayerTable(selectedMatch.homeTeam.players, homeTeamStats, 'home')}
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs space-y-1 flex-shrink-0">
            <p className="text-gray-600 truncate"><span className="font-medium text-gray-700">Coach:</span> {selectedMatch.homeTeam.coachName || 'N/A'}</p>
            <p className="text-gray-600 truncate"><span className="font-medium text-gray-700">Manager:</span> {selectedMatch.homeTeam.managerName || 'N/A'}</p>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col bg-white rounded-none shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-2 px-3 flex-shrink-0">
            <div className="text-xs font-medium opacity-90">Away Team</div>
            <div className="text-sm font-bold truncate">{selectedMatch.awayTeam.schoolName}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPlayerTable(selectedMatch.awayTeam.players, awayTeamStats, 'away')}
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs space-y-1 flex-shrink-0">
            <p className="text-gray-600 truncate"><span className="font-medium text-gray-700">Coach:</span> {selectedMatch.awayTeam.coachName || 'N/A'}</p>
            <p className="text-gray-600 truncate"><span className="font-medium text-gray-700">Manager:</span> {selectedMatch.awayTeam.managerName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button 
          onClick={clearMatch} 
          variant="outline" 
          size="sm"
          className="shadow-lg hover:shadow-xl transition-shadow bg-white text-xs"
        >
          <X className="w-3 h-3 mr-1" /> Back
        </Button>
        <Button 
          onClick={saveMatchResult} 
          disabled={isSaving} 
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all text-xs"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Save className="w-3 h-3 mr-1" />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
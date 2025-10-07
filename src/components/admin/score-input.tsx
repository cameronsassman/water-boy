import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { MatchResult } from '@/types/match';
import { PlayerStats } from '@/types/player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Save, X, CheckCircle } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  capNumber: number;
}

export default function ScoreInput() {
  const [availableMatches, setAvailableMatches] = useState<MatchWithTeams[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [homeTeamStats, setHomeTeamStats] = useState<PlayerStats[]>([]);
  const [awayTeamStats, setAwayTeamStats] = useState<PlayerStats[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = () => {
    try {
      const tournament = storageUtils.getTournament();
      const allMatches = tournament.matches;
      const matchesWithTeams = allMatches.map(match => tournamentUtils.getMatchWithTeams(match));
      // Filter out matches without valid teams and incomplete matches
      setAvailableMatches(matchesWithTeams.filter(m => 
        !m.completed && 
        m.homeTeam && 
        m.awayTeam && 
        m.homeTeam.id !== 'TBD' && 
        m.awayTeam.id !== 'TBD'
      ));
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const selectMatch = (match: MatchWithTeams) => {
    setSelectedMatch(match);

    const existingResult = storageUtils.getMatchResult(match.id);

    if (existingResult) {
      setHomeTeamStats(existingResult.homeTeamStats);
      setAwayTeamStats(existingResult.awayTeamStats);
    } else {
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

    try {
      const homeScore = calculateTeamScore(homeTeamStats);
      const awayScore = calculateTeamScore(awayTeamStats);

      const result: MatchResult = {
        matchId: selectedMatch.id,
        homeScore,
        awayScore,
        homeTeamStats,
        awayTeamStats,
        completed: true,
        completedAt: new Date().toISOString()
      };

      storageUtils.saveMatchResult(result);

      if (['cup', 'plate', 'shield'].includes(selectedMatch.stage)) {
        tournamentUtils.updateKnockoutProgression(selectedMatch.id);
      }

      loadMatches();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving match result:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearMatch = () => {
    setSelectedMatch(null);
    setHomeTeamStats([]);
    setAwayTeamStats([]);
  };

  const renderPlayerTable = (
    players: Player[],
    statsArr: PlayerStats[],
    team: "home" | "away"
  ) => {
    const statTypes = ["goals", "kickOuts", "yellowCards", "redCards"] as const;
    
    return (
      <div className="overflow-x-hidden">
        <table className="w-full text-sm" dir={team === "home" ? "rtl" : "ltr"}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={`py-3 px-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 w-1/4 ${team === "home" ? "text-right" : "text-left"}`}>
                Player
              </th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-center w-3/16 sticky top-0 bg-gray-50">
                Goals
              </th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-center w-3/16 sticky top-0 bg-gray-50">
                Fouls
              </th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-center w-3/16 sticky top-0 bg-gray-50">
                Yellow
              </th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-center w-3/16 sticky top-0 bg-gray-50">
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${
                          team === "home"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600"
                            : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                        }`}
                      >
                        {player.capNumber}
                      </div>
                      <span className="font-medium text-gray-900 truncate">{player.name}</span>
                    </div>
                  </td>
  
                  {statTypes.map((statType) => (
                    <td
                      key={statType}
                      className="py-3 px-4 text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            updatePlayerStat(
                              team,
                              player.id,
                              statType,
                              stats[statType] - 1
                            )
                          }
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-600 font-bold transition-colors flex-shrink-0"
                        >
                          −
                        </button>
  
                        <span className="w-8 text-center font-semibold text-gray-900 text-base">
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
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold transition-all shadow-sm hover:shadow flex-shrink-0
                            ${
                              statType === "goals"
                                ? team === "home"
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
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

  if (!selectedMatch) {
    return (
      <div className="w-full p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="text-blue-600" />
            Match Scorecard
          </h1>
          <p className="text-gray-600 mt-2">
            Select a match to enter scores and player statistics
          </p>
        </div>

        {availableMatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Pending Matches Available</h3>
              <p className="text-gray-600">
                Either all matches are completed, or pool fixtures/knockout brackets need to be generated.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableMatches.map(match => (
              <Card key={match.id} className="hover:shadow-md cursor-pointer transition-shadow" onClick={() => selectMatch(match)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {match.stage === 'pool'
                        ? `Pool ${match.poolId}`
                        : match.round
                          ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}`
                          : match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
                    </Badge>
                    {match.completed ? (
                      <Badge className="text-xs bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm truncate">{match.homeTeam.schoolName}</span>
                      {match.completed && <span className="font-bold">{match.homeScore}</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm truncate">{match.awayTeam.schoolName}</span>
                      {match.completed && <span className="font-bold">{match.awayScore}</span>}
                    </div>
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
      <div className="w-full px-4 pt-4 pb-3 flex-shrink-0">
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-1">HOME</div>
                <div className="font-semibold text-gray-900 text-base truncate">
                  {selectedMatch.homeTeam?.schoolName || "Home Team"}
                </div>
              </div>

              <div className="text-center">
                <div className="flex justify-center items-center gap-3">
                  <div className="text-4xl font-bold text-blue-600">{homeScore}</div>
                  <div className="text-2xl font-light text-gray-400">-</div>
                  <div className="text-4xl font-bold text-emerald-600">{awayScore}</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-1">AWAY</div>
                <div className="font-semibold text-gray-900 text-base truncate">
                  {selectedMatch.awayTeam?.schoolName || "Away Team"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="w-full px-4 pb-2 flex-shrink-0">
          <div className="w-full">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Match result saved successfully</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full grid grid-cols-2 gap-4 flex-1 px-4 pb-4 min-h-0">
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-3 px-4 flex-shrink-0">
            <div className="text-sm font-medium opacity-90">Home Team</div>
            <div className="text-lg font-bold">{selectedMatch.homeTeam.schoolName}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPlayerTable(selectedMatch.homeTeam.players, homeTeamStats, 'home')}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm space-y-1 flex-shrink-0">
            <p className="text-gray-600"><span className="font-medium text-gray-700">Coach:</span> {selectedMatch.homeTeam.coachName || 'N/A'}</p>
            <p className="text-gray-600"><span className="font-medium text-gray-700">Manager:</span> {selectedMatch.homeTeam.managerName || 'N/A'}</p>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-3 px-4 flex-shrink-0">
            <div className="text-sm font-medium opacity-90">Away Team</div>
            <div className="text-lg font-bold">{selectedMatch.awayTeam.schoolName}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPlayerTable(selectedMatch.awayTeam.players, awayTeamStats, 'away')}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm space-y-1 flex-shrink-0">
            <p className="text-gray-600"><span className="font-medium text-gray-700">Coach:</span> {selectedMatch.awayTeam.coachName || 'N/A'}</p>
            <p className="text-gray-600"><span className="font-medium text-gray-700">Manager:</span> {selectedMatch.awayTeam.managerName || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex gap-3">
        <Button 
          onClick={clearMatch} 
          variant="outline" 
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow bg-white"
        >
          <X className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button 
          onClick={saveMatchResult} 
          disabled={isSaving} 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all"
        >
          <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Result'}
        </Button>
      </div>
    </div>
  );
}
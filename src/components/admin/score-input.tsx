import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { MatchResult } from '@/types/match';
import { PlayerStats } from '@/types/player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Save, X, CheckCircle } from 'lucide-react';

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
      setAvailableMatches(matchesWithTeams.filter(m => !m.completed));
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

  if (!selectedMatch) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMatches.map(match => (
              <Card key={match.id} className="hover:shadow-md cursor-pointer transition-shadow" onClick={() => selectMatch(match)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {match.stage === 'pool' ? `Pool ${match.poolId}` : match.round ? `${match.stage.charAt(0).toUpperCase() + match.stage.slice(1)} ${match.round}` : match.stage.charAt(0).toUpperCase() + match.stage.slice(1)}
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Match Scorecard</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedMatch.stage === 'pool' ? `Pool ${selectedMatch.poolId}` : selectedMatch.round ? `${selectedMatch.stage.charAt(0).toUpperCase() + selectedMatch.stage.slice(1)} - ${selectedMatch.round}` : selectedMatch.stage.charAt(0).toUpperCase() + selectedMatch.stage.slice(1)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={clearMatch} variant="outline" size="sm">
              <X className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button onClick={saveMatchResult} disabled={isSaving} size="sm" className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Result'}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            ✅ Match result saved successfully!
          </div>
        )}

        {/* Score Display */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-center gap-12">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">{selectedMatch.homeTeam.schoolName}</div>
              <div className="text-6xl font-bold">{homeScore}</div>
            </div>
            <div className="text-3xl font-light">-</div>
            <div className="text-center">
              <div className="text-lg font-medium mb-2">{selectedMatch.awayTeam.schoolName}</div>
              <div className="text-6xl font-bold">{awayScore}</div>
            </div>
          </div>
        </div>

        {/* Teams Side by Side */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Home Team */}
          <div className="bg-white rounded-lg shadow">
            {/* School Name */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-center">{selectedMatch.homeTeam.schoolName}</h2>
            </div>
            
            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-medium">Player</th>
                    <th className="text-center p-3 font-medium">Goals</th>
                    <th className="text-center p-3 font-medium">Fouls</th>
                    <th className="text-center p-3 font-medium">Yellow</th>
                    <th className="text-center p-3 font-medium">Red</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMatch.homeTeam.players.map((player) => {
                    const stats = homeTeamStats.find(s => s.playerId === player.id);
                    if (!stats) return null;
                    
                    return (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {player.capNumber}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.goals}
                            onChange={(e) => updatePlayerStat('home', player.id, 'goals', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.kickOuts}
                            onChange={(e) => updatePlayerStat('home', player.id, 'kickOuts', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.yellowCards}
                            onChange={(e) => updatePlayerStat('home', player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.redCards}
                            onChange={(e) => updatePlayerStat('home', player.id, 'redCards', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Coach and Manager */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Coach:</span> {selectedMatch.homeTeam.coachName || 'N/A'}</p>
                <p><span className="font-semibold">Manager:</span> {selectedMatch.homeTeam.managerName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="bg-white rounded-lg shadow">
            {/* School Name */}
            <div className="bg-green-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-center">{selectedMatch.awayTeam.schoolName}</h2>
            </div>
            
            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-medium">Player</th>
                    <th className="text-center p-3 font-medium">Goals</th>
                    <th className="text-center p-3 font-medium">Fouls</th>
                    <th className="text-center p-3 font-medium">Yellow</th>
                    <th className="text-center p-3 font-medium">Red</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMatch.awayTeam.players.map((player) => {
                    const stats = awayTeamStats.find(s => s.playerId === player.id);
                    if (!stats) return null;
                    
                    return (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {player.capNumber}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.goals}
                            onChange={(e) => updatePlayerStat('away', player.id, 'goals', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.kickOuts}
                            onChange={(e) => updatePlayerStat('away', player.id, 'kickOuts', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.yellowCards}
                            onChange={(e) => updatePlayerStat('away', player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={stats.redCards}
                            onChange={(e) => updatePlayerStat('away', player.id, 'redCards', parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Coach and Manager */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Coach:</span> {selectedMatch.awayTeam.coachName || 'N/A'}</p>
                <p><span className="font-semibold">Manager:</span> {selectedMatch.awayTeam.managerName || 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { MatchResult } from '@/types/match';
import { PlayerStats } from '@/types/player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Target, AlertTriangle, Save, X, Plus, Minus, CheckCircle } from 'lucide-react';

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
      const allMatches = tournamentUtils.getAllPoolMatches();
      const matchesWithTeams = allMatches.map(match => tournamentUtils.getMatchWithTeams(match));
      setAvailableMatches(matchesWithTeams);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const selectMatch = (match: MatchWithTeams) => {
    setSelectedMatch(match);
    
    // Load existing result if available
    const existingResult = storageUtils.getMatchResult(match.id);
    
    if (existingResult) {
      setHomeTeamStats(existingResult.homeTeamStats);
      setAwayTeamStats(existingResult.awayTeamStats);
    } else {
      // Initialize empty stats for all players
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

  const incrementStat = (
    teamType: 'home' | 'away',
    playerId: string,
    statType: keyof Omit<PlayerStats, 'playerId' | 'capNumber'>
  ) => {
    const currentStats = teamType === 'home' ? homeTeamStats : awayTeamStats;
    const currentValue = currentStats.find(s => s.playerId === playerId)?.[statType] || 0;
    updatePlayerStat(teamType, playerId, statType, currentValue + 1);
  };

  const decrementStat = (
    teamType: 'home' | 'away',
    playerId: string,
    statType: keyof Omit<PlayerStats, 'playerId' | 'capNumber'>
  ) => {
    const currentStats = teamType === 'home' ? homeTeamStats : awayTeamStats;
    const currentValue = currentStats.find(s => s.playerId === playerId)?.[statType] || 0;
    updatePlayerStat(teamType, playerId, statType, Math.max(0, currentValue - 1));
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
      
      // Reload matches to show updated status
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

  const renderPlayerStatsRow = (
    player: any,
    stats: PlayerStats,
    teamType: 'home' | 'away'
  ) => {
    return (
      <tr key={player.id} className="border-b hover:bg-gray-50">
        <td className="p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs">
              {player.capNumber}
            </Badge>
            <span className="font-medium text-sm">{player.name}</span>
          </div>
        </td>
        
        {/* Goals */}
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => decrementStat(teamType, player.id, 'goals')}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min="0"
              value={stats.goals}
              onChange={(e) => updatePlayerStat(teamType, player.id, 'goals', parseInt(e.target.value) || 0)}
              className="w-12 text-center p-1 h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => incrementStat(teamType, player.id, 'goals')}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </td>
        
        {/* Kick-outs */}
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => decrementStat(teamType, player.id, 'kickOuts')}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min="0"
              value={stats.kickOuts}
              onChange={(e) => updatePlayerStat(teamType, player.id, 'kickOuts', parseInt(e.target.value) || 0)}
              className="w-12 text-center p-1 h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => incrementStat(teamType, player.id, 'kickOuts')}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </td>
        
        {/* Yellow Cards */}
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => decrementStat(teamType, player.id, 'yellowCards')}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min="0"
              value={stats.yellowCards}
              onChange={(e) => updatePlayerStat(teamType, player.id, 'yellowCards', parseInt(e.target.value) || 0)}
              className="w-12 text-center p-1 h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => incrementStat(teamType, player.id, 'yellowCards')}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </td>
        
        {/* Red Cards */}
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => decrementStat(teamType, player.id, 'redCards')}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min="0"
              value={stats.redCards}
              onChange={(e) => updatePlayerStat(teamType, player.id, 'redCards', parseInt(e.target.value) || 0)}
              className="w-12 text-center p-1 h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-6 h-6 p-0"
              onClick={() => incrementStat(teamType, player.id, 'redCards')}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
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
              <h3 className="text-xl font-semibold mb-2">No Matches Available</h3>
              <p className="text-gray-600">
                Pool fixtures need to be generated before scorecards can be entered.
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
                      Pool {match.poolId}
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="text-blue-600" />
              Match Scorecard
            </h1>
            <p className="text-gray-600 mt-2">
              Pool {selectedMatch.poolId} • {selectedMatch.homeTeam.schoolName} vs {selectedMatch.awayTeam.schoolName}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={clearMatch}
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Back to Matches
            </Button>
            
            <Button
              onClick={saveMatchResult}
              disabled={isSaving}
              className="min-w-32"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Result
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ Match result saved successfully!
        </div>
      )}

      {/* Score Display */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{selectedMatch.homeTeam.schoolName}</div>
              <div className="text-5xl font-bold text-blue-600">{homeScore}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xl mb-4">vs</div>
              <Badge variant="outline">Pool {selectedMatch.poolId}</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{selectedMatch.awayTeam.schoolName}</div>
              <div className="text-5xl font-bold text-green-600">{awayScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Stats Tabs */}
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="home">{selectedMatch.homeTeam.schoolName}</TabsTrigger>
          <TabsTrigger value="away">{selectedMatch.awayTeam.schoolName}</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedMatch.homeTeam.schoolName} Player Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Player</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Goals</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Kick-outs</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Yellow</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMatch.homeTeam.players.map(player => {
                      const stats = homeTeamStats.find(s => s.playerId === player.id);
                      return stats ? renderPlayerStatsRow(player, stats, 'home') : null;
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="away" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedMatch.awayTeam.schoolName} Player Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Player</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Goals</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Kick-outs</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Yellow</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMatch.awayTeam.players.map(player => {
                      const stats = awayTeamStats.find(s => s.playerId === player.id);
                      return stats ? renderPlayerStatsRow(player, stats, 'away') : null;
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
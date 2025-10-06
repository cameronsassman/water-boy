"use client";

import { useState, useEffect } from 'react';
import { storageUtils } from '@/utils/storage';
import { tournamentUtils, MatchWithTeams, TeamStanding } from '@/utils/tournament-logic';
import { Team } from '@/types/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  ArrowLeft,
  Search,
  Filter,
  Waves,
} from 'lucide-react';

interface TeamStats {
  team: Team;
  standing: TeamStanding;
  matches: MatchWithTeams[];
  playerStats: { [playerId: string]: AggregatedPlayerStats };
}

interface AggregatedPlayerStats {
  playerId: string;
  name: string;
  capNumber: number;
  matchesPlayed: number;
  totalGoals: number;
  totalKickOuts: number;
  totalYellowCards: number;
  totalRedCards: number;
  goalsPerMatch: number;
  disciplinaryPoints: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'goals' | 'played'>('name');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = () => {
    const allTeams = storageUtils.getTeams();
    setTeams(allTeams);
  };

  const loadTeamStats = async (team: Team) => {
    try {
      const standing = team.poolId
        ? tournamentUtils.getPoolStandings(team.poolId).find((s) => s.team.id === team.id)
        : null;

      const allMatches = storageUtils.getTournament().matches;
      const teamMatches = allMatches
        .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
        .map((match) => tournamentUtils.getMatchWithTeams(match));

      const playerStats: { [playerId: string]: AggregatedPlayerStats } = {};

      team.players.forEach((player) => {
        playerStats[player.id] = {
          playerId: player.id,
          name: player.name,
          capNumber: player.capNumber,
          matchesPlayed: 0,
          totalGoals: 0,
          totalKickOuts: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          goalsPerMatch: 0,
          disciplinaryPoints: 0,
        };
      });

      teamMatches.forEach((match) => {
        if (match.completed) {
          const matchResult = storageUtils.getMatchResult(match.id);
          if (matchResult) {
            const isHome = match.homeTeam.id === team.id;
            const teamMatchStats = isHome ? matchResult.homeTeamStats : matchResult.awayTeamStats;

            teamMatchStats.forEach((stat) => {
              if (playerStats[stat.playerId]) {
                const player = playerStats[stat.playerId];
                player.matchesPlayed += 1;
                player.totalGoals += stat.goals;
                player.totalKickOuts += stat.kickOuts;
                player.totalYellowCards += stat.yellowCards;
                player.totalRedCards += stat.redCards;
                player.disciplinaryPoints += stat.yellowCards * 1 + stat.redCards * 3;
                player.goalsPerMatch =
                  player.matchesPlayed > 0 ? player.totalGoals / player.matchesPlayed : 0;
              }
            });
          }
        }
      });

      setTeamStats({
        team,
        standing:
          standing || {
            team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          },
        matches: teamMatches,
        playerStats,
      });
    } catch (error) {
      console.error('Error loading team stats:', error);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.coachName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPool = filterPool === 'all' || team.poolId === filterPool;
    return matchesSearch && matchesPool;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.schoolName.localeCompare(b.schoolName);
      case 'points':
        const aStanding = a.poolId
          ? tournamentUtils.getPoolStandings(a.poolId).find((s) => s.team.id === a.id)
          : null;
        const bStanding = b.poolId
          ? tournamentUtils.getPoolStandings(b.poolId).find((s) => s.team.id === b.id)
          : null;
        return (bStanding?.points || 0) - (aStanding?.points || 0);
      case 'goals':
        const aGoals = a.poolId
          ? tournamentUtils.getPoolStandings(a.poolId).find((s) => s.team.id === a.id)?.goalsFor || 0
          : 0;
        const bGoals = b.poolId
          ? tournamentUtils.getPoolStandings(b.poolId).find((s) => s.team.id === b.id)?.goalsFor || 0
          : 0;
        return bGoals - aGoals;
      case 'played':
        const aPlayed = a.poolId
          ? tournamentUtils.getPoolStandings(a.poolId).find((s) => s.team.id === a.id)?.played || 0
          : 0;
        const bPlayed = b.poolId
          ? tournamentUtils.getPoolStandings(b.poolId).find((s) => s.team.id === b.id)?.played || 0
          : 0;
        return bPlayed - aPlayed;
      default:
        return 0;
    }
  });

  if (selectedTeam && teamStats) {
    const completedMatches = teamStats.matches.filter((m) => m.completed);
    const upcomingMatches = teamStats.matches.filter((m) => !m.completed);

    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Team Header with Water Theme */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => setSelectedTeam(null)} 
              variant="outline" 
              size="sm"
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Teams
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Water wave decoration */}
            <div className="absolute bottom-0 right-0 opacity-20">
              <Waves className="w-32 h-32" />
            </div>
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{teamStats.team.schoolName}</h1>
                  <div className="flex flex-wrap gap-4 text-blue-100 text-sm">
                    <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                      Coach: {teamStats.team.coachName}
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                      Manager: {teamStats.team.managerName}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {teamStats.team.poolId && (
                  <Badge className="bg-yellow-400 text-blue-800 border-0 text-sm px-3 py-1 font-bold">
                    Pool {teamStats.team.poolId}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats Tabs */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2 bg-blue-100 p-1 rounded-xl border border-blue-200">
            <TabsTrigger 
              value="players" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              Player Stats
            </TabsTrigger>
            <TabsTrigger 
              value="matches"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              Match History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-6">
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="border-b border-blue-200 bg-white/50">
                <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                  Player Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-500 text-white">
                        <th className="p-4 text-left font-bold">Player</th>
                        <th className="p-4 text-center font-bold">Goals</th>
                        <th className="p-4 text-center font-bold">Kick-outs</th>
                        <th className="p-4 text-center font-bold">Yellow</th>
                        <th className="p-4 text-center font-bold">Red</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(teamStats.playerStats).map((player, index) => (
                        <tr 
                          key={player.playerId} 
                          className={`border-b border-blue-100 hover:bg-blue-100/50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white shadow">
                                {player.capNumber}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900">{player.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm border border-blue-200">
                              {player.totalGoals}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-700 font-bold">
                              {player.totalKickOuts}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {/* Always show yellow cards, even if 0 */}
                            <span className={`font-bold px-2 py-1 rounded text-sm border ${
                              player.totalYellowCards > 0 
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {player.totalYellowCards}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {/* Always show red cards, even if 0 */}
                            <span className={`font-bold px-2 py-1 rounded text-sm border ${
                              player.totalRedCards > 0 
                                ? 'bg-red-100 text-red-700 border-red-200' 
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {player.totalRedCards}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Completed Matches */}
              {completedMatches.length > 0 && (
                <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="border-b border-green-200 bg-white/50">
                    <CardTitle className="flex items-center gap-3">
                      Match Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {completedMatches.map((match) => {
                      const homeScore = match.homeScore ?? 0;
                      const awayScore = match.awayScore ?? 0;
                      // Determine opponent and if the selected team is home or away
                      const isHomeTeam = match.homeTeam.id === selectedTeam.id;
                      const opponent = isHomeTeam ? match.awayTeam : match.homeTeam;
                      const teamScore = isHomeTeam ? homeScore : awayScore;
                      const opponentScore = isHomeTeam ? awayScore : homeScore;

                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-white border-2 border-green-200 rounded-xl hover:bg-green-100 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="font-bold text-gray-800 block">
                                vs {opponent.schoolName}
                              </span>
                              <span className="text-xs text-gray-500">
                                Pool {opponent.poolId}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                              {teamScore} - {opponentScore}
                            </span>
                            {teamScore > opponentScore ? (
                              <Badge className="bg-green-500 text-white border-0">WIN</Badge>
                            ) : teamScore < opponentScore ? (
                              <Badge className="bg-red-500 text-white border-0">LOSS</Badge>
                            ) : (
                              <Badge className="bg-gray-500 text-white border-0">DRAW</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <Card className="border-2 border-orange-200 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader className="border-b border-orange-200 bg-white/50">
                    <CardTitle className="flex items-center gap-3 text-orange-700">
                      Upcoming Matches ({upcomingMatches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {upcomingMatches.map((match) => {
                      // Determine opponent for upcoming matches
                      const isHomeTeam = match.homeTeam.id === selectedTeam.id;
                      const opponent = isHomeTeam ? match.awayTeam : match.homeTeam;
                      
                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-white border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-500 p-2 rounded-lg">
                            </div>
                            <div>
                              <span className="font-bold text-gray-800 block">
                                vs {opponent.schoolName}
                              </span>
                              <span className="text-xs text-gray-500">
                                Pool {opponent.poolId}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-orange-500 text-white border-0 animate-pulse">
                            Coming up
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            Water Polo Teams
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Dive into team stats and player performance!</p>
      </div>

      {/* Filters Card */}
      <Card className="mb-8 border-2 border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
              <Input
                placeholder="Find teams by school, coach, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-white border-blue-300 focus:border-blue-500 text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-2 border-blue-300">
                <Filter className="w-4 h-4 text-blue-500" />
                <select
                  value={filterPool}
                  onChange={(e) => setFilterPool(e.target.value)}
                  className="bg-transparent border-0 focus:ring-0 text-sm font-medium text-blue-700"
                >
                  <option value="all">All Pools</option>
                  <option value="A">Pool A</option>
                  <option value="B">Pool B</option>
                  <option value="C">Pool C</option>
                  <option value="D">Pool D</option>
                </select>
              </div>

              <div className="bg-white px-4 py-3 rounded-xl border-2 border-blue-300">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'points' | 'goals' | 'played')}
                  className="bg-transparent border-0 focus:ring-0 text-sm font-medium text-blue-700"
                >
                  <option value="name">Sort by Name</option>
                  <option value="points">Sort by Points</option>
                  <option value="goals">Sort by Goals</option>
                  <option value="played">Sort by Games</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      {sortedTeams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50 group overflow-hidden hover:border-blue-400 hover:-translate-y-1"
              onClick={() => {
                setSelectedTeam(team);
                loadTeamStats(team);
              }}
            >
              {/* Water wave top accent */}
              <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-bold text-blue-800 group-hover:text-blue-600 transition-colors">
                    {team.schoolName}
                  </CardTitle>
                  {team.poolId && (
                    <Badge className="bg-yellow-400 text-blue-800 border-0 font-bold text-sm">
                      Pool {team.poolId}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2 bg-blue-100/50 p-2 rounded-lg">
                    <span className="font-medium">Coach: {team.coachName}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100/50 p-2 rounded-lg">
                    <span className="font-medium">Manager: {team.managerName}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100/50 p-2 rounded-lg">
                    <span className="font-medium">{team.players.length} players</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-blue-500 text-white hover:bg-blue-600 border-blue-500 font-bold"
                  >
                    🏊 View Team Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">No Teams in the Pool!</h3>
              <p className="text-gray-600 mb-4">
                No teams match your search. Try different filters to find what you&apos;re looking for!
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterPool('all');
                }}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
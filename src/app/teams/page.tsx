// app/teams/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Player {
  id: string;
  name: string;
  capNumber: number;
  teamId: string;
}

interface Team {
  id: string;
  schoolName: string;
  coachName: string;
  managerName: string;
  poolAllocation?: string;
  teamLogo?: string;
  players: Player[];
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface PlayerStats {
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

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  completed: boolean;
  stage: string;
  poolId?: string;
  day: number;
  timeSlot: string;
  arena: number;
}

interface TeamStats {
  team: Team;
  standing: TeamStanding;
  matches: Match[];
  playerStats: { [playerId: string]: PlayerStats };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'goals' | 'played'>('name');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to load teams');
      const teamsData = await response.json();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamStats = async (team: Team) => {
    try {
      const standingsResponse = await fetch(`/api/standings?pool=${team.poolAllocation}`);
      let standing: TeamStanding | null = null;
      
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        standing = standingsData.standings.find((s: TeamStanding) => s.team.id === team.id);
      }

      const matchesResponse = await fetch('/api/matches');
      let teamMatches: Match[] = [];
      
      if (matchesResponse.ok) {
        const allMatches = await matchesResponse.json();
        teamMatches = allMatches.filter((match: Match) => 
          match.homeTeamId === team.id || match.awayTeamId === team.id
        );
      }

      const playerStats: { [playerId: string]: PlayerStats } = {};
      
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

      for (const match of teamMatches) {
        if (match.completed && match.homeScore !== undefined && match.awayScore !== undefined) {
          const isHomeTeam = match.homeTeamId === team.id;
          
          const resultResponse = await fetch(`/api/match-results?matchId=${match.id}`);
          if (resultResponse.ok) {
            const matchResult = await resultResponse.json();
            if (matchResult) {
              const statsResponse = await fetch(`/api/player-stats?matchResultId=${matchResult.id}`);
              if (statsResponse.ok) {
                const playerMatchStats = await statsResponse.json();
                
                playerMatchStats.forEach((stat: any) => {
                  if (playerStats[stat.playerId]) {
                    const player = playerStats[stat.playerId];
                    player.matchesPlayed += 1;
                    player.totalGoals += stat.goals;
                    player.totalKickOuts += stat.kickOuts;
                    player.totalYellowCards += stat.yellowCards;
                    player.totalRedCards += stat.redCards;
                    player.disciplinaryPoints += stat.yellowCards * 1 + stat.redCards * 3;
                    player.goalsPerMatch = player.matchesPlayed > 0 ? player.totalGoals / player.matchesPlayed : 0;
                  }
                });
              }
            }
          }
        }
      }

      setTeamStats({
        team,
        standing: standing || {
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
    const matchesPool = filterPool === 'all' || team.poolAllocation === filterPool;
    return matchesSearch && matchesPool;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.schoolName.localeCompare(b.schoolName);
      default:
        return 0;
    }
  });

  const getPoolFilterText = () => {
    switch (filterPool) {
      case 'all': return 'All Pools';
      case 'A': return 'Group A';
      case 'B': return 'Group B';
      case 'C': return 'Group C';
      case 'D': return 'Group D';
      default: return 'All Pools';
    }
  };

  const getSortByText = () => {
    switch (sortBy) {
      case 'name': return 'Sort by Name';
      case 'points': return 'Sort by Points';
      case 'goals': return 'Sort by Goals';
      case 'played': return 'Sort by Games';
      default: return 'Sort by Name';
    }
  };

  if (selectedTeam && teamStats) {
    const completedMatches = teamStats.matches.filter((m) => m.completed);
    const upcomingMatches = teamStats.matches.filter((m) => !m.completed);

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={() => {
                setSelectedTeam(null);
                setTeamStats(null);
              }} 
              variant="outline" 
              size="sm"
              className="border-blue-300 hover:bg-blue-50 text-blue-700 hover:border-blue-400 shadow-sm"
            >
              Back to All Teams
            </Button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>
            
            <div className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-8">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                  {teamStats.team.teamLogo && (
                    <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center border-4 border-blue-300 shadow-xl flex-shrink-0">
                      <img 
                        src={teamStats.team.teamLogo} 
                        alt={`${teamStats.team.schoolName} logo`}
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                        {teamStats.team.schoolName}
                      </h1>
                      {teamStats.team.poolAllocation && (
                        <Badge className="bg-yellow-400 text-blue-800 border-0 text-base px-4 py-1.5 font-bold shadow-md w-fit mx-auto md:mx-0">
                          Group {teamStats.team.poolAllocation}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-blue-200">
                        <span className="text-gray-600">Coach:</span>
                        <span className="font-bold text-blue-800">{teamStats.team.coachName}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-cyan-200">
                        <span className="text-gray-600">Manager:</span>
                        <span className="font-bold text-cyan-800">{teamStats.team.managerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-blue-300">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{teamStats.standing.points}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Points</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-gray-300">
                    <div className="text-3xl font-bold text-gray-700 mb-1">{teamStats.standing.played}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Played</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-green-300">
                    <div className="text-3xl font-bold text-green-600 mb-1">{teamStats.standing.won}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Won</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-yellow-300">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">{teamStats.standing.drawn}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Drawn</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-red-300">
                    <div className="text-3xl font-bold text-red-600 mb-1">{teamStats.standing.lost}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Lost</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-cyan-300 col-span-2 md:col-span-1">
                    <div className="text-3xl font-bold text-cyan-600 mb-1">{teamStats.standing.goalsFor}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Goals For</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-orange-300 col-span-2 md:col-span-1">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{teamStats.standing.goalsAgainst}</div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Goals Against</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border-2 border-indigo-300 col-span-2 md:col-span-1">
                    <div className={`text-3xl font-bold mb-1 ${
                      teamStats.standing.goalDifference > 0 ? 'text-green-600' : 
                      teamStats.standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {teamStats.standing.goalDifference > 0 ? '+' : ''}{teamStats.standing.goalDifference}
                    </div>
                    <div className="text-xs font-semibold text-gray-600 uppercase">Goal Diff</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2 bg-gradient-to-r from-blue-100 to-cyan-100 p-1.5 rounded-xl border-2 border-blue-200 shadow-lg mx-auto">
            <TabsTrigger 
              value="players" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-lg transition-all font-semibold"
            >
              Player Stats
            </TabsTrigger>
            <TabsTrigger 
              value="matches"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-lg transition-all font-semibold"
            >
              Match History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-8">
            <Card className="border-2 border-blue-200 shadow-2xl bg-white overflow-hidden">
              <CardHeader className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                <CardTitle className="text-2xl text-blue-800">
                  Player Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                        <th className="p-4 text-left font-bold">Player</th>
                        <th className="p-4 text-center font-bold">Matches</th>
                        <th className="p-4 text-center font-bold">Goals</th>
                        <th className="p-4 text-center font-bold">Kick-outs</th>
                        <th className="p-4 text-center font-bold">Yellow</th>
                        <th className="p-4 text-center font-bold">Red</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(teamStats.playerStats)
                        .sort((a, b) => b.totalGoals - a.totalGoals)
                        .map((player, index) => (
                        <tr 
                          key={player.playerId} 
                          className={`border-b border-blue-100 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-md">
                                {player.capNumber}
                              </div>
                              <span className="font-bold text-gray-900 text-base">{player.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-sm border border-gray-300 inline-block">
                              {player.matchesPlayed}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-sm border-2 border-blue-300 inline-block shadow-sm">
                              {player.totalGoals}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-700 font-bold text-base">
                              {player.totalKickOuts}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-bold px-3 py-1.5 rounded-lg text-sm border-2 inline-block ${
                              player.totalYellowCards > 0 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-400 shadow-sm' 
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                              {player.totalYellowCards}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-bold px-3 py-1.5 rounded-lg text-sm border-2 inline-block ${
                              player.totalRedCards > 0 
                                ? 'bg-red-50 text-red-700 border-red-400 shadow-sm' 
                                : 'bg-gray-50 text-gray-400 border-gray-200'
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

          <TabsContent value="matches" className="mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
              {completedMatches.length > 0 && (
                <Card className="border-2 border-green-300 shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="border-b-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
                    <CardTitle className="text-green-700">
                      <div className="text-xl font-bold">Match Results</div>
                      <div className="text-sm text-green-600 font-normal">{completedMatches.length} completed</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
                    {completedMatches.map((match) => {
                      const homeScore = match.homeScore ?? 0;
                      const awayScore = match.awayScore ?? 0;
                      const isHomeTeam = match.homeTeamId === selectedTeam.id;
                      const opponent = isHomeTeam ? match.awayTeam : match.homeTeam;
                      const teamScore = isHomeTeam ? homeScore : awayScore;
                      const opponentScore = isHomeTeam ? awayScore : homeScore;
                      const isWin = teamScore > opponentScore;
                      const isDraw = teamScore === opponentScore;

                      return (
                        <div
                          key={match.id}
                          className={`p-4 bg-gradient-to-r rounded-xl shadow-md border-2 ${
                            isWin ? 'from-green-50 to-emerald-50 border-green-300' :
                            isDraw ? 'from-gray-50 to-slate-50 border-gray-300' :
                            'from-red-50 to-rose-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg mb-1">
                                vs {opponent.schoolName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                {match.stage === 'group' ? `Group ${match.poolId}` : match.stage}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className={`text-2xl font-bold px-4 py-2 rounded-xl shadow-md ${
                                isWin ? 'bg-green-500 text-white' :
                                isDraw ? 'bg-gray-500 text-white' :
                                'bg-red-500 text-white'
                              }`}>
                                {teamScore} - {opponentScore}
                              </div>
                              
                              {isWin ? (
                                <Badge className="bg-green-600 text-white border-0 text-sm font-bold shadow-md">WIN</Badge>
                              ) : isDraw ? (
                                <Badge className="bg-gray-600 text-white border-0 text-sm font-bold shadow-md">DRAW</Badge>
                              ) : (
                                <Badge className="bg-red-600 text-white border-0 text-sm font-bold shadow-md">LOSS</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {upcomingMatches.length > 0 && (
                <Card className="border-2 border-orange-300 shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="border-b-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
                    <CardTitle className="text-orange-700">
                      <div className="text-xl font-bold">Upcoming Matches</div>
                      <div className="text-sm text-orange-600 font-normal">{upcomingMatches.length} scheduled</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
                    {upcomingMatches.map((match) => {
                      const isHomeTeam = match.homeTeamId === selectedTeam.id;
                      const opponent = isHomeTeam ? match.awayTeam : match.homeTeam;
                      
                      return (
                        <div
                          key={match.id}
                          className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-bold text-gray-800 text-lg mb-1">
                                vs {opponent.schoolName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                {match.stage === 'group' ? `Group ${match.poolId}` : match.stage}
                              </div>
                            </div>
                            
                            <Badge className="bg-orange-500 text-white border-0 text-sm font-bold shadow-md">
                              Upcoming
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-orange-200 font-semibold text-gray-700">
                              Day {match.day}
                            </div>
                            <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-orange-200 font-semibold text-gray-700">
                              {match.timeSlot}
                            </div>
                            <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-orange-200 font-semibold text-gray-700">
                              Arena {match.arena}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {completedMatches.length === 0 && upcomingMatches.length === 0 && (
                <Card className="col-span-2 border-2 border-blue-200 shadow-xl">
                  <CardContent className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">No Matches Yet</h3>
                      <p className="text-gray-600 text-lg">
                        No matches have been scheduled for this team yet.
                      </p>
                    </div>
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
          Water Polo Teams
        </h1>
        <p className="text-gray-600 text-lg">Dive into team stats and player performance!</p>
      </div>

      <Card className="mb-8 border-2 border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Input
                placeholder="Find teams by school, coach, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 bg-white border-blue-300 focus:border-blue-500 text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-medium"
                  >
                    {getPoolFilterText()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white border-2 border-blue-200 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => setFilterPool('all')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    All Pools
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterPool('A')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Group A
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterPool('B')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Group B
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterPool('C')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Group C
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilterPool('D')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Group D
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-medium"
                  >
                    {getSortByText()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white border-2 border-blue-200 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => setSortBy('name')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Sort by Name
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('points')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Sort by Points
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('goals')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Sort by Goals
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('played')}
                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                  >
                    Sort by Games
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading teams...</p>
          </div>
        </div>
      ) : sortedTeams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTeams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer border-2 border-blue-200 shadow-lg bg-white overflow-hidden aspect-square"
              onClick={() => {
                setSelectedTeam(team);
                loadTeamStats(team);
              }}
            >
              {/* Logo as the entire card background */}
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-6">
                {team.poolAllocation && (
                  <Badge className="absolute top-3 right-3 bg-yellow-400 text-blue-800 border-0 font-bold text-sm shadow-md z-10">
                    Group {team.poolAllocation}
                  </Badge>
                )}
                
                {/* Team logo takes up most of the card */}
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {team.teamLogo ? (
                    <img 
                      src={team.teamLogo} 
                      alt={`${team.schoolName} logo`}
                      className="w-full h-full object-contain max-w-[160px] max-h-[160px]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <div className="text-3xl font-bold text-blue-800 mb-2">
                        {team.schoolName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {team.players.length} Players
                      </div>
                    </div>
                  )}
                </div>

                {/* Team info always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 border-t border-blue-200">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-blue-800 mb-1">{team.schoolName}</h3>
                    <div className="flex justify-center items-center gap-4 text-xs text-gray-600">
                      <span>Coach: {team.coachName}</span>
                      <span>•</span>
                      <span>{team.players.length} Players</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 border-2 border-blue-200 shadow-lg">
          <CardContent>
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Teams Found</h3>
              <p className="text-gray-600 text-lg mb-6">
                No teams match your current filters. Try adjusting your search or filter criteria.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterPool('all');
                  setSortBy('name');
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 shadow-lg"
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
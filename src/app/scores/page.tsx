"use client";

import { useState, useEffect } from 'react';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award, Trash2, Waves, Loader2 } from 'lucide-react';

// Remove the local Player and Team interfaces and use the ones from your types
interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: any; // Use any to avoid type conflicts, or import the proper Team type
  awayTeam: any;
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

interface ScheduledMatch extends Match {
  day: number;
  timeSlot: string;
  arena: 1 | 2;
}

export default function ScoresPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<{[key: number]: ScheduledMatch[]}>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, []);

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load matches from database
      const matchesResponse = await fetch('/api/matches');
      if (!matchesResponse.ok) {
        throw new Error('Failed to load matches');
      }
      const matchesData: Match[] = await matchesResponse.json();
      setMatches(matchesData);

      // Load teams count
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTotalTeams(teamsData.length || 0);
      }

      // Organize matches by day
      const byDay = matchesData.reduce((acc, match) => {
        if (!acc[match.day]) acc[match.day] = [];
        acc[match.day].push({
          ...match,
          arena: match.arena as 1 | 2
        });
        return acc;
      }, {} as {[key: number]: ScheduledMatch[]});

      // Sort matches within each day by time slot
      Object.keys(byDay).forEach(day => {
        byDay[parseInt(day)].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
      });

      setScheduledMatches(byDay);

    } catch (error) {
      console.error('Error loading match data:', error);
      setError('Failed to load match data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshFixtures = async () => {
    setIsRefreshing(true);
    try {
      await loadMatchData();
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMatchStats = (matches: ScheduledMatch[]) => {
    const completed = matches.filter(m => m.completed).length;
    const pending = matches.length - completed;
    return { completed, pending, total: matches.length };
  };

  const getCompletedMatches = (matches: ScheduledMatch[]) => {
    return matches.filter(m => m.completed);
  };

  const getPendingMatches = (matches: ScheduledMatch[]) => {
    return matches.filter(m => !m.completed);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-lg">Loading tournament fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadMatchData} variant="outline" className="border-red-300 text-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasMatches = matches.length > 0;

  if (!hasMatches) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Tournament Fixtures
            </h1>
          </div>
          <p className="text-gray-600 text-lg">View the complete tournament schedule</p>
        </div>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2 text-blue-800">No Fixtures Available</h3>
            <p className="text-gray-600 mb-4">
              {totalTeams > 0 
                ? `${totalTeams} teams are registered but no fixtures have been created yet.`
                : 'No teams are registered yet.'
              }
            </p>
            <p className="text-sm text-gray-500">
              Fixtures need to be created in the admin section first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            Tournament Fixtures
          </h1>
        </div>
        <p className="text-gray-600 text-lg">View the complete tournament schedule</p>
      </div>

      {/* Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefreshFixtures}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {matches.length} Matches Total
            </Badge>
          </div>
          
          {/* Overall Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{matches.filter(m => m.completed).length} completed</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{matches.filter(m => !m.completed).length} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Days */}
      <Tabs defaultValue="day1" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-blue-100 p-1 rounded-xl border border-blue-200">
          {[1, 2, 3, 4].map(day => (
            <TabsTrigger 
              key={day}
              value={`day${day}`}
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              Day {day}
              {scheduledMatches[day] && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-white text-blue-600">
                  {scheduledMatches[day].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {[1, 2, 3, 4].map(day => (
          <TabsContent key={day} value={`day${day}`} className="mt-6">
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="border-b border-blue-200 bg-white/50">
                <CardTitle className="flex items-center justify-between text-xl text-blue-800">
                  <span>
                    {day === 1 && 'Wednesday, October 15'}
                    {day === 2 && 'Thursday, October 16'}
                    {day === 3 && 'Friday, October 17'}
                    {day === 4 && 'Saturday, October 18'}
                  </span>
                  {scheduledMatches[day] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {scheduledMatches[day].filter(m => m.completed).length} completed
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {scheduledMatches[day].filter(m => !m.completed).length} pending
                      </Badge>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {renderDaySchedule(day)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  function renderDaySchedule(day: number) {
    const dayMatches = scheduledMatches[day];
    
    if (!dayMatches || dayMatches.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No matches scheduled for Day {day}</p>
        </div>
      );
    }

    const matchesByTime = dayMatches.reduce((acc, match) => {
      if (!acc[match.timeSlot]) acc[match.timeSlot] = [];
      acc[match.timeSlot].push(match);
      return acc;
    }, {} as {[key: string]: ScheduledMatch[]});

    return (
      <div className="space-y-6">
        {Object.entries(matchesByTime)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timeSlot, matches]) => {
            const arena1Match = matches.find(m => m.arena === 1);
            const arena2Match = matches.find(m => m.arena === 2);
            
            // Determine if this slot has knockout/bracket matches
            const hasKnockoutMatch = arena1Match && ['cup', 'plate', 'shield'].includes(arena1Match.stage);
            const hasFestivalMatch = arena2Match && arena2Match.stage === 'festival';
            
            return (
              <div key={timeSlot} className="border-2 border-blue-200 rounded-xl p-6 bg-white shadow-sm">
                <h4 className="font-semibold mb-4 text-center bg-blue-100 text-blue-800 py-3 rounded-lg flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {timeSlot}
                  {hasKnockoutMatch && (
                    <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-400">
                      <Trophy className="w-3 h-3 mr-1" />
                      Knockout
                    </Badge>
                  )}
                  {hasFestivalMatch && (
                    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-400">
                      <Waves className="w-3 h-3 mr-1" />
                      Festival
                    </Badge>
                  )}
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-center mb-3 text-blue-600 bg-blue-50 py-2 rounded flex items-center justify-center gap-2">
                      Arena 1
                      {hasKnockoutMatch && (
                        <span className="text-xs text-yellow-600">(Knockout)</span>
                      )}
                    </h5>
                    {arena1Match ? (
                      <MatchCard match={arena1Match} showPool={arena1Match.stage === 'pool'} />
                    ) : (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                        No match scheduled
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-center mb-3 text-green-600 bg-green-50 py-2 rounded flex items-center justify-center gap-2">
                      Arena 2
                      {hasFestivalMatch && (
                        <span className="text-xs text-orange-600">(Festival)</span>
                      )}
                    </h5>
                    {arena2Match ? (
                      <MatchCard match={arena2Match} showPool={arena2Match.stage === 'pool'} />
                    ) : (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                        No match scheduled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    );
  }
}

function getPoolColor(poolId: string): string {
  const colors = {
    'A': 'bg-blue-600',
    'B': 'bg-green-600', 
    'C': 'bg-orange-600',
    'D': 'bg-purple-600'
  };
  return colors[poolId as keyof typeof colors] || 'bg-gray-600';
}
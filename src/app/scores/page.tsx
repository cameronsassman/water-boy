"use client";

import { useState, useEffect } from 'react';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award, Trash2, Waves, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Remove the local Player and Team interfaces and use the ones from your types
interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: any;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>("day1");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load both matches and teams in parallel for initial load
      const [matchesResponse, teamsResponse] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/teams')
      ]);

      if (!matchesResponse.ok) {
        throw new Error('Failed to load matches');
      }

      const matchesData: Match[] = await matchesResponse.json();
      setMatches(matchesData);

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTotalTeams(teamsData.length || 0);
      }

      organizeMatchesByDay(matchesData);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load match data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const organizeMatchesByDay = (matchesData: Match[]) => {
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
  };

  const handleRefreshFixtures = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      
      // Only refresh matches data, not teams
      const matchesResponse = await fetch('/api/matches');
      
      if (!matchesResponse.ok) {
        throw new Error('Failed to refresh matches');
      }

      const matchesData: Match[] = await matchesResponse.json();
      
      // Update matches state directly
      setMatches(matchesData);
      
      // Reorganize the matches by day
      organizeMatchesByDay(matchesData);
      
      // Update timestamp
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error refreshing fixtures:', error);
      setError('Failed to refresh fixtures. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleTimeSlot = (timeSlot: string) => {
    setExpandedTimeSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeSlot)) {
        newSet.delete(timeSlot);
      } else {
        newSet.add(timeSlot);
      }
      return newSet;
    });
  };

  const getDayDisplayName = (day: number) => {
    const dayNames = {
      1: 'Wednesday, October 15',
      2: 'Thursday, October 16', 
      3: 'Friday, October 17',
      4: 'Saturday, October 18'
    };
    return dayNames[day as keyof typeof dayNames] || `Day ${day}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-lg">Loading tournament fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-800 mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={loadInitialData} variant="outline" className="border-red-300 text-red-700 text-sm sm:text-base">
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
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Tournament Fixtures
            </h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">View the complete tournament schedule</p>
        </div>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="text-center py-8 sm:py-12">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-blue-800">No Fixtures Available</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Fixtures need to be created in the admin section first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            Tournament Fixtures
          </h1>
        </div>
        <p className="text-gray-600 text-base sm:text-lg">View the complete tournament schedule</p>
      </div>

      {/* Controls */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshFixtures}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            
            {/* Last Updated Timestamp */}
            {lastUpdated && (
              <div className="text-xs sm:text-sm text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day Selection - Mobile Dropdown */}
      <div className="block sm:hidden mb-6">
        <div className="space-y-2">
          <label htmlFor="day-select" className="text-sm font-medium text-gray-700">
            Select Day
          </label>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger id="day-select" className="w-full">
              <SelectValue>
                {getDayDisplayName(parseInt(selectedDay.replace('day', '')))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map(day => (
                <SelectItem key={day} value={`day${day}`}>
                  <div className="flex items-center justify-between w-full">
                    <span>{getDayDisplayName(day)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for Days - Desktop */}
      <div className="hidden sm:block">
        <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-blue-100 p-1 rounded-xl border border-blue-200">
            {[1, 2, 3, 4].map(day => (
              <TabsTrigger 
                key={day}
                value={`day${day}`}
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all text-sm"
              >
                <span className="flex items-center gap-2">
                  <span>Day {day}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Day Content */}
      <div className="mt-4 sm:mt-6">
        {[1, 2, 3, 4].map(day => (
          <div key={day} className={selectedDay === `day${day}` ? 'block' : 'hidden'}>
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="border-b border-blue-200 bg-white/50 p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-lg sm:text-xl text-blue-800">
                  <span className="text-center sm:text-left">
                    {getDayDisplayName(day)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                {renderDaySchedule(day)}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  function renderDaySchedule(day: number) {
    const dayMatches = scheduledMatches[day];
    
    if (!dayMatches || dayMatches.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
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
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(matchesByTime)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timeSlot, matches]) => {
            const arena1Match = matches.find(m => m.arena === 1);
            const arena2Match = matches.find(m => m.arena === 2);
            const isExpanded = expandedTimeSlots.has(timeSlot);
            
            // Determine if this slot has knockout/bracket matches
            const hasKnockoutMatch = arena1Match && ['cup', 'plate', 'shield'].includes(arena1Match.stage);
            const hasFestivalMatch = arena2Match && arena2Match.stage === 'festival';

            return (
              <div key={timeSlot} className="border-2 border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 bg-white shadow-sm">
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleTimeSlot(timeSlot)}
                  className="w-full font-semibold mb-3 sm:mb-4 text-center bg-blue-100 text-blue-800 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors"
                >
                  <span className="text-sm sm:text-base">{timeSlot}</span>
                  {hasKnockoutMatch && (
                    <Badge variant="outline" className="hidden xs:inline-flex ml-2 text-yellow-600 border-yellow-400 text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      Knockout
                    </Badge>
                  )}
                  {hasFestivalMatch && (
                    <Badge variant="outline" className="hidden xs:inline-flex ml-2 text-orange-600 border-orange-400 text-xs">
                      <Waves className="w-3 h-3 mr-1" />
                      Festival
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>

                {/* Match Content - Collapsible */}
                <div className={`${isExpanded ? 'block' : 'hidden sm:block'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Aquatic Centre */}
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium text-center mb-2 sm:mb-3 text-blue-600 bg-blue-50 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2">
                        <span>Aquatic Centre</span>
                        {hasKnockoutMatch && (
                          <span className="text-xs text-yellow-600 hidden xs:inline">(Knockout)</span>
                        )}
                      </h5>
                      {arena1Match ? (
                        <MatchCard 
                          match={arena1Match} 
                          showPool={arena1Match.stage === 'pool'} 
                          showProgression={true}
                          size="small"
                        />
                      ) : (
                        <div className="text-center py-4 sm:py-6 text-gray-400 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50 text-xs sm:text-sm">
                          No match scheduled
                        </div>
                      )}
                    </div>

                    {/* High School */}
                    <div>
                      <h5 className="text-xs sm:text-sm font-medium text-center mb-2 sm:mb-3 text-green-600 bg-green-50 py-1.5 sm:py-2 rounded flex items-center justify-center gap-1 sm:gap-2">
                        <span>High School</span>
                        {hasFestivalMatch && (
                          <span className="text-xs text-orange-600 hidden xs:inline">(Festival)</span>
                        )}
                      </h5>
                      {arena2Match ? (
                        <MatchCard 
                          match={arena2Match} 
                          showPool={arena2Match.stage === 'pool'} 
                          showProgression={true}
                          size="small"
                        />
                      ) : (
                        <div className="text-center py-4 sm:py-6 text-gray-400 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50 text-xs sm:text-sm">
                          No match scheduled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile-only badges that show below the time slot */}
                  <div className="flex flex-wrap justify-center gap-2 mt-3 sm:hidden">
                    {hasKnockoutMatch && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        Knockout Match
                      </Badge>
                    )}
                    {hasFestivalMatch && (
                      <Badge variant="outline" className="text-orange-600 border-orange-400 text-xs">
                        <Waves className="w-3 h-3 mr-1" />
                        Festival Match
                      </Badge>
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
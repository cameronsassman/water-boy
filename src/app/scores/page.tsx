"use client";

import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { Match } from '@/types/team';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award, Trash2, Waves } from 'lucide-react';

interface ScheduledMatch extends MatchWithTeams { 
  day: number;
  timeSlot: string;
  arena: 1 | 2;
}

const SCHEDULED_MATCHES_KEY = 'water-polo-tournament-scheduled-matches';
const SCHEDULE_GENERATED_KEY = 'water-polo-tournament-schedule-generated';

export default function ScoresPage() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [poolMatches, setPoolMatches] = useState<{[key: string]: ScheduledMatch[]}>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [allMatches, setAllMatches] = useState<ScheduledMatch[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<{[key: number]: ScheduledMatch[]}>({});
  const [knockoutMatches, setKnockoutMatches] = useState<ScheduledMatch[]>([]);
  const [festivalMatches, setFestivalMatches] = useState<ScheduledMatch[]>([]);

  useEffect(() => {
    loadMatchData();
  }, []);

  const loadScheduledMatchesFromStorage = (): ScheduledMatch[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(SCHEDULED_MATCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading scheduled matches from storage:', error);
      return [];
    }
  };

  const saveScheduledMatchesToStorage = (matches: ScheduledMatch[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SCHEDULED_MATCHES_KEY, JSON.stringify(matches));
      localStorage.setItem(SCHEDULE_GENERATED_KEY, 'true');
    } catch (error) {
      console.error('Error saving scheduled matches to storage:', error);
    }
  };

  const isScheduleGeneratedInStorage = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SCHEDULE_GENERATED_KEY) === 'true';
  };

  const clearScheduledMatchesFromStorage = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SCHEDULED_MATCHES_KEY);
    localStorage.removeItem(SCHEDULE_GENERATED_KEY);
  };

  const loadMatchData = () => {
    try {
      const allocated = tournamentUtils.arePoolsAllocated();
      const poolMatchesGenerated = tournamentUtils.arePoolMatchesGenerated();
      const scheduleGenerated = isScheduleGeneratedInStorage();
      const teams = storageUtils.getTeams();
      
      setIsAllocated(allocated);
      setMatchesGenerated(poolMatchesGenerated && scheduleGenerated);
      setTotalTeams(teams.length);

      if (poolMatchesGenerated && scheduleGenerated) {
        const scheduledMatchesData = loadScheduledMatchesFromStorage();
        
        const updatedScheduledMatches = scheduledMatchesData.map(match => {
          const currentMatch = storageUtils.getTournament().matches.find(m => m.id === match.id);
          const result = storageUtils.getMatchResult(match.id);
          
          const homeTeam = match.homeTeam || { id: 'TBD', schoolName: 'TBD', players: [] };
          const awayTeam = match.awayTeam || { id: 'TBD', schoolName: 'TBD', players: [] };
          
          return {
            ...match,
            homeTeam,
            awayTeam,
            completed: result?.completed || false,
            homeScore: result?.homeScore,
            awayScore: result?.awayScore
          };
        });

        const pools = {
          A: updatedScheduledMatches.filter(m => m.poolId === 'A'),
          B: updatedScheduledMatches.filter(m => m.poolId === 'B'),
          C: updatedScheduledMatches.filter(m => m.poolId === 'C'),
          D: updatedScheduledMatches.filter(m => m.poolId === 'D')
        };
        
        setPoolMatches(pools);
        setAllMatches(updatedScheduledMatches);
        
        const poolOnly = updatedScheduledMatches.filter(m => m.stage === 'pool');
        const knockout = updatedScheduledMatches.filter(m => ['cup', 'plate', 'shield'].includes(m.stage));
        const festival = updatedScheduledMatches.filter(m => m.stage === 'festival');
        
        setKnockoutMatches(knockout);
        setFestivalMatches(festival);
        
        const byDay = updatedScheduledMatches.reduce((acc, match) => {
          if (!acc[match.day]) acc[match.day] = [];
          acc[match.day].push(match);
          return acc;
        }, {} as {[key: number]: ScheduledMatch[]});
        
        Object.keys(byDay).forEach(day => {
          byDay[parseInt(day)].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        
        setScheduledMatches(byDay);
      } else if (poolMatchesGenerated && !scheduleGenerated) {
        const scheduledMatchesData = scheduleAllMatches();
        saveScheduledMatchesToStorage(scheduledMatchesData);
        setMatchesGenerated(true);
        loadMatchData();
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const scheduleAllMatches = (): ScheduledMatch[] => {
    const allScheduledMatches: ScheduledMatch[] = [];
    
    const poolScheduled = schedulePoolMatches();
    allScheduledMatches.push(...poolScheduled);
    
    const knockoutAndFestival = scheduleExistingKnockoutAndFestivalMatches();
    allScheduledMatches.push(...knockoutAndFestival);
    
    return allScheduledMatches;
  };

  const schedulePoolMatches = (): ScheduledMatch[] => {
    const allPoolMatches: MatchWithTeams[] = [];
    
    ['A', 'B', 'C', 'D'].forEach(poolId => {
      const matches = getPoolMatchesWithTeams(poolId);
      allPoolMatches.push(...matches);
    });

    return schedulePoolMatchesDeterministic(allPoolMatches);
  };

  const schedulePoolMatchesDeterministic = (matches: MatchWithTeams[]): ScheduledMatch[] => {
    const scheduled: ScheduledMatch[] = [];
    
    const sortedMatches = [...matches].sort((a, b) => a.id.localeCompare(b.id));
    
    const day1TimeSlots = generateTimeSlotsWithBreaks(16, 19, 20);
    const day2TimeSlots = generateTimeSlotsWithBreaks(8, 19, 0, [{ start: '12:30', end: '13:30' }]);
    const day3PoolTimeSlots = generateTimeSlotsWithBreaks(8, 10);
    
    const timeSlotsByDay = [day1TimeSlots, day2TimeSlots, day3PoolTimeSlots];
    const distribution = [16, 56, 12];

    let matchIndex = 0;
    
    for (let day = 1; day <= 3; day++) {
      const timeSlots = timeSlotsByDay[day - 1];
      const targetMatches = distribution[day - 1];
      let matchesScheduledThisDay = 0;
      
      for (let slotIndex = 0; slotIndex < timeSlots.length && matchesScheduledThisDay < targetMatches; slotIndex++) {
        const timeSlot = timeSlots[slotIndex];
        const maxMatchesThisSlot = Math.min(2, targetMatches - matchesScheduledThisDay);
        
        for (let arena = 1; arena <= 2 && matchesScheduledThisDay < targetMatches && arena <= maxMatchesThisSlot; arena++) {
          if (matchIndex < sortedMatches.length) {
            const match = sortedMatches[matchIndex];
            scheduled.push({
              ...match,
              day: day,
              timeSlot: timeSlot,
              arena: arena as 1 | 2
            });
            
            matchIndex++;
            matchesScheduledThisDay++;
          }
        }
      }
    }
    
    return scheduled;
  };

  const scheduleExistingKnockoutAndFestivalMatches = (): ScheduledMatch[] => {
    const scheduledKnockout: ScheduledMatch[] = [];
    
    try {
      const tournament = storageUtils.getTournament();
      const allKnockoutMatches = tournament.matches.filter(match => 
        ['cup', 'plate', 'shield', 'festival'].includes(match.stage)
      );
      
      if (allKnockoutMatches.length === 0) {
        return scheduledKnockout;
      }
      
      const knockoutMatchesWithTeams = allKnockoutMatches.map(match => 
        tournamentUtils.getMatchWithTeams(match)
      );
      
      const sortedKnockoutMatches = knockoutMatchesWithTeams.sort((a, b) => a.id.localeCompare(b.id));
      
      const day3KnockoutSlots = generateTimeSlotsWithBreaks(10, 19, 30);
      const day4Slots = generateTimeSlotsWithBreaks(7, 15);
      
      let matchIndex = 0;
      
      for (let i = 0; i < day3KnockoutSlots.length && matchIndex < sortedKnockoutMatches.length; i++) {
        const match = sortedKnockoutMatches[matchIndex];
        scheduledKnockout.push({
          ...match,
          day: 3,
          timeSlot: day3KnockoutSlots[i],
          arena: 1
        });
        matchIndex++;
      }
      
      for (let i = 0; i < day4Slots.length && matchIndex < sortedKnockoutMatches.length; i++) {
        const match = sortedKnockoutMatches[matchIndex];
        scheduledKnockout.push({
          ...match,
          day: 4,
          timeSlot: day4Slots[i],
          arena: 1
        });
        matchIndex++;
      }
      
    } catch (error) {
      console.error('Error scheduling knockout matches:', error);
    }
    
    return scheduledKnockout;
  };

  const generateTimeSlotsWithBreaks = (startHour: number, endHour: number, startMinute: number = 0, breaks: {start: string, end: string}[] = []): string[] => {
    const slots: string[] = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
      if (currentHour < endHour) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const isInBreak = breaks.some(breakPeriod => {
          const breakStart = timeToMinutes(breakPeriod.start);
          const breakEnd = timeToMinutes(breakPeriod.end);
          const currentTimeMinutes = timeToMinutes(timeStr);
          return currentTimeMinutes >= breakStart && currentTimeMinutes < breakEnd;
        });
        
        if (!isInBreak) {
          slots.push(timeStr);
        }
      }
      
      currentMinute += 20;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    return slots;
  };

  const getPoolMatchesWithTeams = (poolId: string): MatchWithTeams[] => {
    try {
      const matches = tournamentUtils.getPoolMatches(poolId);
      return matches.map(match => tournamentUtils.getMatchWithTeams(match));
    } catch (error) {
      console.error(`Error loading matches for pool ${poolId}:`, error);
      return [];
    }
  };

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      tournamentUtils.generatePoolMatches();
      
      const scheduledMatchesData = scheduleAllMatches();
      saveScheduledMatchesToStorage(scheduledMatchesData);
      
      loadMatchData();
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateKnockout = async () => {
    if (!tournamentUtils.isPoolStageComplete()) {
      alert('Pool stage must be completed before generating knockout brackets');
      return;
    }

    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      tournamentUtils.generateCupBracket();
      
      const scheduledMatchesData = scheduleAllMatches();
      saveScheduledMatchesToStorage(scheduledMatchesData);
      
      loadMatchData();
    } catch (error) {
      console.error('Error generating knockout brackets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshFixtures = async () => {
    setIsRefreshing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      loadMatchData();
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearMatches = async () => {
    if (!confirm('Are you sure you want to clear all matches and results? This action cannot be undone.')) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      tournamentUtils.clearPoolMatches();
      tournamentUtils.clearKnockoutAndFestivalMatches();
      clearScheduledMatchesFromStorage();
      
      loadMatchData();
    } catch (error) {
      console.error('Error clearing matches:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearResults = async () => {
    if (!confirm('Are you sure you want to clear all saved match results and scorecards? Matches will remain but all scores will be reset. This action cannot be undone.')) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      storageUtils.clearPoolMatchResults();
      
      const currentSchedule = loadScheduledMatchesFromStorage();
      const updatedSchedule = currentSchedule.map(match => ({
        ...match,
        completed: false,
        homeScore: undefined,
        awayScore: undefined
      }));
      saveScheduledMatchesToStorage(updatedSchedule);
      
      loadMatchData();
    } catch (error) {
      console.error('Error clearing results:', error);
    } finally {
      setIsGenerating(false);
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

  if (totalTeams === 0 && !isAllocated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (!isAllocated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-800">
            Tournament Fixtures
          </h1>
          <p className="text-gray-600 mt-2">View and manage 4-day tournament schedule</p>
        </div>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Pool Allocation Required</h3>
            <p className="text-gray-600 mb-4">
              {totalTeams} teams are registered but need to be allocated into pools before fixtures can be generated.
            </p>
            <p className="text-sm text-gray-500">
              Go to the Pools page to allocate teams into pools first.
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            Tournament Fixtures
          </h1>
        </div>
        <p className="text-gray-600 text-lg">View the complete 4-day tournament schedule</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {matchesGenerated && (
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
            )}
          </div>
        </div>
      </div>

      {matchesGenerated && (
        <>
          <Tabs defaultValue="day1" className="w-full">
            <TabsList className="w-full grid grid-cols-4 bg-blue-100 p-1 rounded-xl border border-blue-200">
              <TabsTrigger 
                value="day1"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                Day 1
              </TabsTrigger>
              <TabsTrigger 
                value="day2"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                Day 2
              </TabsTrigger>
              <TabsTrigger 
                value="day3"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                Day 3
              </TabsTrigger>
              <TabsTrigger 
                value="day4"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                Day 4
              </TabsTrigger>
            </TabsList>

            <TabsContent value="day1" className="mt-6">
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="border-b border-blue-200 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                    Wednesday, October 15
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderDaySchedule(1)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="day2" className="mt-6">
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="border-b border-blue-200 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                    Thursday, October 16
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderDaySchedule(2)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="day3" className="mt-6">
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="border-b border-blue-200 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                    Friday, October 17
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderDaySchedule(3)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="day4" className="mt-6">
              <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="border-b border-blue-200 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                    Saturday, October 18
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {renderDaySchedule(4)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );

  function renderDaySchedule(day: number) {
    const dayMatches = scheduledMatches[day];
    
    if (!dayMatches || dayMatches.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
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
          .map(([timeSlot, matches]) => (
            <div key={timeSlot} className="border-2 border-blue-200 rounded-xl p-6 bg-white shadow-sm">
              <h4 className="font-semibold mb-4 text-center bg-blue-100 text-blue-800 py-3 rounded-lg">
                {timeSlot}
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-center mb-3 text-blue-600 bg-blue-50 py-2 rounded">Arena 1</h5>
                  {matches.find(m => m.arena === 1) ? (
                    <MatchCard match={matches.find(m => m.arena === 1)!} showPool={true} />
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                      No match scheduled
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-center mb-3 text-green-600 bg-green-50 py-2 rounded">Arena 2</h5>
                  {matches.find(m => m.arena === 2) ? (
                    <MatchCard match={matches.find(m => m.arena === 2)!} showPool={true} />
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                      No match scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
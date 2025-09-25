'use client';

import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { Match } from '@/types/team';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award, Trash2 } from 'lucide-react';

interface ScheduledMatch extends MatchWithTeams { 
  day: number;
  timeSlot: string;
  arena: 1 | 2;
}

// Storage keys for persistent scheduling
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

  // Load scheduled matches from localStorage
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

  // Save scheduled matches to localStorage
  const saveScheduledMatchesToStorage = (matches: ScheduledMatch[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SCHEDULED_MATCHES_KEY, JSON.stringify(matches));
      localStorage.setItem(SCHEDULE_GENERATED_KEY, 'true');
    } catch (error) {
      console.error('Error saving scheduled matches to storage:', error);
    }
  };

  // Check if schedule exists in storage
  const isScheduleGeneratedInStorage = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SCHEDULE_GENERATED_KEY) === 'true';
  };

  // Clear scheduled matches from storage
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
        // Load existing schedule from storage
        const scheduledMatchesData = loadScheduledMatchesFromStorage();
        
        // Update match completion status from current results
        const updatedScheduledMatches = scheduledMatchesData.map(match => {
          const currentMatch = storageUtils.getTournament().matches.find(m => m.id === match.id);
          const result = storageUtils.getMatchResult(match.id);
          
          return {
            ...match,
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
        
        // Separate pool matches from knockout/festival
        const poolOnly = updatedScheduledMatches.filter(m => m.stage === 'pool');
        const knockout = updatedScheduledMatches.filter(m => ['cup', 'plate', 'shield'].includes(m.stage));
        const festival = updatedScheduledMatches.filter(m => m.stage === 'festival');
        
        setKnockoutMatches(knockout);
        setFestivalMatches(festival);
        
        // Group by day for schedule view
        const byDay = updatedScheduledMatches.reduce((acc, match) => {
          if (!acc[match.day]) acc[match.day] = [];
          acc[match.day].push(match);
          return acc;
        }, {} as {[key: number]: ScheduledMatch[]});
        
        // Sort matches within each day by time slot
        Object.keys(byDay).forEach(day => {
          byDay[parseInt(day)].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        
        setScheduledMatches(byDay);
      } else if (poolMatchesGenerated && !scheduleGenerated) {
        // Generate new schedule if pool matches exist but no schedule
        const scheduledMatchesData = scheduleAllMatches();
        saveScheduledMatchesToStorage(scheduledMatchesData);
        setMatchesGenerated(true);
        loadMatchData(); // Reload with new schedule
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const scheduleAllMatches = (): ScheduledMatch[] => {
    const allScheduledMatches: ScheduledMatch[] = [];
    
    // 1. Schedule pool matches first (Days 1-3)
    const poolScheduled = schedulePoolMatches();
    allScheduledMatches.push(...poolScheduled);
    
    // 2. Schedule existing knockout and festival matches (Days 3-4)
    const knockoutAndFestival = scheduleExistingKnockoutAndFestivalMatches();
    allScheduledMatches.push(...knockoutAndFestival);
    
    return allScheduledMatches;
  };

  const schedulePoolMatches = (): ScheduledMatch[] => {
    const allPoolMatches: MatchWithTeams[] = [];
    
    // Get all pool matches
    ['A', 'B', 'C', 'D'].forEach(poolId => {
      const matches = getPoolMatchesWithTeams(poolId);
      allPoolMatches.push(...matches);
    });

    // Use deterministic scheduling based on match IDs to ensure consistency
    return schedulePoolMatchesDeterministic(allPoolMatches);
  };

  const schedulePoolMatchesDeterministic = (matches: MatchWithTeams[]): ScheduledMatch[] => {
    const scheduled: ScheduledMatch[] = [];
    
    // Sort matches by ID to ensure consistent ordering
    const sortedMatches = [...matches].sort((a, b) => a.id.localeCompare(b.id));
    
    // Pre-defined time slots for each day (deterministic)
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
      // Get existing knockout matches instead of generating new ones
      const tournament = storageUtils.getTournament();
      const allKnockoutMatches = tournament.matches.filter(match => 
        ['cup', 'plate', 'shield', 'festival'].includes(match.stage)
      );
      
      if (allKnockoutMatches.length === 0) {
        return scheduledKnockout;
      }
      
      // Get matches with team details
      const knockoutMatchesWithTeams = allKnockoutMatches.map(match => 
        tournamentUtils.getMatchWithTeams(match)
      );
      
      // Sort by match ID for deterministic scheduling
      const sortedKnockoutMatches = knockoutMatchesWithTeams.sort((a, b) => a.id.localeCompare(b.id));
      
      // Schedule knockout matches on days 3-4
      const day3KnockoutSlots = generateTimeSlotsWithBreaks(10, 19, 30);
      const day4Slots = generateTimeSlotsWithBreaks(7, 15);
      
      let matchIndex = 0;
      
      // Schedule Day 3 matches
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
      
      // Schedule Day 4 matches
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
      
      // Generate new schedule and save to storage
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
      
      // Update schedule with knockout matches
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
      
      // Reload match data without regenerating schedule
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
      
      // Update schedule to reflect cleared results
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

  // Show loading state initially
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

  // Pool allocation required
  if (!isAllocated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="text-blue-600" />
            Tournament Fixtures
          </h1>
          <p className="text-gray-600 mt-2">View and manage 4-day tournament schedule</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Pool Allocation Required</h3>
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="text-blue-600" />
              Tournament Fixtures
            </h1>
            <p className="text-gray-600 mt-2">
              4-day tournament schedule - Pool matches and knockout stages
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Total Pool Matches: {allMatches.filter(m => m.stage === 'pool').length} | 
              Day 1: {scheduledMatches[1]?.filter(m => m.stage === 'pool').length || 0} | 
              Day 2: {scheduledMatches[2]?.filter(m => m.stage === 'pool').length || 0} | 
              Day 3: {scheduledMatches[3]?.filter(m => m.stage === 'pool').length || 0}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
            {/* Refresh Button - Always visible when matches are generated */}
            {matchesGenerated && (
              <Button
                onClick={handleRefreshFixtures}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
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

            {!matchesGenerated && (
              <Button
                onClick={handleGenerateMatches}
                disabled={isGenerating}
                className="min-w-40"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Generate Fixtures
                  </>
                )}
              </Button>
            )}

            {matchesGenerated && (
              <div className="flex items-center gap-2">
                {tournamentUtils.isPoolStageComplete() && !tournamentUtils.areKnockoutBracketsGenerated() && (
                  <Button
                    onClick={handleGenerateKnockout}
                    disabled={isGenerating}
                    variant="default"
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Generate Knockout
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Re-generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-generate
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleClearResults}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
                
                <Button
                  onClick={handleClearMatches}
                  disabled={isGenerating}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Schedule Overview */}
      {matchesGenerated && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4-Day Tournament Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800">Day 1</div>
                <div className="text-sm text-blue-600">16:20 - 19:00</div>
                <div className="text-xs text-blue-500">16 Pool Matches</div>
                <div className="mt-2 text-lg font-bold text-blue-700">
                  {scheduledMatches[1]?.length || 0} matches
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800">Day 2</div>
                <div className="text-sm text-green-600">08:00 - 19:00</div>
                <div className="text-xs text-green-500">Lunch: 12:30-13:30</div>
                <div className="text-xs text-green-500">56 Pool Matches</div>
                <div className="mt-2 text-lg font-bold text-green-700">
                  {scheduledMatches[2]?.length || 0} matches
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-800">Day 3</div>
                <div className="text-sm text-orange-600">08:00 - 19:00</div>
                <div className="text-xs text-orange-500">Break: 09:40-10:30</div>
                <div className="text-xs text-orange-500">12 Pool + Knockouts</div>
                <div className="mt-2 text-lg font-bold text-orange-700">
                  {scheduledMatches[3]?.length || 0} matches
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-800">Day 4</div>
                <div className="text-sm text-purple-600">07:00 - 15:00</div>
                <div className="text-xs text-purple-500">Knockout Finals</div>
                <div className="mt-2 text-lg font-bold text-purple-700">
                  {scheduledMatches[4]?.length || 0} matches
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches Not Generated */}
      {!matchesGenerated && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Ready to Generate 4-Day Tournament Schedule</h3>
            <p className="text-gray-600 mb-4">
              Teams are allocated into pools. Generate the complete tournament fixture list.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Pool Stage: 84 matches across Days 1-3</p>
              <p>Knockout Stage: Cup, Plate, Shield brackets on Days 3-4</p>
              <p>Festival: 30 matches for non-qualifiers on Days 3-4</p>
              
              {totalTeams !== 28 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-orange-700 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">
                    Optimal setup is 28 teams (7 per pool). Currently have {totalTeams} teams.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Fixtures */}
      {matchesGenerated && (
        <>
          {/* Pool Status Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {['A', 'B', 'C', 'D'].map(poolId => {
              const matches = poolMatches[poolId] || [];
              const stats = getMatchStats(matches);
              const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              
              return (
                <Card key={poolId}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                      {poolId}
                    </div>
                    <div className="font-semibold mb-1">Pool {poolId}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {stats.total} matches
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stats.completed} complete</span>
                      <span>{stats.pending} pending</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Daily Schedule Tabs */}
          <Tabs defaultValue="day1" className="w-full">
            <TabsList className="grid w-full grid-cols-12">
              <TabsTrigger value="day1">Day 1</TabsTrigger>
              <TabsTrigger value="day2">Day 2</TabsTrigger>
              <TabsTrigger value="day3">Day 3</TabsTrigger>
              <TabsTrigger value="day4">Day 4</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="knockout">Knockout</TabsTrigger>
              <TabsTrigger value="A">Pool A</TabsTrigger>
              <TabsTrigger value="B">Pool B</TabsTrigger>
              <TabsTrigger value="C">Pool C</TabsTrigger>
              <TabsTrigger value="D">Pool D</TabsTrigger>
            </TabsList>

            {/* Day 1 Schedule */}
            <TabsContent value="day1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                    Day 1 Schedule (16:20 - 19:00) - {scheduledMatches[1]?.length || 0} Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDaySchedule(1)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 2 Schedule */}
            <TabsContent value="day2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-green-500" />
                    Day 2 Schedule (08:00 - 19:00, Lunch 12:30-13:30) - {scheduledMatches[2]?.length || 0} Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDaySchedule(2)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 3 Schedule */}
            <TabsContent value="day3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-orange-500" />
                    Day 3 Schedule (08:00 - 19:00, Break 09:40-10:30) - Pool Finals + Knockout Begins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDaySchedule(3)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 4 Schedule */}
            <TabsContent value="day4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-purple-500" />
                    Day 4 Schedule (07:00 - 15:00) - Knockout Finals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderDaySchedule(4)}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* All Matches */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                    All Tournament Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allMatches.length > 0 ? (
                      allMatches.map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No matches found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Matches */}
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Completed Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getCompletedMatches(allMatches).length > 0 ? (
                      getCompletedMatches(allMatches).map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No completed matches yet</p>
                        <p className="text-sm">Matches will appear here once scores are entered by administrators</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Matches */}
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Pending Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getPendingMatches(allMatches).length > 0 ? (
                      getPendingMatches(allMatches).map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                        <p className="text-green-700 font-medium">All matches completed!</p>
                        <p className="text-sm">Tournament complete</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knockout Matches */}
            <TabsContent value="knockout">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Knockout Stage Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cup Matches */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        Cup Competition
                      </h4>
                      <div className="space-y-2">
                        {knockoutMatches.filter(m => m.stage === 'cup').map(match => (
                          <MatchCard key={match.id} match={match} showPool={false} />
                        ))}
                      </div>
                    </div>

                    {/* Plate Matches */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Plate Competition
                      </h4>
                      <div className="space-y-2">
                        {knockoutMatches.filter(m => m.stage === 'plate').map(match => (
                          <MatchCard key={match.id} match={match} showPool={false} />
                        ))}
                      </div>
                    </div>

                    {/* Shield Matches */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        Shield Competition
                      </h4>
                      <div className="space-y-2">
                        {knockoutMatches.filter(m => m.stage === 'shield').map(match => (
                          <MatchCard key={match.id} match={match} showPool={false} />
                        ))}
                      </div>
                    </div>

                    {/* Festival Matches */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        Festival Matches
                      </h4>
                      <div className="space-y-2">
                        {festivalMatches.map(match => (
                          <MatchCard key={match.id} match={match} showPool={false} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pool Specific Tabs */}
            {['A', 'B', 'C', 'D'].map(poolId => (
              <TabsContent key={poolId} value={poolId}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full ${getPoolColor(poolId)}`}></div>
                      Pool {poolId} Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {poolMatches[poolId]?.length > 0 ? (
                        poolMatches[poolId].map(match => (
                          <MatchCard 
                            key={match.id} 
                            match={match}
                            showPool={false}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No matches found for Pool {poolId}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );

  // Helper function to render daily schedule
  function renderDaySchedule(day: number) {
    const dayMatches = scheduledMatches[day];
    
    if (!dayMatches || dayMatches.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No matches scheduled for Day {day}</p>
        </div>
      );
    }

    // Group matches by time slot
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
            <div key={timeSlot} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-center bg-gray-100 py-2 rounded">
                {timeSlot}
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-center mb-2 text-blue-600">Arena 1</h5>
                  {matches.find(m => m.arena === 1) ? (
                    <MatchCard match={matches.find(m => m.arena === 1)!} showPool={true} />
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded">
                      No match scheduled
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-center mb-2 text-green-600">Arena 2</h5>
                  {matches.find(m => m.arena === 2) ? (
                    <MatchCard match={matches.find(m => m.arena === 2)!} showPool={true} />
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded">
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
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

export default function ScoresPage() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [poolMatches, setPoolMatches] = useState<{[key: string]: ScheduledMatch[]}>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [allMatches, setAllMatches] = useState<ScheduledMatch[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<{[key: number]: ScheduledMatch[]}>({});
  const [knockoutMatches, setKnockoutMatches] = useState<ScheduledMatch[]>([]);
  const [festivalMatches, setFestivalMatches] = useState<ScheduledMatch[]>([]);

  useEffect(() => {
    loadMatchData();
  }, []);

  const loadMatchData = () => {
    try {
      const allocated = tournamentUtils.arePoolsAllocated();
      const generated = tournamentUtils.arePoolMatchesGenerated();
      const teams = storageUtils.getTeams();
      
      setIsAllocated(allocated);
      setMatchesGenerated(generated);
      setTotalTeams(teams.length);

      if (generated) {
        const scheduledMatchesData = scheduleAllMatches();
        const pools = {
          A: scheduledMatchesData.filter(m => m.poolId === 'A'),
          B: scheduledMatchesData.filter(m => m.poolId === 'B'),
          C: scheduledMatchesData.filter(m => m.poolId === 'C'),
          D: scheduledMatchesData.filter(m => m.poolId === 'D')
        };
        setPoolMatches(pools);
        setAllMatches(scheduledMatchesData);
        
        // Separate pool matches from knockout/festival
        const poolOnly = scheduledMatchesData.filter(m => m.stage === 'pool');
        const knockout = scheduledMatchesData.filter(m => ['cup', 'plate', 'shield'].includes(m.stage));
        const festival = scheduledMatchesData.filter(m => m.stage === 'festival');
        
        setKnockoutMatches(knockout);
        setFestivalMatches(festival);
        
        // Group by day for schedule view
        const byDay = scheduledMatchesData.reduce((acc, match) => {
          if (!acc[match.day]) acc[match.day] = [];
          acc[match.day].push(match);
          return acc;
        }, {} as {[key: number]: ScheduledMatch[]});
        
        // Sort matches within each day by time slot
        Object.keys(byDay).forEach(day => {
          byDay[parseInt(day)].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        
        setScheduledMatches(byDay);
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
    
    // 2. Generate and schedule knockout and festival matches (Days 3-4)
    const knockoutAndFestival = scheduleKnockoutAndFestivalMatches();
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

    // Generate time slots for each day with breaks
    const generateTimeSlotsWithBreaks = (startHour: number, endHour: number, startMinute: number = 0, breaks: {start: string, end: string}[] = []): string[] => {
      const slots: string[] = [];
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
        if (currentHour < endHour) {
          const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          
          // Check if this time slot falls within any break period
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

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Day 1: 16:20 - 19:00 = 8 slots, need 16 matches (2 per slot)
    const day1TimeSlots = generateTimeSlotsWithBreaks(16, 19, 20); // No breaks
    
    // Day 2: 08:00 - 19:00 with lunch break 12:30 - 13:30
    const day2TimeSlots = generateTimeSlotsWithBreaks(8, 19, 0, [
      { start: '12:30', end: '13:30' }
    ]);
    
    // Day 3: 08:00 - 09:40 (no break here since break is after pool matches)
    const day3PoolTimeSlots = generateTimeSlotsWithBreaks(8, 10); // 08:00 to 09:40

    const timeSlotsByDay = [day1TimeSlots, day2TimeSlots, day3PoolTimeSlots];
    const distribution = [16, 56, 12]; // Day 1, 2, 3

    return schedulePoolMatchesWithConstraints(allPoolMatches, timeSlotsByDay, distribution);
  };

  const schedulePoolMatchesWithConstraints = (
    matches: MatchWithTeams[], 
    timeSlotsByDay: string[][],
    distribution: number[]
  ): ScheduledMatch[] => {
    const scheduled: ScheduledMatch[] = [];
    const teamSchedules: {[teamId: string]: {day: number, timeMinutes: number}[]} = {};
    
    // Initialize team schedules
    matches.forEach(match => {
      if (!teamSchedules[match.homeTeam.id]) teamSchedules[match.homeTeam.id] = [];
      if (!teamSchedules[match.awayTeam.id]) teamSchedules[match.awayTeam.id] = [];
    });

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const canTeamPlay = (teamId: string, day: number, timeSlot: string): boolean => {
      const teamMatches = teamSchedules[teamId];
      const currentTime = timeToMinutes(timeSlot);
      
      return !teamMatches.some(scheduled => {
        if (scheduled.day !== day) return false;
        const timeDiff = Math.abs(currentTime - scheduled.timeMinutes);
        return timeDiff < 80; // 1 hour rest + 20 min match
      });
    };

    // Create a pool of unscheduled matches
    let unscheduledMatches = [...matches].sort(() => Math.random() - 0.5);
    
    // Schedule matches day by day, slot by slot
    for (let day = 1; day <= 3; day++) {
      const timeSlots = timeSlotsByDay[day - 1];
      const targetMatches = distribution[day - 1];
      let dayMatchCount = 0;
      
      // Special handling for Day 2 - ensure last 4 matches are 2 per arena
      if (day === 2) {
        // Schedule all but the last 4 matches normally
        const normalSlots = timeSlots.slice(0, -2); // All but last 2 time slots
        const lastTwoSlots = timeSlots.slice(-2); // Last 2 time slots
        
        // Schedule normal matches first
        normalSlots.forEach((timeSlot, slotIndex) => {
          const remainingMatches = targetMatches - dayMatchCount;
          const remainingSlotsIncludingLast = timeSlots.length - slotIndex;
          const avgMatchesPerSlot = remainingMatches / remainingSlotsIncludingLast;
          
          // Reserve 4 matches for the last 2 slots
          const maxForThisSlot = slotIndex < normalSlots.length - 1 ? 
            Math.min(Math.ceil(avgMatchesPerSlot), 2) : 
            Math.min(targetMatches - dayMatchCount - 4, 2);
          
          for (let arenaNum = 1; arenaNum <= 2 && dayMatchCount < targetMatches - 4; arenaNum++) {
            if (scheduled.filter(m => m.day === day && m.timeSlot === timeSlot).length >= maxForThisSlot) {
              break;
            }
            
            const arena = arenaNum as 1 | 2;
            
            // Find and schedule match
            const matchIndex = findBestMatch(unscheduledMatches, day, timeSlot, arena, scheduled, canTeamPlay);
            if (matchIndex !== -1) {
              scheduleMatch(unscheduledMatches[matchIndex], day, timeSlot, arena, scheduled, teamSchedules, timeToMinutes);
              unscheduledMatches.splice(matchIndex, 1);
              dayMatchCount++;
            }
          }
        });
        
        // Schedule exactly 2 matches in each arena for the last 2 time slots
        lastTwoSlots.forEach(timeSlot => {
          // Arena 1 match
          const arena1MatchIndex = findBestMatch(unscheduledMatches, day, timeSlot, 1, scheduled, canTeamPlay);
          if (arena1MatchIndex !== -1) {
            scheduleMatch(unscheduledMatches[arena1MatchIndex], day, timeSlot, 1, scheduled, teamSchedules, timeToMinutes);
            unscheduledMatches.splice(arena1MatchIndex, 1);
            dayMatchCount++;
          }
          
          // Arena 2 match
          const arena2MatchIndex = findBestMatch(unscheduledMatches, day, timeSlot, 2, scheduled, canTeamPlay);
          if (arena2MatchIndex !== -1) {
            scheduleMatch(unscheduledMatches[arena2MatchIndex], day, timeSlot, 2, scheduled, teamSchedules, timeToMinutes);
            unscheduledMatches.splice(arena2MatchIndex, 1);
            dayMatchCount++;
          }
        });
      } else {
        // Normal scheduling for Days 1 and 3
        const avgMatchesPerSlot = targetMatches / timeSlots.length;
        
        timeSlots.forEach((timeSlot, slotIndex) => {
          const baseMatches = Math.floor(avgMatchesPerSlot);
          const extraMatch = (slotIndex < (targetMatches % timeSlots.length)) ? 1 : 0;
          const matchesToSchedule = Math.min(baseMatches + extraMatch, 2);
          
          for (let arenaNum = 1; arenaNum <= 2 && dayMatchCount < targetMatches; arenaNum++) {
            if (scheduled.filter(m => m.day === day && m.timeSlot === timeSlot).length >= matchesToSchedule) {
              break;
            }
            
            const arena = arenaNum as 1 | 2;
            const matchIndex = findBestMatch(unscheduledMatches, day, timeSlot, arena, scheduled, canTeamPlay);
            
            if (matchIndex !== -1) {
              scheduleMatch(unscheduledMatches[matchIndex], day, timeSlot, arena, scheduled, teamSchedules, timeToMinutes);
              unscheduledMatches.splice(matchIndex, 1);
              dayMatchCount++;
            }
          }
        });
      }
    }
    
    return scheduled;
    
    // Helper functions
    function findBestMatch(
      availableMatches: MatchWithTeams[], 
      day: number, 
      timeSlot: string, 
      arena: 1 | 2, 
      currentScheduled: ScheduledMatch[],
      canTeamPlayFn: (teamId: string, day: number, timeSlot: string) => boolean
    ): number {
      let bestMatchIndex = -1;
      
      for (let i = 0; i < availableMatches.length; i++) {
        const match = availableMatches[i];
        
        // Check if arena is free
        const arenaUsed = currentScheduled.some(m => 
          m.day === day && m.timeSlot === timeSlot && m.arena === arena
        );
        if (arenaUsed) continue;
        
        // Prefer not to have same pool in same time slot
        const samePoolAtTime = currentScheduled.some(m => 
          m.day === day && m.timeSlot === timeSlot && m.poolId === match.poolId
        );
        
        // Check if both teams can play
        const teamsCanPlay = canTeamPlayFn(match.homeTeam.id, day, timeSlot) && 
                           canTeamPlayFn(match.awayTeam.id, day, timeSlot);
        
        if (teamsCanPlay && !samePoolAtTime) {
          bestMatchIndex = i;
          break;
        } else if (teamsCanPlay && bestMatchIndex === -1) {
          bestMatchIndex = i;
        }
      }
      
      // If no ideal match, find any available match
      if (bestMatchIndex === -1) {
        for (let i = 0; i < availableMatches.length; i++) {
          const arenaUsed = currentScheduled.some(m => 
            m.day === day && m.timeSlot === timeSlot && m.arena === arena
          );
          if (!arenaUsed) {
            bestMatchIndex = i;
            break;
          }
        }
      }
      
      return bestMatchIndex;
    }
    
    function scheduleMatch(
      match: MatchWithTeams,
      day: number,
      timeSlot: string,
      arena: 1 | 2,
      scheduledList: ScheduledMatch[],
      teamSchedulesList: {[teamId: string]: {day: number, timeMinutes: number}[]},
      timeToMinutesFn: (time: string) => number
    ): void {
      const timeMinutes = timeToMinutesFn(timeSlot);
      
      const scheduledMatch: ScheduledMatch = {
        ...match,
        day: day,
        timeSlot: timeSlot,
        arena: arena
      };
      
      scheduledList.push(scheduledMatch);
      
      // Update team schedules
      teamSchedulesList[match.homeTeam.id].push({day, timeMinutes});
      teamSchedulesList[match.awayTeam.id].push({day, timeMinutes});
    }
  };

  const scheduleKnockoutAndFestivalMatches = (): ScheduledMatch[] => {
    const scheduledKnockout: ScheduledMatch[] = [];
    
    // Generate knockout structure if pool stage is complete
    if (tournamentUtils.isPoolStageComplete()) {
      try {
        // Generate the bracket structure
        const bracket = tournamentUtils.generateCupBracket();
        
        // Get all knockout matches
        const cupMatches = Object.values(bracket).flat().filter(Boolean);
        const plateMatches = tournamentUtils.getPlateBracket();
        const shieldMatches = tournamentUtils.getShieldBracket();
        const festivalMatchesRaw = tournamentUtils.getFestivalMatches();
        
        // Generate festival matches (30 total) if not exists
        let actualFestivalMatches: Match[] = festivalMatchesRaw;
        if (festivalMatchesRaw.length === 0 || festivalMatchesRaw.length !== 30) {
          actualFestivalMatches = generateLimitedFestivalMatches();
        }
        
        // Schedule knockout matches on days 3-4
        const day3KnockoutSlots = generateTimeSlotsWithBreaks(10, 19, 30); // 10:30 - 19:00 (after break)
        const day4Slots = generateTimeSlotsWithBreaks(7, 15); // 07:00 - 15:00
        
        // Schedule Round of 16 on Day 3 (Arena 1)
        const roundOf16Matches = cupMatches.filter(m => m.round === 'round-of-16');
        roundOf16Matches.forEach((match, index) => {
          if (index < day3KnockoutSlots.length) {
            const matchWithTeams = tournamentUtils.getMatchWithTeams(match);
            scheduledKnockout.push({
              ...matchWithTeams,
              day: 3,
              timeSlot: day3KnockoutSlots[index],
              arena: 1
            });
          }
        });
        
        // Schedule Festival matches on Days 3-4 (Arena 2)
        let festivalIndex = 0;
        // Day 3 festival matches (Arena 2)
        day3KnockoutSlots.forEach(timeSlot => {
          if (festivalIndex < actualFestivalMatches.length) {
            const match = actualFestivalMatches[festivalIndex];
            const matchWithTeams = tournamentUtils.getMatchWithTeams(match);
            scheduledKnockout.push({
              ...matchWithTeams,
              day: 3,
              timeSlot: timeSlot,
              arena: 2
            });
            festivalIndex++;
          }
        });
        
        // Day 4 matches - mix of knockout progression and remaining festival
        let knockoutIndex = 0;
        const day4KnockoutMatches = [
          ...cupMatches.filter(m => m.round !== 'round-of-16'),
          ...Object.values(plateMatches).flat().filter(Boolean),
          ...Object.values(shieldMatches).flat().filter(Boolean)
        ];
        
        day4Slots.forEach(timeSlot => {
          // Arena 1 - Knockout matches
          if (knockoutIndex < day4KnockoutMatches.length) {
            const match = day4KnockoutMatches[knockoutIndex];
            const matchWithTeams = tournamentUtils.getMatchWithTeams(match);
            scheduledKnockout.push({
              ...matchWithTeams,
              day: 4,
              timeSlot: timeSlot,
              arena: 1
            });
            knockoutIndex++;
          }
          
          // Arena 2 - Festival matches
          if (festivalIndex < actualFestivalMatches.length) {
            const match = actualFestivalMatches[festivalIndex];
            const matchWithTeams = tournamentUtils.getMatchWithTeams(match);
            scheduledKnockout.push({
              ...matchWithTeams,
              day: 4,
              timeSlot: timeSlot,
              arena: 2
            });
            festivalIndex++;
          }
        });
        
      } catch (error) {
        console.error('Error generating knockout structure:', error);
      }
    }
    
    return scheduledKnockout;
  };

  const generateTimeSlotsForDay = (startHour: number, endHour: number, startMinute: number = 0): string[] => {
    const slots: string[] = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
      if (currentHour < endHour) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
      
      currentMinute += 20;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    return slots;
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
        
        // Check if this time slot falls within any break period
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

  const generateLimitedFestivalMatches = (): Match[] => {
    // Generate 30 festival matches from non-qualifiers
    const festivalTeams: string[] = [];
    ['A', 'B', 'C', 'D'].forEach(poolId => {
      const nonQualifiers = tournamentUtils.getPoolNonQualifiers(poolId);
      nonQualifiers.forEach(team => festivalTeams.push(team.id));
    });
    
    const matches: Match[] = [];
    const teamMatchCounts: { [teamId: string]: number } = {};
    
    festivalTeams.forEach(teamId => {
      teamMatchCounts[teamId] = 0;
    });
    
    const maxMatchesPerTeam = 5;
    let matchCount = 0;
    
    // Generate matches ensuring each team plays roughly equal amounts
    while (matchCount < 30 && festivalTeams.length >= 2) {
      // Find teams with fewer matches
      const availableTeams = festivalTeams.filter(teamId => teamMatchCounts[teamId] < maxMatchesPerTeam);
      
      if (availableTeams.length < 2) break;
      
      // Randomly select two teams
      const team1 = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      let team2 = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      
      while (team2 === team1 && availableTeams.length > 1) {
        team2 = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      }
      
      if (team1 !== team2) {
        matches.push({
          id: `festival-${team1}-${team2}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          homeTeamId: team1,
          awayTeamId: team2,
          stage: 'festival' as const,
          completed: false
        });
        
        teamMatchCounts[team1]++;
        teamMatchCounts[team2]++;
        matchCount++;
      }
    }
    
    return matches;
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
      loadMatchData();
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setIsGenerating(false);
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
              {/* <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="knockout">Knockout</TabsTrigger> */}
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
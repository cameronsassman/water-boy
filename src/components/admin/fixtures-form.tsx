// components/fixtures-form.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle, Loader2, Filter, Group, Eye, EyeOff } from 'lucide-react';
import { matchService } from '@/utils/storage';
import { teamService } from '@/utils/storage';
import { tournamentUtils } from '@/utils/tournament-logic';

interface Player {
  id: string;
  name: string;
  capNumber: number;
}

interface Team {
  id: string;
  schoolName: string;
  players: Player[];
  poolAllocation?: string;
  poolId?: string;
}

interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  poolId?: string;
  stage: string;
  day: number;
  timeSlot: string;
  arena: number;
  completed: boolean;
  homeScore?: number;
  awayScore?: number;
  round?: string;
}

interface NewFixtureForm {
  day: number;
  timeSlot: string;
  arena: number;
  homeTeamId: string;
  awayTeamId: string;
  poolId: string;
  stage: string;
  round: string;
}

export default function ManualFixtureEntry() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [groupByStage, setGroupByStage] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterRound, setFilterRound] = useState<string>('all');
  
  const [newFixture, setNewFixture] = useState<NewFixtureForm>({
    day: 1,
    timeSlot: '16:20',
    arena: 1,
    homeTeamId: '',
    awayTeamId: '',
    poolId: 'A',
    stage: 'pool',
    round: 'group'
  });

  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isFilteringTeams, setIsFilteringTeams] = useState(false);

  useEffect(() => {
    loadTeams();
    loadFixtures();
  }, []);

const getFilteredTeams = async (): Promise<Team[]> => {
  try {
    if (teams.length === 0) return [];

    console.log('=== FILTERING TEAMS ===');
    console.log('Stage:', newFixture.stage);
    console.log('Round:', newFixture.round);
    console.log('Total teams available:', teams.length);

    let result: Team[] = [];

    switch (newFixture.stage) {
      case 'pool':
        const poolTeams = teams.filter(team => {
          const teamPool = team.poolId || team.poolAllocation;
          return teamPool === newFixture.poolId;
        });
        console.log(`Pool ${newFixture.poolId} teams:`, poolTeams.map(t => t.schoolName));
        result = poolTeams;
        break;
      
      case 'cup':
        result = await getCupQualifiedTeams(newFixture.round);
        break;
      
      case 'plate':
        result = await getPlateQualifiedTeams(newFixture.round);
        break;
      
      case 'shield':
        result = await getShieldQualifiedTeams(newFixture.round);
        break;
      
      case 'playoff':
        result = await getPlayoffQualifiedTeams(newFixture.round);
        break;
      
      case 'festival':
        result = await getFestivalQualifiedTeams();
        break;
      
      default:
        result = teams;
    }

    // Ensure we always return an array, even if empty
    if (!result || !Array.isArray(result)) {
      console.warn('Invalid result from team filtering, returning empty array');
      result = [];
    }

    console.log('Final filtered teams:', result.length, 'teams');
    console.log('=== END FILTERING ===');
    return result;
  } catch (error) {
    console.error('Error getting filtered teams:', error);
    // Return empty array instead of all teams to avoid confusion
    return [];
  }
};

  const getCupQualifiedTeams = async (round: string): Promise<Team[]> => {
    try {
      if (round === 'round-of-16') {
        // For Cup Round of 16, get top 4 from ALL pools
        const allQualifiers: Team[] = [];
        
        // Get qualifiers from all pools
        const pools = ['A', 'B', 'C', 'D'];
        for (const poolId of pools) {
          try {
            // Use a simplified approach - get teams from the pool directly
            const poolTeams = teams.filter(team => {
              const teamPool = team.poolId || team.poolAllocation;
              return teamPool === poolId;
            });
            
            // For demo purposes, take first 4 teams from each pool
            // In real scenario, this would be based on standings
            const qualifiers = poolTeams.slice(0, 4);
            console.log(`Pool ${poolId} qualifiers:`, qualifiers.map(q => q.schoolName));
            allQualifiers.push(...qualifiers);
          } catch (error) {
            console.error(`Error getting qualifiers for pool ${poolId}:`, error);
            // Fallback: take any teams from this pool
            const poolTeams = teams.filter(team => {
              const teamPool = team.poolId || team.poolAllocation;
              return teamPool === poolId;
            });
            allQualifiers.push(...poolTeams.slice(0, 4));
          }
        }
        
        console.log('All Cup R16 qualifiers:', allQualifiers.map(q => q.schoolName));
        return allQualifiers;
      } else {
        // For later rounds, return empty for now (you can implement progression later)
        console.log(`Cup ${round} - returning empty for now`);
        return [];
      }
    } catch (error) {
      console.error('Error getting cup qualified teams:', error);
      // Fallback: return some teams for demo
      return teams.slice(0, 8);
    }
  };
  
  // Get teams qualified for Plate rounds
  const getPlateQualifiedTeams = async (round: string): Promise<Team[]> => {
    try {
      if (round === 'round-of-16') {
        // For demo, return some teams - in real scenario these would be Cup R16 losers
        console.log('Plate R16 - returning demo teams');
        return teams.slice(8, 16); // Next 8 teams
      } else {
        console.log(`Plate ${round} - returning empty for now`);
        return [];
      }
    } catch (error) {
      console.error('Error getting plate qualified teams:', error);
      return teams.slice(8, 16);
    }
  };
  
  // Get teams qualified for Shield rounds
  const getShieldQualifiedTeams = async (round: string): Promise<Team[]> => {
    try {
      if (round === 'quarter-final') {
        // For demo, return some teams
        console.log('Shield QF - returning demo teams');
        return teams.slice(16, 24); // Next 8 teams
      } else {
        console.log(`Shield ${round} - returning empty for now`);
        return [];
      }
    } catch (error) {
      console.error('Error getting shield qualified teams:', error);
      return teams.slice(16, 24);
    }
  };
  
  // Get teams for Playoff rounds
  const getPlayoffQualifiedTeams = async (round: string): Promise<Team[]> => {
    try {
      // For demo, return remaining teams
      console.log(`Playoff ${round} - returning demo teams`);
      return teams.slice(24); // Remaining teams
    } catch (error) {
      console.error('Error getting playoff qualified teams:', error);
      return teams.slice(24);
    }
  };
  
  // Get teams for Festival matches
  const getFestivalQualifiedTeams = async (): Promise<Team[]> => {
    try {
      // For demo, return all teams for festival
      console.log('Festival - returning all teams for demo');
      return teams;
    } catch (error) {
      console.error('Error getting festival qualified teams:', error);
      return teams;
    }
  };

  // Generic function to get teams from previous round
  const getTeamsFromPreviousRound = async (stage: string, currentRound: string): Promise<Team[]> => {
    console.log(`Getting teams for ${stage} ${currentRound} from previous round - returning empty for now`);
    return [];
  };

  // Helper to get previous round based on current round
  const getPreviousRound = (stage: string, currentRound: string): string | null => {
    const roundProgressions: Record<string, Record<string, string>> = {
      cup: {
        'quarter-final': 'round-of-16',
        'semi-final': 'quarter-final',
        'final': 'semi-final',
        'third-place': 'semi-final'
      },
      plate: {
        'quarter-final': 'round-of-16',
        'semi-final': 'quarter-final',
        'final': 'semi-final',
        'third-place': 'semi-final'
      },
      shield: {
        'semi-final': 'quarter-final',
        'final': 'semi-final',
        'third-place': 'semi-final'
      },
      playoff: {
        '13th-14th': 'playoff-round-1',
        '15th-16th': 'playoff-round-1'
      }
    };

    return roundProgressions[stage]?.[currentRound] || null;
  };

  // Helper to get matches by stage and round
  const getMatchesByStageAndRound = async (stage: string, round: string): Promise<any[]> => {
    try {
      const bracketStatus = await tournamentUtils.getBracketStatus();
      
      switch (stage) {
        case 'cup':
          const cupBracket = bracketStatus.cupBracket;
          if (!cupBracket) return [];
          return (cupBracket as any)[getRoundPropertyName(round)] || [];
        case 'plate':
          const plateBracket = bracketStatus.plateBracket;
          if (!plateBracket) return [];
          return (plateBracket as any)[getRoundPropertyName(round)] || [];
        case 'shield':
          const shieldBracket = bracketStatus.shieldBracket;
          if (!shieldBracket) return [];
          return (shieldBracket as any)[getRoundPropertyName(round)] || [];
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error getting ${stage} ${round} matches:`, error);
      return [];
    }
  };

  // Helper to map round names to bracket property names
  const getRoundPropertyName = (round: string): string => {
    const roundMap: Record<string, string> = {
      'round-of-16': 'roundOf16',
      'quarter-final': 'quarterFinals',
      'semi-final': 'semiFinals',
      'final': 'final',
      'third-place': 'thirdPlace',
      'plate-round-of-16': 'round1',
      'plate-quarter-final': 'quarterFinals',
      'plate-semi-final': 'semiFinals',
      'plate-final': 'final',
      'plate-third-place': 'thirdPlace',
      'shield-quarter-final': 'quarterFinals',
      'shield-semi-final': 'semiFinals',
      'shield-final': 'final',
      'shield-third-place': 'thirdPlace',
      'playoff-round-1': 'round1'
    };
    
    return roundMap[round] || round;
  };

  // Update the useEffect that filters teams:
  useEffect(() => {
    const updateFilteredTeams = async () => {
      if (teams.length === 0) {
        setFilteredTeams([]);
        setIsFilteringTeams(false);
        return;
      }
      
      setIsFilteringTeams(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Team filtering taking too long, using fallback');
        setIsFilteringTeams(false);
        setFilteredTeams(teams.slice(0, 8)); // Fallback teams
      }, 5000); // 5 second timeout
      
      try {
        const filtered = await getFilteredTeams();
        clearTimeout(timeoutId);
        setFilteredTeams(filtered);
        setIsFilteringTeams(false);
      } catch (error) {
        console.error('Error in team filtering:', error);
        clearTimeout(timeoutId);
        setFilteredTeams(teams.slice(0, 8)); // Fallback teams
        setIsFilteringTeams(false);
      }
    };
    
    updateFilteredTeams();
  }, [newFixture.stage, newFixture.round, newFixture.poolId, teams]);

  const loadTeams = async () => {
    try {
      console.log('Loading teams from database...');
      const teamsData = await teamService.getTeams();
      console.log('Teams loaded:', teamsData.map(t => ({
        name: t.schoolName,
        poolId: t.poolId,
        poolAllocation: t.poolAllocation
      })));
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
      alert('Failed to load teams from database');
    }
  };

  const loadFixtures = async () => {
    try {
      setIsLoading(true);
      console.log('Loading fixtures from database...');
      const fixturesData = await matchService.getMatches();
      console.log('Fixtures loaded:', fixturesData);
      setFixtures(fixturesData);
    } catch (error) {
      console.error('Error loading fixtures:', error);
      alert('Failed to load fixtures from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to check pool standings
  const debugPoolStandings = async () => {
    console.log('=== DEBUG POOL STANDINGS ===');
    const pools = ['A', 'B', 'C', 'D'];
    
    for (const poolId of pools) {
      try {
        const standings = await tournamentUtils.getPoolStandings(poolId);
        console.log(`Pool ${poolId} standings:`, standings.map(s => ({
          team: s.team.schoolName,
          points: s.points,
          position: standings.indexOf(s) + 1
        })));
        
        const qualifiers = await tournamentUtils.getPoolQualifiers(poolId);
        console.log(`Pool ${poolId} qualifiers:`, qualifiers.map(q => q.schoolName));
        
        const nonQualifiers = await tournamentUtils.getPoolNonQualifiers(poolId);
        console.log(`Pool ${poolId} non-qualifiers:`, nonQualifiers.map(q => q.schoolName));
      } catch (error) {
        console.error(`Error with pool ${poolId}:`, error);
      }
    }
    console.log('=== END DEBUG ===');
  };

  // Check and allocate pools if needed
  const checkAndAllocatePools = async () => {
    try {
      const arePoolsAllocated = await tournamentUtils.arePoolsAllocated();
      console.log('Pools allocated:', arePoolsAllocated);
      
      if (!arePoolsAllocated) {
        console.log('Allocating teams to pools...');
        await tournamentUtils.allocateTeamsToPools();
        await loadTeams(); // Reload teams
        console.log('Pools allocated successfully');
      }
      
      // Debug the allocation
      const teamsWithPools = teams.filter(t => t.poolId || t.poolAllocation);
      console.log('Teams with pool assignments:', teamsWithPools.length);
      console.log('Pool distribution:', {
        A: teams.filter(t => (t.poolId || t.poolAllocation) === 'A').length,
        B: teams.filter(t => (t.poolId || t.poolAllocation) === 'B').length,
        C: teams.filter(t => (t.poolId || t.poolAllocation) === 'C').length,
        D: teams.filter(t => (t.poolId || t.poolAllocation) === 'D').length,
      });
    } catch (error) {
      console.error('Error with pool allocation:', error);
    }
  };

  // Call this when component mounts
  useEffect(() => {
    if (teams.length > 0) {
      checkAndAllocatePools();
    }
  }, [teams]);

  // Predefined time slots for each day
  const getTimeSlots = (day: number): string[] => {
    switch (day) {
      case 1:
        return [
          '16:20', '16:40', '17:00', '17:20', '17:40', 
          '18:00', '18:20', '18:40', '19:00'
        ];
      case 2:
        return [
          '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
          '10:00', '10:20', '10:40', '11:00', '11:20', '11:40',
          '12:00', '12:20',
          '13:30', '13:50',
          '14:00', '14:20', '14:40', '15:00', '15:20', '15:40',
          '16:00', '16:20', '16:40', '17:00', '17:20', '17:40',
          '18:00', '18:20', '18:40', '19:00'
        ];
      case 3:
        return [
          '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
          '10:30', '10:50',
          '11:00', '11:20', '11:40', '12:00', '12:20', '12:40',
          '13:00', '13:20', '13:40', '14:00', '14:20', '14:40',
          '15:00', '15:20', '15:40', '16:00', '16:20', '16:40',
          '17:00', '17:20', '17:40', '18:00', '18:20', '18:40', '19:00'
        ];
      case 4:
        return [
          '07:00', '07:20', '07:40', '08:00', '08:20', '08:40',
          '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
          '11:00', '11:20', '11:40', '12:00', '12:20', '12:40',
          '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00'
        ];
      default:
        return ['08:00'];
    }
  };

  // Round options based on stage
  const getRoundOptions = (stage: string): { value: string; label: string }[] => {
    switch (stage) {
      case 'pool':
        return [
          { value: 'group', label: 'Group Stage' }
        ];
      case 'cup':
        return [
          { value: 'round-of-16', label: 'Round of 16' },
          { value: 'quarter-final', label: 'Quarter Final' },
          { value: 'semi-final', label: 'Semi Final' },
          { value: 'final', label: 'Final' },
          { value: 'third-place', label: 'Third Place' }
        ];
      case 'plate':
        return [
          { value: 'round-of-16', label: 'Plate Round of 16' },
          { value: 'quarter-final', label: 'Plate Quarter Final' },
          { value: 'semi-final', label: 'Plate Semi Final' },
          { value: 'final', label: 'Plate Final' },
          { value: 'third-place', label: 'Plate Third Place' }
        ];
      case 'shield':
        return [
          { value: 'quarter-final', label: 'Shield Quarter Final' },
          { value: 'semi-final', label: 'Shield Semi Final' },
          { value: 'final', label: 'Shield Final' },
          { value: 'third-place', label: 'Shield Third Place' }
        ];
      case 'playoff':
        return [
          { value: 'playoff-round-1', label: 'Playoff Round 1' },
          { value: '13th-14th', label: '13th/14th Playoff' },
          { value: '15th-16th', label: '15th/16th Playoff' }
        ];
      case 'festival':
        return [
          { value: 'friendly', label: 'Friendly Match' },
          { value: 'exhibition', label: 'Exhibition Match' }
        ];
      default:
        return [{ value: 'group', label: 'Group Stage' }];
    }
  };

  // Enhanced stage change handler with validation
  const handleStageChange = (newStage: string) => {
    const roundOptions = getRoundOptions(newStage);
    const newRound = roundOptions[0]?.value || 'group';
    
    setNewFixture({ 
      ...newFixture, 
      stage: newStage,
      round: newRound,
      homeTeamId: '',
      awayTeamId: '',
      poolId: newStage === 'pool' ? newFixture.poolId : 'A'
    });
  };

  // Enhanced round change handler
  const handleRoundChange = (newRound: string) => {
    setNewFixture({ 
      ...newFixture, 
      round: newRound,
      homeTeamId: '',
      awayTeamId: ''
    });
  };

  // Add validation before creating fixture
  const validateFixture = (): string | null => {
    if (!newFixture.homeTeamId || !newFixture.awayTeamId) {
      return 'Please select both teams';
    }

    if (newFixture.homeTeamId === newFixture.awayTeamId) {
      return 'Teams must be different';
    }

    const homeTeam = teams.find(t => t.id === newFixture.homeTeamId);
    const awayTeam = teams.find(t => t.id === newFixture.awayTeamId);
    
    if (!homeTeam || !awayTeam) {
      return 'Selected teams not found';
    }

    if (!filteredTeams.find(t => t.id === newFixture.homeTeamId)) {
      return 'Home team is not qualified for this round';
    }

    if (!filteredTeams.find(t => t.id === newFixture.awayTeamId)) {
      return 'Away team is not qualified for this round';
    }

    return null;
  };

  const addFixture = async () => {
    const validationError = validateFixture();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsSaving(true);
      
      const fixtureData = {
        day: newFixture.day,
        timeSlot: newFixture.timeSlot,
        arena: newFixture.arena,
        homeTeamId: newFixture.homeTeamId,
        awayTeamId: newFixture.awayTeamId,
        poolId: newFixture.stage === 'pool' ? newFixture.poolId : undefined,
        stage: newFixture.stage,
        round: newFixture.round
      };

      console.log('Creating fixture:', fixtureData);
      
      const createdFixture = await matchService.createMatch(fixtureData);
      console.log('Fixture created:', createdFixture);
      
      await loadFixtures();

      setNewFixture({
        ...newFixture,
        homeTeamId: '',
        awayTeamId: ''
      });

    } catch (error: any) {
      console.error('Error creating fixture:', error);
      alert(error.message || 'Failed to create fixture');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFixture = async (fixtureId: string) => {
    if (!confirm('Are you sure you want to delete this fixture?')) {
      return;
    }

    try {
      await matchService.deleteMatch(fixtureId);
      setFixtures(fixtures.filter(f => f.id !== fixtureId));
    } catch (error: any) {
      console.error('Error deleting fixture:', error);
      alert(error.message || 'Failed to delete fixture');
    }
  };

  const clearAllFixtures = async () => {
    if (!confirm('Are you sure you want to clear all fixtures? This action cannot be undone.')) {
      return;
    }

    try {
      for (const fixture of fixtures) {
        await matchService.deleteMatch(fixture.id);
      }
      setFixtures([]);
      alert('All fixtures cleared successfully');
    } catch (error: any) {
      console.error('Error clearing fixtures:', error);
      alert(error.message || 'Failed to clear fixtures');
    }
  };

  const exportFixtures = () => {
    const dataStr = JSON.stringify(fixtures, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fixtures.json';
    link.click();
  };

  const importFixtures = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedFixtures = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importedFixtures)) {
          throw new Error('Invalid file format');
        }

        let successCount = 0;
        let errorCount = 0;

        for (const fixtureData of importedFixtures) {
          try {
            await matchService.createMatch(fixtureData);
            successCount++;
          } catch (error) {
            console.error('Error importing fixture:', error);
            errorCount++;
          }
        }

        await loadFixtures();
        
        alert(`Fixtures imported successfully! ${successCount} created, ${errorCount} failed.`);
        
      } catch (error) {
        console.error('Error importing fixtures:', error);
        alert('Error importing fixtures. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.schoolName : 'Unknown';
  };

  // Group fixtures by stage and round
  const groupedFixtures = fixtures.reduce((acc, fixture) => {
    if (!showCompleted && fixture.completed) return acc;
    
    const stage = fixture.stage;
    const round = fixture.round || 'unknown';
    
    if (!acc[stage]) acc[stage] = {};
    if (!acc[stage][round]) acc[stage][round] = [];
    
    acc[stage][round].push(fixture);
    return acc;
  }, {} as Record<string, Record<string, Fixture[]>>);

  // Get unique stages and rounds for filtering
  const stages = Array.from(new Set(fixtures.map(f => f.stage))).sort();
  const rounds = Array.from(new Set(fixtures.map(f => f.round || 'unknown'))).sort();

  // Filter fixtures based on stage and round
  const filteredFixtures = fixtures.filter(fixture => {
    if (!showCompleted && fixture.completed) return false;
    if (filterStage !== 'all' && fixture.stage !== filterStage) return false;
    if (filterRound !== 'all' && (fixture.round || 'unknown') !== filterRound) return false;
    return true;
  });

  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      pool: 'bg-blue-100 text-blue-800 border-blue-200',
      cup: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      plate: 'bg-green-100 text-green-800 border-green-200',
      shield: 'bg-purple-100 text-purple-800 border-purple-200',
      playoff: 'bg-red-100 text-red-800 border-red-200',
      festival: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoundLabel = (stage: string, round: string): string => {
    const roundOptions = getRoundOptions(stage);
    const option = roundOptions.find(opt => opt.value === round);
    return option ? option.label : round;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p>Loading fixtures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Tournament Fixtures
          </h1>
          <p className="text-gray-600 mt-2">Create and manage tournament fixtures and brackets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportFixtures} variant="outline" size="sm">
            Export
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>Import</span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importFixtures}
              className="hidden"
            />
          </label>
          <Button onClick={clearAllFixtures} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Debug buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={debugPoolStandings}
          variant="outline"
          size="sm"
        >
          Debug Pool Standings
        </Button>
        <Button 
          onClick={checkAndAllocatePools}
          variant="outline"
          size="sm"
        >
          Allocate Pools
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{fixtures.length}</div>
            <div className="text-sm text-gray-600">Total Fixtures</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {fixtures.filter(f => f.stage === 'pool').length}
            </div>
            <div className="text-sm text-gray-600">Pool Matches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {fixtures.filter(f => f.stage !== 'pool').length}
            </div>
            <div className="text-sm text-gray-600">Knockout Matches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {fixtures.filter(f => f.completed).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Fixture Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Fixture
            {!isFilteringTeams && filteredTeams.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredTeams.length} qualified teams
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Day</label>
              <select
                value={newFixture.day}
                onChange={(e) => {
                  const selectedDay = parseInt(e.target.value);
                  setNewFixture({ 
                    ...newFixture, 
                    day: selectedDay,
                    timeSlot: getTimeSlots(selectedDay)[0]
                  });
                }}
                className="w-full p-2 border rounded"
              >
                <option value={1}>Day 1</option>
                <option value={2}>Day 2</option>
                <option value={3}>Day 3</option>
                <option value={4}>Day 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Slot</label>
              <select
                value={newFixture.timeSlot}
                onChange={(e) => setNewFixture({ ...newFixture, timeSlot: e.target.value })}
                className="w-full p-2 border rounded"
              >
                {getTimeSlots(newFixture.day).map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Arena</label>
              <select
                value={newFixture.arena}
                onChange={(e) => setNewFixture({ ...newFixture, arena: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              >
                <option value={1}>Aquatic Centre</option>
                <option value={2}>High School Pool</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stage</label>
              <select
                value={newFixture.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="pool">Pool</option>
                <option value="cup">Cup</option>
                <option value="plate">Plate</option>
                <option value="shield">Shield</option>
                <option value="playoff">Playoff</option>
                <option value="festival">Festival</option>
              </select>
            </div>

            {newFixture.stage === 'pool' && (
              <div>
                <label className="block text-sm font-medium mb-2">Pool</label>
                <select
                  value={newFixture.poolId}
                  onChange={(e) => {
                    setNewFixture({ 
                      ...newFixture, 
                      poolId: e.target.value,
                      homeTeamId: '',
                      awayTeamId: ''
                    });
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="A">Pool A</option>
                  <option value="B">Pool B</option>
                  <option value="C">Pool C</option>
                  <option value="D">Pool D</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Round</label>
              <select
                value={newFixture.round}
                onChange={(e) => handleRoundChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {getRoundOptions(newFixture.stage).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={newFixture.stage === 'pool' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-sm font-medium mb-2">
                Home Team
                {!isFilteringTeams && filteredTeams.length > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({filteredTeams.length} qualified)
                  </span>
                )}
              </label>
              <select
                value={newFixture.homeTeamId}
                onChange={(e) => setNewFixture({ ...newFixture, homeTeamId: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={isFilteringTeams}
              >
                <option value="">
                  {isFilteringTeams ? 'Loading teams...' : 
                   filteredTeams.length === 0 ? 'No teams available' : 'Select team...'}
                </option>
                {filteredTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.schoolName}
                    {(team.poolId || team.poolAllocation) && ` (Pool ${team.poolId || team.poolAllocation})`}
                  </option>
                ))}
              </select>
              {!isFilteringTeams && filteredTeams.length === 0 && newFixture.stage === 'pool' && (
                <p className="text-xs text-orange-600 mt-1">
                  No teams found in Pool {newFixture.poolId}. Allocate teams to pools first.
                </p>
              )}
            </div>

            <div className={newFixture.stage === 'pool' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-sm font-medium mb-2">
                Away Team
                {!isFilteringTeams && filteredTeams.length > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({filteredTeams.length} qualified)
                  </span>
                )}
              </label>
              <select
                value={newFixture.awayTeamId}
                onChange={(e) => setNewFixture({ ...newFixture, awayTeamId: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={isFilteringTeams}
              >
                <option value="">
                  {isFilteringTeams ? 'Loading teams...' : 
                   filteredTeams.length === 0 ? 'No teams available' : 'Select team...'}
                </option>
                {filteredTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.schoolName}
                    {(team.poolId || team.poolAllocation) && ` (Pool ${team.poolId || team.poolAllocation})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button 
            onClick={addFixture} 
            disabled={isSaving || isFilteringTeams || filteredTeams.length === 0}
            className="mt-4 w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : isFilteringTeams ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Teams...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Fixture
                {filteredTeams.length === 0 && ' (No teams available)'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Filters and View Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="all">All Stages</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="all">All Rounds</option>
              {rounds.map(round => (
                <option key={round} value={round}>
                  {round === 'unknown' ? 'No Round' : round}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={() => setShowCompleted(!showCompleted)}
                variant={showCompleted ? "default" : "outline"}
                size="sm"
              >
                {showCompleted ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {showCompleted ? 'Show All' : 'Hide Completed'}
              </Button>

              <Button
                onClick={() => setGroupByStage(!groupByStage)}
                variant={groupByStage ? "default" : "outline"}
                size="sm"
              >
                <Group className="w-4 h-4 mr-2" />
                {groupByStage ? 'Grouped' : 'Ungrouped'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixtures List */}
      {fixtures.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Fixtures Added</h3>
            <p className="text-gray-600">Start by adding your first fixture above</p>
          </CardContent>
        </Card>
      ) : groupByStage ? (
        // Grouped View
        Object.keys(groupedFixtures).map(stage => (
          <Card key={stage}>
            <CardHeader className={`border-b ${getStageColor(stage).split(' ')[0]}`}>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge className={getStageColor(stage)}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </Badge>
                  <span>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)} Stage
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      {Object.values(groupedFixtures[stage]).flat().length} matches
                    </span>
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(groupedFixtures[stage]).map(round => (
                <div key={round} className="border-b last:border-b-0">
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg">
                      {getRoundLabel(stage, round)}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({groupedFixtures[stage][round].length} matches)
                      </span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {groupedFixtures[stage][round]
                      .sort((a, b) => a.day - b.day || a.timeSlot.localeCompare(b.timeSlot))
                      .map((fixture) => (
                      <FixtureItem 
                        key={fixture.id} 
                        fixture={fixture} 
                        onDelete={deleteFixture}
                        getTeamName={getTeamName}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      ) : (
        // Ungrouped View
        <Card>
          <CardHeader>
            <CardTitle>All Fixtures ({filteredFixtures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredFixtures
                .sort((a, b) => a.day - b.day || a.timeSlot.localeCompare(b.timeSlot))
                .map((fixture) => (
                <FixtureItem 
                  key={fixture.id} 
                  fixture={fixture} 
                  onDelete={deleteFixture}
                  getTeamName={getTeamName}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Separate FixtureItem component for better organization
function FixtureItem({ 
  fixture, 
  onDelete, 
  getTeamName 
}: { 
  fixture: Fixture; 
  onDelete: (id: string) => void;
  getTeamName: (id: string) => string;
}) {
  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      pool: 'bg-blue-100 text-blue-800 border-blue-200',
      cup: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      plate: 'bg-green-100 text-green-800 border-green-200',
      shield: 'bg-purple-100 text-purple-800 border-purple-200',
      playoff: 'bg-red-100 text-red-800 border-red-200',
      festival: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoundLabel = (stage: string, round?: string): string => {
    if (!round || round === 'group') return 'Group Stage';
    
    const roundMap: Record<string, string> = {
      'round-of-16': 'Round of 16',
      'quarter-final': 'Quarter Final',
      'semi-final': 'Semi Final',
      'final': 'Final',
      'third-place': 'Third Place',
      'plate-round-of-16': 'Plate Round of 16',
      'plate-quarter-final': 'Plate Quarter Final',
      'plate-semi-final': 'Plate Semi Final',
      'plate-final': 'Plate Final',
      'plate-third-place': 'Plate Third Place',
      'shield-quarter-final': 'Shield Quarter Final',
      'shield-semi-final': 'Shield Semi Final',
      'shield-final': 'Shield Final',
      'shield-third-place': 'Shield Third Place',
      'playoff-round-1': 'Playoff Round 1',
      '13th-14th': '13th/14th Playoff',
      '15th-16th': '15th/16th Playoff',
      'friendly': 'Friendly Match',
      'exhibition': 'Exhibition Match'
    };
    
    return roundMap[round] || round;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col items-center min-w-16">
          <Badge variant="secondary" className="mb-1">
            Day {fixture.day}
          </Badge>
          <span className="text-sm font-medium">{fixture.timeSlot}</span>
        </div>
        
        <Badge variant="outline" className={fixture.arena === 1 ? 'text-blue-600' : 'text-green-600'}>
          Arena {fixture.arena}
        </Badge>

        <Badge className={getStageColor(fixture.stage)}>
          {fixture.stage}
        </Badge>

        {fixture.round && fixture.round !== 'group' && (
          <Badge variant="outline" className="bg-white">
            {getRoundLabel(fixture.stage, fixture.round)}
          </Badge>
        )}

        {fixture.poolId && (
          <Badge variant="outline">Pool {fixture.poolId}</Badge>
        )}

        {fixture.completed && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-4 flex-1 justify-center">
        <span className="font-medium text-sm">
          {fixture.homeTeam?.schoolName || getTeamName(fixture.homeTeamId)}
        </span>
        <span className="text-gray-400">vs</span>
        <span className="font-medium text-sm">
          {fixture.awayTeam?.schoolName || getTeamName(fixture.awayTeamId)}
        </span>
        
        {fixture.completed && fixture.homeScore !== undefined && fixture.awayScore !== undefined && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={() => onDelete(fixture.id)}
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
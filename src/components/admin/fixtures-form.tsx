import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, Clock, MapPin, AlertCircle, Loader2, Filter, Group, Eye, EyeOff } from 'lucide-react';
import { Team, Match } from '@/types/team';
import { matchService } from '@/utils/storage';
import { teamService } from '@/utils/storage';
import { tournamentLogic } from '@/utils/tournament-logic';

interface FixturesFormProps {
  onMatchesUpdate?: () => void;
}

export default function FixturesForm({ onMatchesUpdate }: FixturesFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [groupByStage, setGroupByStage] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterRound, setFilterRound] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('pool');
  
  const [newMatch, setNewMatch] = useState({
    homeTeamId: '',
    awayTeamId: '',
    poolId: 'A',
    stage: 'pool',
    day: 1,
    timeSlot: '09:20',
    arena: 1,
    round: 'group'
  });

  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isFilteringTeams, setIsFilteringTeams] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [teamsData, matchesData] = await Promise.all([
        teamService.getTeams(),
        matchService.getMatches()
      ]);
      setTeams(teamsData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update filtered teams based on stage and pool
  useEffect(() => {
    const updateFilteredTeams = () => {
      if (teams.length === 0) {
        setFilteredTeams([]);
        setIsFilteringTeams(false);
        return;
      }
      
      setIsFilteringTeams(true);
      
      let filtered: Team[] = [];
      
      switch (newMatch.stage) {
        case 'pool':
          filtered = teams.filter(team => 
            team.poolAllocation === newMatch.poolId
          );
          break;
        default:
          // For knockout stages, show all teams for now
          // You can implement qualification logic here
          filtered = teams;
      }
      
      setFilteredTeams(filtered);
      setIsFilteringTeams(false);
    };
    
    updateFilteredTeams();
  }, [newMatch.stage, newMatch.poolId, teams]);

  const handleInputChange = (field: string, value: any) => {
    setNewMatch(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStageChange = (newStage: string) => {
    const roundOptions = getRoundOptions(newStage);
    const newRound = roundOptions[0]?.value || 'group';
    
    setNewMatch({ 
      ...newMatch, 
      stage: newStage,
      round: newRound,
      homeTeamId: '',
      awayTeamId: '',
      poolId: newStage === 'pool' ? newMatch.poolId : 'A'
    });
  };

  const generateKnockoutFixtures = async () => {
    if (!selectedStage) {
      alert('Please select a stage first');
      return;
    }

    try {
      setIsLoading(true);
      const pools = ['A', 'B', 'C', 'D'];
      const allStandingsData: { [poolId: string]: any[] } = {};

      for (const poolId of pools) {
        try {
          const allTeams = await teamService.getTeams();
          const allMatches = await matchService.getMatches();
          const allStandings = tournamentLogic.calculateStandings(allTeams, allMatches);
          const standings = allStandings[poolId] || [];
          allStandingsData[poolId] = standings;
        } catch (error) {
          console.error(`Error getting standings for pool ${poolId}:`, error);
          allStandingsData[poolId] = [];
        }
      }

      const knockoutMatches = tournamentLogic.generateKnockoutMatches(allStandingsData, selectedStage);
      
      for (const match of knockoutMatches) {
        await matchService.createMatch({
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          poolId: match.poolId,
          stage: match.stage,
          day: match.day,
          timeSlot: match.timeSlot,
          arena: match.arena,
          round: match.round
        });
      }

      alert(`Successfully generated ${knockoutMatches.length} ${selectedStage} stage matches`);
      loadData();
      onMatchesUpdate?.();
      
    } catch (error) {
      console.error('Error generating knockout fixtures:', error);
      alert('Error generating knockout fixtures. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFestivalFixtures = async () => {
    try {
      setIsLoading(true);
      const pools = ['A', 'B', 'C', 'D'];
      const allStandingsData: { [poolId: string]: any[] } = {};

      for (const poolId of pools) {
        try {
          const allTeams = await teamService.getTeams();
          const allMatches = await matchService.getMatches();
          const allStandings = tournamentLogic.calculateStandings(allTeams, allMatches);
          const standings = allStandings[poolId] || [];
          allStandingsData[poolId] = standings;
        } catch (error) {
          console.error(`Error getting standings for pool ${poolId}:`, error);
          allStandingsData[poolId] = [];
        }
      }

      const festivalMatches = tournamentLogic.generateFestivalMatches(allStandingsData);
      
      for (const match of festivalMatches) {
        await matchService.createMatch({
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          poolId: match.poolId,
          stage: match.stage,
          day: match.day,
          timeSlot: match.timeSlot,
          arena: match.arena,
          round: match.round
        });
      }

      alert(`Successfully generated ${festivalMatches.length} festival matches`);
      loadData();
      onMatchesUpdate?.();
      
    } catch (error) {
      console.error('Error generating festival fixtures:', error);
      alert('Error generating festival fixtures. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const addManualMatch = async () => {
    if (!newMatch.homeTeamId || !newMatch.awayTeamId) {
      alert('Please select both home and away teams');
      return;
    }

    if (newMatch.homeTeamId === newMatch.awayTeamId) {
      alert('Home and away teams cannot be the same');
      return;
    }

    try {
      setIsSaving(true);
      await matchService.createMatch(newMatch);
      
      setNewMatch({
        homeTeamId: '',
        awayTeamId: '',
        poolId: 'A',
        stage: 'pool',
        day: 1,
        timeSlot: '09:00',
        arena: 1,
        round: 'group'
      });
      
      alert('Match created successfully');
      loadData();
      onMatchesUpdate?.();
    } catch (error: any) {
      console.error('Error creating match:', error);
      alert(error.message || 'Error creating match');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      setIsLoading(true);
      await matchService.deleteMatch(matchId);
      alert('Match deleted successfully');
      loadData();
      onMatchesUpdate?.();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllMatches = async () => {
    if (!confirm('Are you sure you want to clear all matches? This action cannot be undone.')) {
      return;
    }

    try {
      for (const match of matches) {
        await matchService.deleteMatch(match.id);
      }
      setMatches([]);
      alert('All matches cleared successfully');
    } catch (error: any) {
      console.error('Error clearing matches:', error);
      alert(error.message || 'Failed to clear matches');
    }
  };

  const exportMatches = () => {
    const dataStr = JSON.stringify(matches, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'matches.json';
    link.click();
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.schoolName : 'Unknown Team';
  };

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

  // Group matches by stage and round
  const groupedMatches = matches.reduce((acc, match) => {
    if (!showCompleted && match.completed) return acc;
    
    const stage = match.stage;
    const round = match.round || 'unknown';
    
    if (!acc[stage]) acc[stage] = {};
    if (!acc[stage][round]) acc[stage][round] = [];
    
    acc[stage][round].push(match);
    return acc;
  }, {} as Record<string, Record<string, Match[]>>);

  // Get unique stages and rounds for filtering
  const stages = Array.from(new Set(matches.map(m => m.stage))).sort();
  const rounds = Array.from(new Set(matches.map(m => m.round || 'unknown'))).sort();

  // Filter matches based on stage and round
  const filteredMatches = matches.filter(match => {
    if (!showCompleted && match.completed) return false;
    if (filterStage !== 'all' && match.stage !== filterStage) return false;
    if (filterRound !== 'all' && (match.round || 'unknown') !== filterRound) return false;
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
          <p>Loading matches...</p>
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
          <Button onClick={exportMatches} variant="outline" size="sm">
            Export
          </Button>
          <Button onClick={clearAllMatches} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Manual Match Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Match
            {!isFilteringTeams && filteredTeams.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredTeams.length} qualified teams
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newMatch.day.toString()}
                onValueChange={(value) => {
                  const selectedDay = parseInt(value);
                  setNewMatch({ 
                    ...newMatch, 
                    day: selectedDay,
                    timeSlot: getTimeSlots(selectedDay)[0]
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                  <SelectItem value="3">Day 3</SelectItem>
                  <SelectItem value="4">Day 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select
                value={newMatch.timeSlot}
                onValueChange={(value) => handleInputChange('timeSlot', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTimeSlots(newMatch.day).map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arena</Label>
              <Select
                value={newMatch.arena.toString()}
                onValueChange={(value) => handleInputChange('arena', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aquatic Centre</SelectItem>
                  <SelectItem value="2">High School Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={newMatch.stage}
                onValueChange={(value) => handleStageChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool">Pool</SelectItem>
                  <SelectItem value="cup">Cup</SelectItem>
                  <SelectItem value="plate">Plate</SelectItem>
                  <SelectItem value="shield">Shield</SelectItem>
                  <SelectItem value="playoff">Playoff</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMatch.stage === 'pool' && (
              <div className="space-y-2">
                <Label>Pool</Label>
                <Select
                  value={newMatch.poolId}
                  onValueChange={(value) => {
                    setNewMatch({ 
                      ...newMatch, 
                      poolId: value,
                      homeTeamId: '',
                      awayTeamId: ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Pool A</SelectItem>
                    <SelectItem value="B">Pool B</SelectItem>
                    <SelectItem value="C">Pool C</SelectItem>
                    <SelectItem value="D">Pool D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Round</Label>
              <Select
                value={newMatch.round}
                onValueChange={(value) => handleInputChange('round', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getRoundOptions(newMatch.stage).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={newMatch.stage === 'pool' ? 'md:col-span-2' : 'md:col-span-3'}>
              <div className="space-y-2">
                <Label>
                  Home Team
                  {!isFilteringTeams && filteredTeams.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({filteredTeams.length} qualified)
                    </span>
                  )}
                </Label>
                <Select
                  value={newMatch.homeTeamId}
                  onValueChange={(value) => handleInputChange('homeTeamId', value)}
                  disabled={isFilteringTeams}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isFilteringTeams ? 'Loading teams...' : 
                      filteredTeams.length === 0 ? 'No teams available' : 'Select team...'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.schoolName}
                        {team.poolAllocation && ` (Pool ${team.poolAllocation})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isFilteringTeams && filteredTeams.length === 0 && newMatch.stage === 'pool' && (
                  <p className="text-xs text-orange-600 mt-1">
                    No teams found in Pool {newMatch.poolId}. Allocate teams to pools first.
                  </p>
                )}
              </div>
            </div>

            <div className={newMatch.stage === 'pool' ? 'md:col-span-2' : 'md:col-span-3'}>
              <div className="space-y-2">
                <Label>
                  Away Team
                  {!isFilteringTeams && filteredTeams.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({filteredTeams.length} qualified)
                    </span>
                  )}
                </Label>
                <Select
                  value={newMatch.awayTeamId}
                  onValueChange={(value) => handleInputChange('awayTeamId', value)}
                  disabled={isFilteringTeams}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isFilteringTeams ? 'Loading teams...' : 
                      filteredTeams.length === 0 ? 'No teams available' : 'Select team...'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.schoolName}
                        {team.poolAllocation && ` (Pool ${team.poolAllocation})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            onClick={addManualMatch} 
            disabled={isSaving || isFilteringTeams || filteredTeams.length === 0}
            className="w-full"
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
                Add Match
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
            
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRound} onValueChange={setFilterRound}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rounds</SelectItem>
                {rounds.map(round => (
                  <SelectItem key={round} value={round}>
                    {round === 'unknown' ? 'No Round' : round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

      {/* Matches List */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Matches Added</h3>
            <p className="text-gray-600">Start by adding your first match above</p>
          </CardContent>
        </Card>
      ) : groupByStage ? (
        // Grouped View
        Object.keys(groupedMatches).map(stage => (
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
                      {Object.values(groupedMatches[stage]).flat().length} matches
                    </span>
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(groupedMatches[stage]).map(round => (
                <div key={round} className="border-b last:border-b-0">
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg">
                      {getRoundLabel(stage, round)}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({groupedMatches[stage][round].length} matches)
                      </span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {groupedMatches[stage][round]
                      .sort((a, b) => a.day - b.day || a.timeSlot.localeCompare(b.timeSlot))
                      .map((match) => (
                      <MatchItem 
                        key={match.id} 
                        match={match} 
                        onDelete={deleteMatch}
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
            <CardTitle>All Matches ({filteredMatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMatches
                .sort((a, b) => a.day - b.day || a.timeSlot.localeCompare(b.timeSlot))
                .map((match) => (
                <MatchItem 
                  key={match.id} 
                  match={match} 
                  onDelete={deleteMatch}
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

// Separate MatchItem component for better organization
function MatchItem({ 
  match, 
  onDelete, 
  getTeamName 
}: { 
  match: Match; 
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
            Day {match.day}
          </Badge>
          <span className="text-sm font-medium">{match.timeSlot}</span>
        </div>
        
        <Badge variant="outline" className={match.arena === 1 ? 'text-blue-600' : 'text-green-600'}>
          Arena {match.arena}
        </Badge>

        <Badge className={getStageColor(match.stage)}>
          {match.stage}
        </Badge>

        {match.round && match.round !== 'group' && (
          <Badge variant="outline" className="bg-white">
            {getRoundLabel(match.stage, match.round)}
          </Badge>
        )}

        {match.poolId && (
          <Badge variant="outline">Pool {match.poolId}</Badge>
        )}

        {match.completed && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-4 flex-1 justify-center">
        <span className="font-medium text-sm">
          {getTeamName(match.homeTeamId)}
        </span>
        <span className="text-gray-400">vs</span>
        <span className="font-medium text-sm">
          {getTeamName(match.awayTeamId)}
        </span>
        
        {match.completed && match.homeScore !== undefined && match.awayScore !== undefined && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              {match.homeScore} - {match.awayScore}
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={() => onDelete(match.id)}
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
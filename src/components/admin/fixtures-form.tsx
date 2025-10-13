import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Team, Match } from '@/types/team';
import { matchService } from '@/utils/storage';
import { teamService } from '@/utils/storage';
import { tournamentLogic } from '@/utils/tournament-logic';

interface Player {
  id: string;
  name: string;
  capNumber: number;
}

interface FixturesFormProps {
  onMatchesUpdate?: () => void;
}

export default function FixturesForm({ onMatchesUpdate }: FixturesFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('pool');
  const [newMatch, setNewMatch] = useState({
    homeTeamId: '',
    awayTeamId: '',
    poolId: '',
    stage: 'pool',
    day: 1,
    timeSlot: '09:00',
    arena: 1,
    round: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, matchesData] = await Promise.all([
        teamService.getTeams(),
        matchService.getMatches()
      ]);
      setTeams(teamsData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setNewMatch(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePoolFixtures = async () => {
    try {
      setLoading(true);
      const generatedMatches = await tournamentLogic.generatePoolMatches(teams);
      
      // Create matches via API
      for (const match of generatedMatches) {
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

      alert(`Successfully generated ${generatedMatches.length} pool matches`);
      loadData();
      onMatchesUpdate?.();
    } catch (error) {
      console.error('Error generating pool fixtures:', error);
      alert('Error generating pool fixtures. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const generateKnockoutFixtures = async () => {
    if (!selectedStage) {
      alert('Please select a stage first');
      return;
    }

    try {
      setLoading(true);
      const pools = ['A', 'B', 'C', 'D'];
      const allStandingsData: { [poolId: string]: any[] } = {};

      // Calculate standings for each pool
      for (const poolId of pools) {
        try {
          // Get all teams and matches first
          const allTeams = await teamService.getTeams();
          const allMatches = await matchService.getMatches();

          // Calculate standings for all pools
          const allStandings = tournamentLogic.calculateStandings(allTeams, allMatches);

          // Get standings for the specific pool
          const standings = allStandings[poolId] || [];
          
          allStandingsData[poolId] = standings;
          console.log(`Pool ${poolId} standings:`, standings.map(s => ({
            team: s.team.schoolName,
            points: s.points,
            goalDifference: s.goalDifference
          })));
        } catch (error) {
          console.error(`Error getting standings for pool ${poolId}:`, error);
          allStandingsData[poolId] = [];
        }
      }

      // Generate knockout matches based on standings
      const knockoutMatches = tournamentLogic.generateKnockoutMatches(allStandingsData, selectedStage);
      
      // Create the matches via API
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
      setLoading(false);
    }
  };

  const generateFestivalFixtures = async () => {
    try {
      setLoading(true);
      const pools = ['A', 'B', 'C', 'D'];
      const allStandingsData: { [poolId: string]: any[] } = {};

      // Calculate standings for each pool
      for (const poolId of pools) {
        try {
          // Get all teams and matches first
          const allTeams = await teamService.getTeams();
          const allMatches = await matchService.getMatches();

          // Calculate standings for all pools
          const allStandings = tournamentLogic.calculateStandings(allTeams, allMatches);

          // Get standings for the specific pool
          const standings = allStandings[poolId] || [];
          allStandingsData[poolId] = standings;
        } catch (error) {
          console.error(`Error getting standings for pool ${poolId}:`, error);
          allStandingsData[poolId] = [];
        }
      }

      // Generate festival matches
      const festivalMatches = tournamentLogic.generateFestivalMatches(allStandingsData);
      
      // Create the matches via API
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
      setLoading(false);
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
      setLoading(true);
      await matchService.createMatch(newMatch);
      
      // Reset form
      setNewMatch({
        homeTeamId: '',
        awayTeamId: '',
        poolId: '',
        stage: 'pool',
        day: 1,
        timeSlot: '09:00',
        arena: 1,
        round: ''
      });
      
      alert('Match created successfully');
      loadData();
      onMatchesUpdate?.();
    } catch (error: any) {
      console.error('Error creating match:', error);
      alert(error.message || 'Error creating match');
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      setLoading(true);
      await matchService.deleteMatch(matchId);
      alert('Match deleted successfully');
      loadData();
      onMatchesUpdate?.();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match');
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.schoolName : 'Unknown Team';
  };

  const filteredTeams = teams.filter(team => 
    !newMatch.poolId || team.poolAllocation === newMatch.poolId
  );

  const timeSlots = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];
  const arenas = [1, 2, 3, 4];
  const days = [1, 2, 3, 4];

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Match Fixtures</h2>
        <div className="text-sm text-gray-600">
          {matches.length} matches total
        </div>
      </div>

      {/* Automatic Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Fixture Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Button
                onClick={generatePoolFixtures}
                disabled={teams.length === 0}
                className="w-full"
              >
                Generate Pool Matches
              </Button>
              <p className="text-sm text-gray-600">
                Generates round-robin matches for all pools
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cup">Cup</SelectItem>
                    <SelectItem value="plate">Plate</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={generateKnockoutFixtures}
                  disabled={teams.length === 0}
                >
                  Generate Knockout
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Generates knockout matches based on pool standings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={generateFestivalFixtures}
              disabled={teams.length === 0}
              variant="outline"
              className="w-full"
            >
              Generate Festival Matches
            </Button>
            <p className="text-sm text-gray-600">
              Generates friendly matches for lower-ranked teams
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Match Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Add Manual Match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Home Team</Label>
              <Select
                value={newMatch.homeTeamId}
                onValueChange={(value) => handleInputChange('homeTeamId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.schoolName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Away Team</Label>
              <Select
                value={newMatch.awayTeamId}
                onValueChange={(value) => handleInputChange('awayTeamId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select away team" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.schoolName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={newMatch.stage}
                onValueChange={(value) => handleInputChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool">Pool</SelectItem>
                  <SelectItem value="cup">Cup</SelectItem>
                  <SelectItem value="plate">Plate</SelectItem>
                  <SelectItem value="shield">Shield</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pool</Label>
              <Select
                value={newMatch.poolId}
                onValueChange={(value) => handleInputChange('poolId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Pool A</SelectItem>
                  <SelectItem value="B">Pool B</SelectItem>
                  <SelectItem value="C">Pool C</SelectItem>
                  <SelectItem value="D">Pool D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newMatch.day.toString()}
                onValueChange={(value) => handleInputChange('day', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                    </SelectItem>
                  ))}
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
                  {timeSlots.map(slot => (
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
                  {arenas.map(arena => (
                    <SelectItem key={arena} value={arena.toString()}>
                      Arena {arena}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Round (Optional)</Label>
              <Input
                value={newMatch.round}
                onChange={(e) => handleInputChange('round', e.target.value)}
                placeholder="e.g., Quarter-final"
              />
            </div>
          </div>

          <Button onClick={addManualMatch} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        </CardContent>
      </Card>

      {/* Existing Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No matches created yet
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map(match => (
                <div key={match.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-medium">{getTeamName(match.homeTeamId)}</span>
                      <span className="text-gray-600">vs</span>
                      <span className="font-medium">{getTeamName(match.awayTeamId)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Day {match.day}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {match.timeSlot}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Arena {match.arena}
                      </div>
                      <div className="capitalize">{match.stage}</div>
                      {match.poolId && (
                        <div>Pool {match.poolId}</div>
                      )}
                    </div>
                    {match.homeScore !== undefined && match.awayScore !== undefined && (
                      <div className="mt-2 text-lg font-bold">
                        {match.homeScore} - {match.awayScore}
                        {match.completed && (
                          <span className="ml-2 text-sm text-green-600">Completed</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMatch(match.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
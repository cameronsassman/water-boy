import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, CalendarDays, Users, AlertCircle } from 'lucide-react';

interface Team {
  id: string;
  schoolName: string;
  players: any[];
  poolId?: string;
}

interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  poolId: string;
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
}

// This component allows manual entry of fixtures
export default function ManualFixtureEntry() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [newFixture, setNewFixture] = useState<NewFixtureForm>({
    day: 1,
    timeSlot: '16:20',
    arena: 1,
    homeTeamId: '',
    awayTeamId: '',
    poolId: 'A',
    stage: 'pool'
  });

  useEffect(() => {
    loadTeams();
    loadFixtures();
  }, []);

  // Get filtered teams based on pool selection and stage
  const getFilteredTeams = (): Team[] => {
    if (newFixture.stage === 'pool') {
      // For pool stage, filter by selected pool
      return teams.filter(team => team.poolId === newFixture.poolId);
    }
    // For knockout and festival stages, show all teams
    return teams;
  };

  const filteredTeams = getFilteredTeams();

  const loadTeams = () => {
    // Load teams from localStorage
    const stored = localStorage.getItem('water-polo-tournament');
    if (stored) {
      const data = JSON.parse(stored);
      setTeams(data.teams || []);
    }
  };

  const loadFixtures = () => {
    // Load existing fixtures from localStorage
    const stored = localStorage.getItem('water-polo-tournament-scheduled-matches');
    if (stored) {
      setFixtures(JSON.parse(stored));
    }
  };

  // Predefined time slots for each day
  const getTimeSlots = (day: number): string[] => {
    switch (day) {
      case 1:
        // Day 1: 16:20 - 19:00
        return [
          '16:20', '16:40', '17:00', '17:20', '17:40', 
          '18:00', '18:20', '18:40', '19:00'
        ];
      case 2:
        // Day 2: 08:00 - 19:00 (with lunch break 12:30-13:30)
        return [
          '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
          '10:00', '10:20', '10:40', '11:00', '11:20', '11:40',
          '12:00', '12:20',
          // Lunch break 12:30-13:30
          '13:30', '13:50',
          '14:00', '14:20', '14:40', '15:00', '15:20', '15:40',
          '16:00', '16:20', '16:40', '17:00', '17:20', '17:40',
          '18:00', '18:20', '18:40', '19:00'
        ];
      case 3:
        // Day 3: 08:00 - 19:00 (with break 09:40-10:30)
        return [
          '08:00', '08:20', '08:40', '09:00', '09:20', '09:40',
          // Break 09:40-10:30
          '10:30', '10:50',
          '11:00', '11:20', '11:40', '12:00', '12:20', '12:40',
          '13:00', '13:20', '13:40', '14:00', '14:20', '14:40',
          '15:00', '15:20', '15:40', '16:00', '16:20', '16:40',
          '17:00', '17:20', '17:40', '18:00', '18:20', '18:40', '19:00'
        ];
      case 4:
        // Day 4: 07:00 - 15:00
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

  const addFixture = () => {
    if (!newFixture.homeTeamId || !newFixture.awayTeamId) {
      alert('Please select both teams');
      return;
    }

    if (newFixture.homeTeamId === newFixture.awayTeamId) {
      alert('Teams must be different');
      return;
    }

    const homeTeam = teams.find(t => t.id === newFixture.homeTeamId);
    const awayTeam = teams.find(t => t.id === newFixture.awayTeamId);

    if (!homeTeam || !awayTeam) {
      alert('Selected teams not found');
      return;
    }

    const fixture: Fixture = {
      id: `match-${Date.now()}`,
      homeTeamId: newFixture.homeTeamId,
      awayTeamId: newFixture.awayTeamId,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      poolId: newFixture.poolId,
      stage: newFixture.stage,
      day: newFixture.day,
      timeSlot: newFixture.timeSlot,
      arena: newFixture.arena,
      completed: false
    };

    const updatedFixtures = [...fixtures, fixture];
    setFixtures(updatedFixtures);
    saveFixtures(updatedFixtures);

    // Reset form
    setNewFixture({
      ...newFixture,
      homeTeamId: '',
      awayTeamId: ''
    });
  };

  const deleteFixture = (fixtureId: string) => {
    const updatedFixtures = fixtures.filter(f => f.id !== fixtureId);
    setFixtures(updatedFixtures);
    saveFixtures(updatedFixtures);
  };

  const saveFixtures = (fixtureList: Fixture[]) => {
    // Save to tournament matches
    const tournamentData = JSON.parse(localStorage.getItem('water-polo-tournament') || '{}');
    tournamentData.matches = fixtureList.map((f: Fixture) => ({
      id: f.id,
      homeTeamId: f.homeTeamId,
      awayTeamId: f.awayTeamId,
      poolId: f.poolId,
      stage: f.stage,
      round: f.round,
      completed: f.completed,
      homeScore: f.homeScore,
      awayScore: f.awayScore
    }));
    localStorage.setItem('water-polo-tournament', JSON.stringify(tournamentData));

    // Save scheduled matches
    localStorage.setItem('water-polo-tournament-scheduled-matches', JSON.stringify(fixtureList));
    localStorage.setItem('water-polo-tournament-schedule-generated', 'true');
  };

  const clearAllFixtures = () => {
    if (confirm('Are you sure you want to clear all fixtures?')) {
      setFixtures([]);
      localStorage.removeItem('water-polo-tournament-scheduled-matches');
      localStorage.removeItem('water-polo-tournament-schedule-generated');
      
      const tournamentData = JSON.parse(localStorage.getItem('water-polo-tournament') || '{}');
      tournamentData.matches = [];
      localStorage.setItem('water-polo-tournament', JSON.stringify(tournamentData));
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

  const importFixtures = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setFixtures(imported);
          saveFixtures(imported);
          alert('Fixtures imported successfully!');
        } catch (error) {
          alert('Error importing fixtures. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.schoolName : 'Unknown';
  };

  const groupedFixtures: Record<number, Fixture[]> = fixtures.reduce((acc, fixture) => {
    if (!acc[fixture.day]) acc[fixture.day] = [];
    acc[fixture.day].push(fixture);
    return acc;
  }, {} as Record<number, Fixture[]>);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Manual Fixture Entry
          </h1>
          <p className="text-gray-600 mt-2">Create and manage tournament fixtures manually</p>
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

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-orange-600">{teams.length}</div>
            <div className="text-sm text-gray-600">Teams</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Fixture Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Fixture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Day</label>
              <select
                value={newFixture.day}
                onChange={(e) => {
                  const selectedDay = parseInt(e.target.value);
                  setNewFixture({ 
                    ...newFixture, 
                    day: selectedDay,
                    timeSlot: getTimeSlots(selectedDay)[0] // Auto-select first available time slot
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
                <option value={1}>Arena 1</option>
                <option value={2}>Arena 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stage</label>
              <select
                value={newFixture.stage}
                onChange={(e) => {
                  setNewFixture({ 
                    ...newFixture, 
                    stage: e.target.value,
                    homeTeamId: '', // Reset team selections when stage changes
                    awayTeamId: ''
                  });
                }}
                className="w-full p-2 border rounded"
              >
                <option value="pool">Pool</option>
                <option value="cup">Cup</option>
                <option value="plate">Plate</option>
                <option value="shield">Shield</option>
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
                      homeTeamId: '', // Reset team selections when pool changes
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

            <div className={newFixture.stage === 'pool' ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="block text-sm font-medium mb-2">
                Home Team
                {newFixture.stage === 'pool' && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Pool {newFixture.poolId} only)
                  </span>
                )}
              </label>
              <select
                value={newFixture.homeTeamId}
                onChange={(e) => setNewFixture({ ...newFixture, homeTeamId: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select team...</option>
                {filteredTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.schoolName}
                    {newFixture.stage !== 'pool' && team.poolId && ` (Pool ${team.poolId})`}
                  </option>
                ))}
              </select>
            </div>

            <div className={newFixture.stage === 'pool' ? 'md:col-span-2' : 'md:col-span-2'}>
              <label className="block text-sm font-medium mb-2">
                Away Team
                {newFixture.stage === 'pool' && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Pool {newFixture.poolId} only)
                  </span>
                )}
              </label>
              <select
                value={newFixture.awayTeamId}
                onChange={(e) => setNewFixture({ ...newFixture, awayTeamId: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select team...</option>
                {filteredTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.schoolName}
                    {newFixture.stage !== 'pool' && team.poolId && ` (Pool ${team.poolId})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={addFixture} className="mt-4 w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Fixture
          </Button>
        </CardContent>
      </Card>

      {/* Fixtures List */}
      {Object.keys(groupedFixtures).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Fixtures Added</h3>
            <p className="text-gray-600">Start by adding your first fixture above</p>
          </CardContent>
        </Card>
      ) : (
        Object.keys(groupedFixtures)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((day: string) => {
            const dayNumber = parseInt(day);
            const dayFixtures = groupedFixtures[dayNumber];
            
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle>Day {day} - {dayFixtures.length} Fixtures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayFixtures
                      .sort((a: Fixture, b: Fixture) => a.timeSlot.localeCompare(b.timeSlot))
                      .map((fixture: Fixture) => (
                        <div key={fixture.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4 flex-1">
                            <Badge variant="secondary">{fixture.timeSlot}</Badge>
                            <Badge variant="outline" className={fixture.arena === 1 ? 'text-blue-600' : 'text-green-600'}>
                              Arena {fixture.arena}
                            </Badge>
                            {fixture.poolId && (
                              <Badge variant="outline">Pool {fixture.poolId}</Badge>
                            )}
                            <Badge>{fixture.stage}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 flex-1 justify-center">
                            <span className="font-medium text-sm">{getTeamName(fixture.homeTeamId)}</span>
                            <span className="text-gray-400">vs</span>
                            <span className="font-medium text-sm">{getTeamName(fixture.awayTeamId)}</span>
                          </div>

                          <Button
                            onClick={() => deleteFixture(fixture.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
      )}
    </div>
  );
}
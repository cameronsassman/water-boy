"use client";

import React, { useState, useEffect } from 'react';
import { User, Calendar, Trophy, Users, Settings, LogOut, Plus, Edit3 } from 'lucide-react';

// Types
type Player = {
  capNumber: number;
  name: string;
  goals: number;
  kickouts: number;
  yellowCards: number;
  redCards: number;
};

type School = {
  id: string;
  schoolName: string;
  coachName: string;
  players: Player[];
  pool: string;
  createdAt: string;
};

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  pool: string;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
  homeSchoolId?: string;
  awaySchoolId?: string;
};

type TeamStats = {
  team: string;
  schoolId: string;
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

// Sample data for demonstration
const sampleMatches: Match[] = [
  { id: '1', homeTeam: 'Sharks Academy', awayTeam: 'Dolphins High', homeGoals: 8, awayGoals: 5, pool: 'A', date: '2025-06-25', status: 'completed' },
  { id: '2', homeTeam: 'Wave Riders', awayTeam: 'Blue Devils', homeGoals: 0, awayGoals: 0, pool: 'A', date: '2025-06-28', status: 'scheduled' },
  { id: '3', homeTeam: 'Ocean Warriors', awayTeam: 'Tide Breakers', homeGoals: 3, awayGoals: 3, pool: 'B', date: '2025-06-26', status: 'completed' },
  { id: '4', homeTeam: 'Sea Lions', awayTeam: 'Marlins United', homeGoals: 0, awayGoals: 0, pool: 'B', date: '2025-06-29', status: 'scheduled' },
];

function WaterPoloApp() {
  const [currentUser, setCurrentUser] = useState<School | null>(null);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [matches, setMatches] = useState<Match[]>(sampleMatches);
  const [currentView, setCurrentView] = useState<'home' | 'register' | 'lineup' | 'matches' | 'brackets'>('home');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedSchools = localStorage.getItem('waterPoloSchools');
    const savedUser = localStorage.getItem('currentUser');
    const savedMatches = localStorage.getItem('waterPoloMatches');

    if (savedSchools) {
      setAllSchools(JSON.parse(savedSchools));
    }
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('waterPoloSchools', JSON.stringify(allSchools));
  }, [allSchools]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('waterPoloMatches', JSON.stringify(matches));
  }, [matches]);

  // Calculate standings
  const calculateStandings = (poolMatches: Match[]): TeamStats[] => {
    const standings: Record<string, TeamStats> = {};

    poolMatches.forEach(({ homeTeam, awayTeam, homeGoals, awayGoals, homeSchoolId, awaySchoolId }) => {
      const initTeam = (name: string, schoolId?: string) => {
        if (!standings[name]) {
          standings[name] = {
            team: name,
            schoolId: schoolId || '',
            wins: 0, draws: 0, losses: 0, gamesPlayed: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
          };
        }
        return standings[name];
      };

      const home = initTeam(homeTeam, homeSchoolId);
      const away = initTeam(awayTeam, awaySchoolId);

      home.gamesPlayed++; away.gamesPlayed++;
      home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        home.wins++; home.points += 3; away.losses++;
      } else if (homeGoals < awayGoals) {
        away.wins++; away.points += 3; home.losses++;
      } else {
        home.draws++; home.points += 1; away.draws++; away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
  };

  // Registration Component
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      schoolName: '',
      coachName: '',
      players: Array.from({ length: 14 }, (_, i) => ({ 
        capNumber: i + 1, name: '', goals: 0, kickouts: 0, yellowCards: 0, redCards: 0 
      }))
    });

    const handleSubmit = () => {
      if (!formData.schoolName.trim() || !formData.coachName.trim()) {
        alert('Please fill in school name and coach name');
        return;
      }
      
      const newSchool: School = {
        id: Date.now().toString(),
        schoolName: formData.schoolName,
        coachName: formData.coachName,
        players: formData.players,
        pool: Math.random() > 0.5 ? 'A' : 'B', // Random pool assignment for demo
        createdAt: new Date().toISOString()
      };

      setAllSchools(prev => [...prev, newSchool]);
      setCurrentUser(newSchool);
      setCurrentView('home');
    };

    const updatePlayer = (index: number, name: string) => {
      setFormData(prev => ({
        ...prev,
        players: prev.players.map((player, i) => 
          i === index ? { ...player, name } : player
        )
      }));
    };

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">School Registration</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </div>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData(prev => ({...prev, schoolName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Coach Name
              </div>
              <input
                type="text"
                value={formData.coachName}
                onChange={(e) => setFormData(prev => ({...prev, coachName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Player Roster (14 Players)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {formData.players.map((player, index) => (
                <div key={player.capNumber} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {player.capNumber}
                  </div>
                  <input
                    type="text"
                    placeholder={`Player ${player.capNumber}`}
                    value={player.name}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Register School
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pool Standings Component
  const PoolStandings = () => {
    const pools = ['A', 'B'];
    
    return (
      <div className="space-y-8">
        {pools.map(pool => {
          const poolMatches = matches.filter(m => m.pool === pool && m.status === 'completed');
          const standings = calculateStandings(poolMatches);
          
          return (
            <div key={pool} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Pool {pool}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-left">Team</th>
                      <th className="px-4 py-2 text-center">GP</th>
                      <th className="px-4 py-2 text-center">W</th>
                      <th className="px-4 py-2 text-center">D</th>
                      <th className="px-4 py-2 text-center">L</th>
                      <th className="px-4 py-2 text-center">GF</th>
                      <th className="px-4 py-2 text-center">GA</th>
                      <th className="px-4 py-2 text-center">GD</th>
                      <th className="px-4 py-2 text-center">Pts</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, index) => (
                      <tr key={team.team} className={`border-t ${index < 4 ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 font-semibold">{index + 1}</td>
                        <td className="px-4 py-2">{team.team}</td>
                        <td className="px-4 py-2 text-center">{team.gamesPlayed}</td>
                        <td className="px-4 py-2 text-center">{team.wins}</td>
                        <td className="px-4 py-2 text-center">{team.draws}</td>
                        <td className="px-4 py-2 text-center">{team.losses}</td>
                        <td className="px-4 py-2 text-center">{team.goalsFor}</td>
                        <td className="px-4 py-2 text-center">{team.goalsAgainst}</td>
                        <td className="px-4 py-2 text-center">{team.goalDifference}</td>
                        <td className="px-4 py-2 text-center font-bold">{team.points}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            index < 4 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                          }`}>
                            {index < 4 ? 'Knockout' : 'Festival'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Matches Component
  const MatchesView = () => {
    const upcomingMatches = matches.filter(m => m.status === 'scheduled');
    const completedMatches = matches.filter(m => m.status === 'completed');

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Upcoming Matches</h3>
          <div className="space-y-3">
            {upcomingMatches.map(match => (
              <div key={match.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">{match.date}</div>
                  <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                  <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Pool {match.pool}</div>
                </div>
                <div className="text-sm text-green-600 font-semibold">Scheduled</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Recent Results</h3>
          <div className="space-y-3">
            {completedMatches.map(match => (
              <div key={match.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">{match.date}</div>
                  <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                  <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Pool {match.pool}</div>
                </div>
                <div className="font-bold text-lg">{match.homeGoals} - {match.awayGoals}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Navigation Header
  const Header = () => (
    <header className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">Water Polo Tournament</h1>
        
        <nav className="flex items-center space-x-6">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex items-center space-x-2 px-3 py-2 rounded ${
              currentView === 'home' ? 'bg-blue-700' : 'hover:bg-blue-500'
            }`}
          >
            <Trophy size={18} />
            <span>Standings</span>
          </button>
          
          <button
            onClick={() => setCurrentView('matches')}
            className={`flex items-center space-x-2 px-3 py-2 rounded ${
              currentView === 'matches' ? 'bg-blue-700' : 'hover:bg-blue-500'
            }`}
          >
            <Calendar size={18} />
            <span>Matches</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setCurrentView('lineup')}
              className={`flex items-center space-x-2 px-3 py-2 rounded ${
                currentView === 'lineup' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              <Users size={18} />
              <span>My Lineup</span>
            </button>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-semibold">{currentUser.schoolName}</div>
                <div className="text-blue-200">{currentUser.coachName}</div>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('currentUser');
                  setCurrentView('home');
                }}
                className="hover:bg-blue-500 p-2 rounded"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('register')}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              <Plus size={18} />
              <span>Register School</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Simple Lineup Editor (placeholder)
  const LineupEditor = () => {
    if (!currentUser) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">My Team Lineup - {currentUser.schoolName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentUser.players.map(player => (
            <div key={player.capNumber} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {player.capNumber}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{player.name || `Player ${player.capNumber}`}</div>
                <div className="text-sm text-gray-600">
                  G:{player.goals} | KO:{player.kickouts} | Y:{player.yellowCards} | R:{player.redCards}
                </div>
              </div>
              <Edit3 size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-6xl mx-auto p-6">
        {currentView === 'register' && <RegistrationForm />}
        {currentView === 'home' && <PoolStandings />}
        {currentView === 'matches' && <MatchesView />}
        {currentView === 'lineup' && <LineupEditor />}
      </main>
    </div>
  );
}

export default WaterPoloApp;
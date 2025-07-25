// src/app/components/tournament_app.tsx
"use client";

import { useState, useEffect } from "react";
import TeamRegistration from "./team_registration";
import MatchScheduler from "./match_scheduler";
import ScoreCardWithMatch from "./score_card_with_match";
import StandingsTable from "./standings_table";
import { calculateStandings } from "../../lib/calculations";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
  pool: string;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  pool: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  homeGoals?: number;
  awayGoals?: number;
}

type View = 'registration' | 'scheduler' | 'scorecard' | 'standings';

export default function TournamentApp() {
  const [currentView, setCurrentView] = useState<View>('registration');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTeams = localStorage.getItem('tournament-teams');
    const savedMatches = localStorage.getItem('tournament-matches');
    
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    }
    
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
  }, []);

  // Save teams to localStorage whenever teams change
  useEffect(() => {
    localStorage.setItem('tournament-teams', JSON.stringify(teams));
  }, [teams]);

  // Save matches to localStorage whenever matches change
  useEffect(() => {
    localStorage.setItem('tournament-matches', JSON.stringify(matches));
  }, [matches]);

  const handleTeamsRegistered = (updatedTeams: Team[]) => {
    setTeams(updatedTeams);
  };

  const handleMatchUpdate = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  const handleStartMatch = (match: Match) => {
    setCurrentMatch(match);
    setCurrentView('scorecard');
  };

  const handleMatchComplete = (completedMatch: Match) => {
    const updatedMatches = matches.map(m => 
      m.id === completedMatch.id ? completedMatch : m
    );
    setMatches(updatedMatches);
    setCurrentMatch(null);
  };

  const handleBackToScheduler = () => {
    setCurrentView('scheduler');
    setCurrentMatch(null);
  };

  // Convert matches to the format expected by calculateStandings
  const convertMatchesForStandings = () => {
    return matches
      .filter(match => match.status === 'completed')
      .map(match => ({
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeGoals: match.homeGoals || 0,
        awayGoals: match.awayGoals || 0,
        pool: match.pool
      }));
  };

  const standings = calculateStandings(convertMatchesForStandings());

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all tournament data? This cannot be undone.')) {
      setTeams([]);
      setMatches([]);
      setCurrentMatch(null);
      localStorage.removeItem('tournament-teams');
      localStorage.removeItem('tournament-matches');
      setCurrentView('registration');
    }
  };

  const exportData = () => {
    const data = {
      teams,
      matches,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.teams && data.matches) {
          setTeams(data.teams);
          setMatches(data.matches);
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format!');
        }
      } catch (error) {
        alert('Error reading file!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">
              Water Polo Tournament Manager
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentView('registration')}
                  variant={currentView === 'registration' ? 'default' : 'outline'}
                  size="sm"
                >
                  Teams ({teams.length})
                </Button>
                <Button
                  onClick={() => setCurrentView('scheduler')}
                  variant={currentView === 'scheduler' ? 'default' : 'outline'}
                  size="sm"
                  disabled={teams.length < 2}
                >
                  Matches ({matches.length})
                </Button>
                <Button
                  onClick={() => setCurrentView('standings')}
                  variant={currentView === 'standings' ? 'default' : 'outline'}
                  size="sm"
                  disabled={matches.filter(m => m.status === 'completed').length === 0}
                >
                  Standings
                </Button>
              </div>

              <div className="flex items-center space-x-2 border-l pl-4">
                <Button
                  onClick={exportData}
                  variant="outline"
                  size="sm"
                  disabled={teams.length === 0}
                >
                  Export
                </Button>
                <label>
                  <Button
                    variant="outline"
                    size="sm"
                    as="span"
                  >
                    Import
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {currentView === 'registration' && (
          <TeamRegistration
            onTeamsRegistered={handleTeamsRegistered}
            existingTeams={teams}
          />
        )}

        {currentView === 'scheduler' && (
          <MatchScheduler
            teams={teams}
            onStartMatch={handleStartMatch}
            matches={matches}
            onMatchUpdate={handleMatchUpdate}
          />
        )}

        {currentView === 'scorecard' && (
          <ScoreCardWithMatch
            match={currentMatch}
            onMatchComplete={handleMatchComplete}
            onBackToScheduler={handleBackToScheduler}
          />
        )}

        {currentView === 'standings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-center mb-6">Tournament Standings</h2>
              <div className="text-center mb-4 text-gray-600">
                Based on {matches.filter(m => m.status === 'completed').length} completed matches
              </div>
              <StandingsTable standings={standings} />
            </div>
          </div>
        )}

        {/* Tournament Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
            <div className="text-sm text-gray-600">Teams Registered</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {matches.filter(m => m.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Matches Scheduled</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {matches.filter(m => m.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">Matches In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Matches Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/app/components/match_scheduler.tsx
"use client";

import { useState } from "react";
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

interface MatchSchedulerProps {
  teams: Team[];
  onStartMatch: (match: Match) => void;
  matches: Match[];
  onMatchUpdate: (matches: Match[]) => void;
}

export default function MatchScheduler({ 
  teams, 
  onStartMatch, 
  matches, 
  onMatchUpdate 
}: MatchSchedulerProps) {
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>("");

  const groupedTeams = teams.reduce((acc, team) => {
    if (!acc[team.pool]) acc[team.pool] = [];
    acc[team.pool].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const createMatch = () => {
    if (!selectedHomeTeam || !selectedAwayTeam || selectedHomeTeam === selectedAwayTeam) {
      return;
    }

    const homeTeam = teams.find(t => t.id === selectedHomeTeam);
    const awayTeam = teams.find(t => t.id === selectedAwayTeam);

    if (!homeTeam || !awayTeam) return;

    // Check if teams are in the same pool
    if (homeTeam.pool !== awayTeam.pool) {
      alert("Teams must be in the same pool to play against each other!");
      return;
    }

    const newMatch: Match = {
      id: Date.now().toString(),
      homeTeam,
      awayTeam,
      pool: homeTeam.pool,
      status: 'scheduled'
    };

    const updatedMatches = [...matches, newMatch];
    onMatchUpdate(updatedMatches);
    setSelectedHomeTeam("");
    setSelectedAwayTeam("");
  };

  const startMatch = (match: Match) => {
    const updatedMatches = matches.map(m => 
      m.id === match.id ? { ...m, status: 'in-progress' as const } : m
    );
    onMatchUpdate(updatedMatches);
    onStartMatch(match);
  };

  const deleteMatch = (matchId: string) => {
    const updatedMatches = matches.filter(m => m.id !== matchId);
    onMatchUpdate(updatedMatches);
  };

  const getAvailableTeams = (excludeTeamId?: string) => {
    return teams.filter(team => 
      team.id !== excludeTeamId && 
      !matches.some(match => 
        match.status === 'in-progress' && 
        (match.homeTeam.id === team.id || match.awayTeam.id === team.id)
      )
    );
  };

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.pool]) acc[match.pool] = [];
    acc[match.pool].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Match Scheduler</h2>

      {/* Create New Match */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Schedule New Match</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Home Team</label>
            <select
              value={selectedHomeTeam}
              onChange={(e) => setSelectedHomeTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select home team</option>
              {getAvailableTeams(selectedAwayTeam).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} (Pool {team.pool})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Away Team</label>
            <select
              value={selectedAwayTeam}
              onChange={(e) => setSelectedAwayTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select away team</option>
              {getAvailableTeams(selectedHomeTeam).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} (Pool {team.pool})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={createMatch}
              disabled={!selectedHomeTeam || !selectedAwayTeam || selectedHomeTeam === selectedAwayTeam}
              className="w-full"
            >
              Schedule Match
            </Button>
          </div>
        </div>
      </div>

      {/* Matches by Pool */}
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([pool, poolMatches]) => (
          <div key={pool} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Pool {pool} Matches</h3>
            <div className="space-y-3">
              {poolMatches.map((match) => (
                <div
                  key={match.id}
                  className={`flex items-center justify-between p-4 rounded-md ${
                    match.status === 'completed' ? 'bg-green-50 border-green-200' :
                    match.status === 'in-progress' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  } border`}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </div>
                    {match.status === 'completed' && (
                      <div className="text-sm text-gray-600 mt-1">
                        Final Score: {match.homeGoals} - {match.awayGoals}
                      </div>
                    )}
                    <div className={`text-sm mt-1 ${
                      match.status === 'completed' ? 'text-green-600' :
                      match.status === 'in-progress' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1).replace('-', ' ')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {match.status === 'scheduled' && (
                      <>
                        <Button
                          onClick={() => startMatch(match)}
                          variant="default"
                          size="sm"
                        >
                          Start Match
                        </Button>
                        <Button
                          onClick={() => deleteMatch(match.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    {match.status === 'in-progress' && (
                      <div className="text-sm text-yellow-600 font-medium">
                        Match in progress...
                      </div>
                    )}
                    {match.status === 'completed' && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No matches scheduled yet. Create your first match above!
        </div>
      )}
    </div>
  );
}
// src/app/components/team_registration.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
  pool: string;
}

interface TeamRegistrationProps {
  onTeamsRegistered: (teams: Team[]) => void;
  existingTeams: Team[];
}

export default function TeamRegistration({ onTeamsRegistered, existingTeams }: TeamRegistrationProps) {
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Team[]>(existingTeams);

  // Auto-assign pool based on number of teams
  const getNextPool = () => {
    const poolCounts = teams.reduce((acc, team) => {
      acc[team.pool] = (acc[team.pool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find the pool with the least teams (max 5 teams per pool)
    const pools = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (const pool of pools) {
      if ((poolCounts[pool] || 0) < 5) {
        return pool;
      }
    }
    return 'A'; // Fallback
  };

  const addTeam = () => {
    if (teamName.trim() === "") return;
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName.trim(),
      pool: getNextPool()
    };

    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    onTeamsRegistered(updatedTeams);
    setTeamName("");
  };

  const removeTeam = (teamId: string) => {
    const updatedTeams = teams.filter(team => team.id !== teamId);
    setTeams(updatedTeams);
    onTeamsRegistered(updatedTeams);
  };

  const groupedTeams = teams.reduce((acc, team) => {
    if (!acc[team.pool]) acc[team.pool] = [];
    acc[team.pool].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Team Registration</h2>
      
      {/* Add Team Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Team</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addTeam()}
          />
          <Button onClick={addTeam} disabled={!teamName.trim()}>
            Add Team
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Teams will be automatically assigned to pools (max 5 teams per pool)
        </p>
      </div>

      {/* Teams by Pool */}
      <div className="space-y-6">
        {Object.entries(groupedTeams).map(([pool, poolTeams]) => (
          <div key={pool} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Pool {pool}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {poolTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <span className="font-medium">{team.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTeam(team.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {poolTeams.length}/5 teams in this pool
            </p>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No teams registered yet. Add your first team above!
        </div>
      )}
    </div>
  );
}
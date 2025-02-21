"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';

const dummyData = {
  teams: [
    {
      id: 1,
      name: "Sharks",
      players: [
        { id: 1, number: "1", name: "Alex", goals: { q1: 0, q2: 0, q3: 0 }},
        { id: 2, number: "2", name: "Jordan", goals: { q1: 0, q2: 0, q3: 0 }},
      ],
      score: 0,
    },
    {
      id: 2,
      name: "Dolphins",
      players: [
        { id: 3, number: "1", name: "Sam", goals: { q1: 0, q2: 0, q3: 0 }},
        { id: 4, number: "2", name: "Taylor", goals: { q1: 0, q2: 0, q3: 0 }},
      ],
      score: 0,
    },
  ],
};

interface Player {
  id: number;
  name: string;
  goals: { q1: number; q2: number; q3: number };
  number: string
}

interface Team {
  id: number;
  name: string;
  players: Player[];
  score: number;
}

export default function ScoringApp() {
  const [teams, setTeams] = useState<Team[]>(dummyData.teams);

  const incrementScore = (teamId: number, playerId: number, quarter: keyof Player["goals"]) => {
    const updatedTeams = teams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  goals: { 
                    ...player.goals, 
                    [quarter]: (player.goals[quarter] || 0) + 1 
                  },
                }
              : player
          ),
          score: team.score + 1,
        };
      }
      return team;
    });
    setTeams(updatedTeams);
  };

  const decreaseScore = (teamId: number, playerId: number, quarter: keyof Player["goals"]) => {
    const updatedTeams = teams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  goals: { 
                    ...player.goals, 
                    [quarter]: Math.max(0, (player.goals[quarter] || 0) - 1) // Prevent negative goals
                  },
                }
              : player
          ),
          score: Math.max(0, team.score - 1), // Prevent negative team score
        };
      }
      return team;
    });
    setTeams(updatedTeams);
  };

  return (
    <div className="p-6 grid gap-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Team Statistics</h2>
      {teams.map((team) => (
        <Card key={team.id} className="p-4">
          <CardContent>
            <div className="grid grid-cols-[auto,1fr] gap-2 items-stretch">
              {/* Team Name (Sideways) */}
              <div className="bg-gray-800 text-white text-lg font-bold px-4 py-2 flex items-center justify-center 
                [writing-mode:sideways-lr]">
                {team.name}
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2" rowSpan={2}>##</th>
                    <th className="border border-gray-300 p-2" colSpan={3}>Fouls</th>
                    <th className="border border-gray-300 p-2" rowSpan={2}>Player</th>
                    <th className="border border-gray-300 p-2" colSpan={3}>Goals</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">1</th>
                    <th className="border border-gray-300 p-2">2</th>
                    <th className="border border-gray-300 p-2">3</th>
                    <th className="border border-gray-300 p-2">Q1</th>
                    <th className="border border-gray-300 p-2">Q2</th>
                    <th className="border border-gray-300 p-2">Q3</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player) => (
                    <tr key={player.id} className="h-full">
                      <td className="border border-gray-300 p-2">{player.number}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          1
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          1
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                         1
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2">{player.name}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 text-center">{player.goals.q1}</span>
                          <div className="flex flex-col gap-y-2">
                            <Button className="p-0 h-4" onClick={() => incrementScore(team.id, player.id, "q1")}>
                              <ChevronUp size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                            <Button className="p-0 h-4" onClick={() => decreaseScore(team.id, player.id, "q1")}>
                              <ChevronDown size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 text-center">{player.goals.q2}</span>
                          <div className="flex flex-col gap-y-2">
                            <Button className="p-0 h-4" onClick={() => incrementScore(team.id, player.id, "q2")}>
                              <ChevronUp size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                            <Button className="p-0 h-4" onClick={() => decreaseScore(team.id, player.id, "q2")}>
                              <ChevronDown size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 text-center">{player.goals.q3}</span>
                          <div className="flex flex-col gap-y-2">
                            <Button className="p-0 h-4" onClick={() => incrementScore(team.id, player.id, "q3")}>
                              <ChevronUp size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                            <Button className="p-0 h-4" onClick={() => decreaseScore(team.id, player.id, "q3")}>
                              <ChevronDown size={16} color="#ffffff" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
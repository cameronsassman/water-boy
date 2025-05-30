import React from "react";
import { TeamStats } from "../../lib/calculations";

type Props = {
  standings: Record<string, TeamStats[]>;
};

export default function StandingsTable({ standings }: Props) {
  return (
    <div className="space-y-12">
      {Object.entries(standings).map(([pool, teams]) => (
        <div key={pool}>
          <h2 className="text-xl font-bold mb-4">Pool {pool}</h2>
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2 text-right">GP</th>
                <th className="px-4 py-2 text-right">W</th>
                <th className="px-4 py-2 text-right">D</th>
                <th className="px-4 py-2 text-right">L</th>
                <th className="px-4 py-2 text-right">GF</th>
                <th className="px-4 py-2 text-right">GA</th>
                <th className="px-4 py-2 text-right">GD</th>
                <th className="px-4 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.team} className="border-t">
                  <td className="px-4 py-2">{team.team}</td>
                  <td className="px-4 py-2 text-right">{team.gamesPlayed}</td>
                  <td className="px-4 py-2 text-right">{team.wins}</td>
                  <td className="px-4 py-2 text-right">{team.draws}</td>
                  <td className="px-4 py-2 text-right">{team.losses}</td>
                  <td className="px-4 py-2 text-right">{team.goalsFor}</td>
                  <td className="px-4 py-2 text-right">{team.goalsAgainst}</td>
                  <td className="px-4 py-2 text-right">{team.goalDifference}</td>
                  <td className="px-4 py-2 text-right">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

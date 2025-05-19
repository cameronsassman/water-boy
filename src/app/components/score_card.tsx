"use client"

import { useState } from "react";
import { Team, TeamKey, StatType, Player } from "../../lib/types";
import ScoreDisplay from "./score_display";
import PlayerList from "./player_list";
import PlayerStatsModal from "./player_stats";

export default function ScoreCard() {
  const [blueTeam, setBlueTeam] = useState<Team>({
    name: "Blue team",
    score: 0,
    stats: { wins: 0, losses: 0, draws: 0 },
    players: Array.from({ length: 14 }, (_, i) => ({
      capNumber: i + 1,
      name: `Player ${i + 1}`,
      goals: 0,
      kickouts: 0,
      yellowCards: 0,
      redCards: 0,
    })),
  });

  const [whiteTeam, setWhiteTeam] = useState<Team>({
    name: "White team",
    score: 0,
    stats: { wins: 0, losses: 0, draws: 0 },
    players: Array.from({ length: 14 }, (_, i) => ({
      capNumber: i + 1,
      name: `Player ${i + 1}`,
      goals: 0,
      kickouts: 0,
      yellowCards: 0,
      redCards: 0,
    })),
  });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamKey | null>(null);

  const updateScore = (team: TeamKey, increment: number) => {
    if (team === "blue") {
      setBlueTeam((prev) => ({ ...prev, score: prev.score + increment }));
    } else {
      setWhiteTeam((prev) => ({ ...prev, score: prev.score + increment }));
    }
  };

  const updatePlayerStat = (player: Player, teamKey: TeamKey, statType: StatType, value: number) => {
    // Don't allow negative values
    if (value < 0 && player[statType] <= 0) return;
    
    const updateTeamState = (teamState: Team): Team => {
      const updatedPlayers = teamState.players.map((p) =>
        p.capNumber === player.capNumber
          ? { ...p, [statType]: p[statType] + value }
          : p
      );
      
      // If we're updating goals, also update the team score
      let updatedScore = teamState.score;
      if (statType === "goals") {
        updatedScore = teamState.score + value;
      }
      
      return { 
        ...teamState, 
        players: updatedPlayers,
        score: updatedScore 
      };
    };

    if (teamKey === "blue") {
      setBlueTeam(updateTeamState(blueTeam));
      // Update the selected player state to reflect changes
      if (selectedPlayer && selectedPlayer.capNumber === player.capNumber) {
        setSelectedPlayer({
          ...selectedPlayer,
          [statType]: selectedPlayer[statType] + value
        });
      }
    } else if (teamKey === "white") {
      setWhiteTeam(updateTeamState(whiteTeam));
      // Update the selected player state to reflect changes
      if (selectedPlayer && selectedPlayer.capNumber === player.capNumber) {
        setSelectedPlayer({
          ...selectedPlayer,
          [statType]: selectedPlayer[statType] + value
        });
      }
    }
  };

  const selectPlayer = (player: Player, team: TeamKey) => {
    setSelectedPlayer(player);
    setSelectedTeam(team);
  };

  const closePlayerStats = () => {
    setSelectedPlayer(null);
    setSelectedTeam(null);
  };

  const updateTeamName = (team: TeamKey, name: string) => {
    if (team === "blue") {
      setBlueTeam((prev) => ({ ...prev, name }));
    } else {
      setWhiteTeam((prev) => ({ ...prev, name }));
    }
  };
  
  // Function to handle editing team names
  const handleTeamNameEdit = (team: TeamKey) => {
    const newName = prompt(`Enter new name for ${team === "blue" ? blueTeam.name : whiteTeam.name}:`, 
      team === "blue" ? blueTeam.name : whiteTeam.name);
    
    if (newName) {
      updateTeamName(team, newName);
    }
  };

  const updatePlayerName = (teamKey: TeamKey, capNumber: number, name: string) => {
    if (teamKey === "blue") {
      setBlueTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.capNumber === capNumber ? { ...p, name } : p
        ),
      }));
      // Update the selected player state to reflect name change
      if (selectedPlayer && selectedPlayer.capNumber === capNumber) {
        setSelectedPlayer({
          ...selectedPlayer,
          name
        });
      }
    } else {
      setWhiteTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.capNumber === capNumber ? { ...p, name } : p
        ),
      }));
      // Update the selected player state to reflect name change
      if (selectedPlayer && selectedPlayer.capNumber === capNumber) {
        setSelectedPlayer({
          ...selectedPlayer,
          name
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">
        Junior Water Polo Score Card
      </h1>

      <ScoreDisplay 
        blueTeam={blueTeam}
        whiteTeam={whiteTeam}
        handleTeamNameEdit={handleTeamNameEdit}
      />

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-center mb-4">Player Stats</h2>

        <PlayerList 
          blueTeam={blueTeam}
          whiteTeam={whiteTeam}
          selectPlayer={selectPlayer}
        />
      </div>

      {selectedPlayer && selectedTeam && (
        <PlayerStatsModal
          player={selectedPlayer}
          teamKey={selectedTeam}
          closeModal={closePlayerStats}
          updatePlayerStat={updatePlayerStat}
          updatePlayerName={updatePlayerName}
        />
      )}
    </div>
  );
}
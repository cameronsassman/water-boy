// src/app/components/score_card_with_match.tsx
"use client"

import { useState, useEffect } from "react";
import { Team, TeamKey, StatType, Player } from "../../lib/types";
import ScoreDisplay from "./score_display";
import PlayerList from "./player_list";
import PlayerStatsModal from "./player_stats";
import { Button } from "@/components/ui/button";

interface Match {
  id: string;
  homeTeam: { id: string; name: string; pool: string };
  awayTeam: { id: string; name: string; pool: string };
  pool: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  homeGoals?: number;
  awayGoals?: number;
}

interface ScoreCardWithMatchProps {
  match?: Match;
  onMatchComplete?: (completedMatch: Match) => void;
  onBackToScheduler?: () => void;
}

export default function ScoreCardWithMatch({ 
  match, 
  onMatchComplete, 
  onBackToScheduler 
}: ScoreCardWithMatchProps) {
  const [blueTeam, setBlueTeam] = useState<Team>({
    name: match?.homeTeam.name || "Blue team",
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
    name: match?.awayTeam.name || "White team",
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
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Update team names when match changes
  useEffect(() => {
    if (match) {
      setBlueTeam(prev => ({ ...prev, name: match.homeTeam.name }));
      setWhiteTeam(prev => ({ ...prev, name: match.awayTeam.name }));
    }
  }, [match]);

  const updateScore = (team: TeamKey, increment: number) => {
    if (matchCompleted) return;
    
    if (team === "blue") {
      setBlueTeam((prev) => ({ ...prev, score: Math.max(0, prev.score + increment) }));
    } else {
      setWhiteTeam((prev) => ({ ...prev, score: Math.max(0, prev.score + increment) }));
    }
  };

  const updatePlayerStat = (player: Player, teamKey: TeamKey, statType: StatType, value: number) => {
    if (matchCompleted) return;
    
    // Don't allow negative values
    if (value < 0 && player[statType] <= 0) return;
    
    const updateTeamState = (teamState: Team): Team => {
      const updatedPlayers = teamState.players.map((p) =>
        p.capNumber === player.capNumber
          ? { ...p, [statType]: Math.max(0, p[statType] + value) }
          : p
      );
      
      // If we're updating goals, also update the team score
      let updatedScore = teamState.score;
      if (statType === "goals") {
        updatedScore = Math.max(0, teamState.score + value);
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
          [statType]: Math.max(0, selectedPlayer[statType] + value)
        });
      }
    } else if (teamKey === "white") {
      setWhiteTeam(updateTeamState(whiteTeam));
      // Update the selected player state to reflect changes
      if (selectedPlayer && selectedPlayer.capNumber === player.capNumber) {
        setSelectedPlayer({
          ...selectedPlayer,
          [statType]: Math.max(0, selectedPlayer[statType] + value)
        });
      }
    }
  };

  const selectPlayer = (player: Player, team: TeamKey) => {
    if (matchCompleted) return;
    setSelectedPlayer(player);
    setSelectedTeam(team);
  };

  const closePlayerStats = () => {
    setSelectedPlayer(null);
    setSelectedTeam(null);
  };

  const updateTeamName = (team: TeamKey, name: string) => {
    if (matchCompleted) return;
    
    if (team === "blue") {
      setBlueTeam((prev) => ({ ...prev, name }));
    } else {
      setWhiteTeam((prev) => ({ ...prev, name }));
    }
  };
  
  // Function to handle editing team names
  const handleTeamNameEdit = (team: TeamKey) => {
    if (matchCompleted || match) return; // Don't allow editing if match is from scheduler
    
    const newName = prompt(`Enter new name for ${team === "blue" ? blueTeam.name : whiteTeam.name}:`, 
      team === "blue" ? blueTeam.name : whiteTeam.name);
    
    if (newName) {
      updateTeamName(team, newName);
    }
  };

  const updatePlayerName = (teamKey: TeamKey, capNumber: number, name: string) => {
    if (matchCompleted) return;
    
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

  const handleCompleteMatch = () => {
    if (!match || !onMatchComplete) return;
    
    const completedMatch: Match = {
      ...match,
      status: 'completed',
      homeGoals: blueTeam.score,
      awayGoals: whiteTeam.score
    };
    
    setMatchCompleted(true);
    onMatchComplete(completedMatch);
    setShowConfirmDialog(false);
  };

  const resetMatch = () => {
    setBlueTeam(prev => ({
      ...prev,
      score: 0,
      players: prev.players.map(p => ({
        ...p,
        goals: 0,
        kickouts: 0,
        yellowCards: 0,
        redCards: 0
      }))
    }));
    setWhiteTeam(prev => ({
      ...prev,
      score: 0,
      players: prev.players.map(p => ({
        ...p,
        goals: 0,
        kickouts: 0,
        yellowCards: 0,
        redCards: 0
      }))
    }));
    setMatchCompleted(false);
    setSelectedPlayer(null);
    setSelectedTeam(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 rounded-lg shadow-lg">
      {/* Header with match info and controls */}
      {match && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              Pool {match.pool} Match
            </h2>
            <p className="text-sm text-gray-600">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </p>
          </div>
          <div className="flex gap-2">
            {onBackToScheduler && (
              <Button
                onClick={onBackToScheduler}
                variant="outline"
              >
                Back to Scheduler
              </Button>
            )}
            {!matchCompleted && (
              <>
                <Button
                  onClick={resetMatch}
                  variant="outline"
                >
                  Reset Match
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Match
                </Button>
              </>
            )}
            {matchCompleted && (
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">✓ Match Completed</span>
                <Button
                  onClick={resetMatch}
                  variant="outline"
                  size="sm"
                >
                  Start New Match
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-center mb-6">
        Junior Water Polo Score Card
      </h1>

      <ScoreDisplay 
        blueTeam={blueTeam}
        whiteTeam={whiteTeam}
        handleTeamNameEdit={handleTeamNameEdit}
        updateScore={updateScore}
        matchCompleted={matchCompleted}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Complete Match?</h3>
            <p className="mb-4">
              Final Score: {blueTeam.name} {blueTeam.score} - {whiteTeam.score} {whiteTeam.name}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will save the match results and mark it as completed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteMatch}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Match
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
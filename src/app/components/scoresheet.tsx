import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Player {
  name: string;
  capNumber: number;
  goals: number;
  kickouts: number;
  card: "none" | "yellow" | "red";
}

interface Team {
  name: string;
  players: Player[];
}

interface Props {
  blueTeam: Team;
  whiteTeam: Team;
  onEndGame: (blueTeam: Team, whiteTeam: Team) => void;
}

const ScoreSheet: React.FC<Props> = ({ blueTeam, whiteTeam, onEndGame }) => {
  const [blue, setBlue] = useState<Team>(blueTeam);
  const [white, setWhite] = useState<Team>(whiteTeam);
  const [gameEnded, setGameEnded] = useState(false);

  const updateStat = (
    teamSetter: React.Dispatch<React.SetStateAction<Team>>,
    team: Team,
    cap: number,
    field: keyof Player,
    value: any
  ) => {
    const updatedPlayers = team.players.map((player) => {
      if (player.capNumber === cap) {
        return {
          ...player,
          [field]: field === "goals" || field === "kickouts"
            ? Math.max(0, player[field] + value)
            : value,
        };
      }
      return player;
    });
    teamSetter({ ...team, players: updatedPlayers });
  };

  const handleEndGame = () => {
    setGameEnded(true);
    onEndGame(blue, white);
  };

  const renderPlayerRow = (playerBlue?: Player, playerWhite?: Player, capNumber?: number) => (
    <div key={capNumber} className="grid grid-cols-3 gap-4 py-2 border-b text-center">
      <div>
        {playerBlue?.name} #{playerBlue?.capNumber}
        <div className="flex justify-center gap-2">
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "goals", 1)}>+</Button>
          <span>{playerBlue?.goals}</span>
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "goals", -1)}>-</Button>
        </div>
        <div className="flex justify-center gap-2">
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "kickouts", 1)}>+</Button>
          <span>{playerBlue?.kickouts}</span>
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "kickouts", -1)}>-</Button>
        </div>
        <div className="flex justify-center gap-1">
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "card", "yellow")}>🟨</Button>
          <Button disabled={gameEnded} onClick={() => updateStat(setBlue, blue, capNumber!, "card", "red")}>🟥</Button>
        </div>
      </div>

      <div className="text-lg font-semibold">#{capNumber}</div>

      <div>
        {playerWhite?.name} #{playerWhite?.capNumber}
        <div className="flex justify-center gap-2">
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "goals", 1)}>+</Button>
          <span>{playerWhite?.goals}</span>
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "goals", -1)}>-</Button>
        </div>
        <div className="flex justify-center gap-2">
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "kickouts", 1)}>+</Button>
          <span>{playerWhite?.kickouts}</span>
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "kickouts", -1)}>-</Button>
        </div>
        <div className="flex justify-center gap-1">
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "card", "yellow")}>🟨</Button>
          <Button disabled={gameEnded} onClick={() => updateStat(setWhite, white, capNumber!, "card", "red")}>🟥</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {blue.name} vs {white.name}
      </h2>

      {Array.from({ length: 14 }).map((_, i) => {
        const cap = i + 1;
        const playerBlue = blue.players.find(p => p.capNumber === cap);
        const playerWhite = white.players.find(p => p.capNumber === cap);
        return renderPlayerRow(playerBlue, playerWhite, cap);
      })}

      <div className="mt-6 text-center">
        <button onClick={handleEndGame} disabled={gameEnded}>
          End Game
        </button>
      </div>
    </div>
  );
};

export default ScoreSheet;

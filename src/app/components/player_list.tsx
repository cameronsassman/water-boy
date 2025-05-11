// PlayerList.tsx
import { Team, Player, TeamKey } from "../../lib/types";

interface PlayerListProps {
  blueTeam: Team;
  whiteTeam: Team;
  selectPlayer: (player: Player, team: TeamKey) => void;
}

export default function PlayerList({ 
  blueTeam, 
  whiteTeam, 
  selectPlayer 
}: PlayerListProps) {
  return (
    <div className="flex">
      {/* Blue Team Players */}
      <div className="w-2/5">
        <h3 className="text-lg font-semibold text-blue-700 text-right mb-2 pr-2">
          Blue Caps
        </h3>
        <div>
          {blueTeam.players.map((player) => (
            <div
              key={`blue-${player.capNumber}`}
              className="flex justify-end items-center p-2 hover:bg-blue-50 cursor-pointer border-b border-blue-100 h-16"
              onClick={() => selectPlayer(player, "blue")}
            >
              <div className="mr-2 text-sm text-right">
                <div>{player.name}</div>
                <div className="text-xs text-gray-600">
                  G: {player.goals} | KO: {player.kickouts} | Y:{" "}
                  {player.yellowCards} | R: {player.redCards}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {player.capNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cap Numbers */}
      <div className="w-1/5">
        <h3 className="text-lg font-semibold text-center mb-2">Cap #</h3>
        <div className="w-full">
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className="flex justify-center items-center p-2 border border-gray-100 h-16"
            > 
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* White Team Players */}
      <div className="w-2/5">
        <h3 className="text-lg font-semibold text-gray-700 text-center mb-2">
          White Caps
        </h3>
        <div>
          {whiteTeam.players.map((player) => (
            <div
              key={`white-${player.capNumber}`}
              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 h-16"
              onClick={() => selectPlayer(player, "white")}
            >
              <div className="w-8 h-8 bg-gray-100 border border-gray-300 text-gray-700 rounded-full flex items-center justify-center font-bold">
                {player.capNumber}
              </div>
              <div className="ml-2 text-sm">
                <div>{player.name}</div>
                <div className="text-xs text-gray-600">
                  G: {player.goals} | KO: {player.kickouts} | Y:{" "}
                  {player.yellowCards} | R: {player.redCards}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
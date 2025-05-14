// PlayerStatsModal.tsx
import { Player, TeamKey, StatType } from "../../lib/types";

interface PlayerStatsModalProps {
  player: Player;
  teamKey: TeamKey;
  closeModal: () => void;
  updatePlayerStat: (player: Player, teamKey: TeamKey, statType: StatType, value: number) => void;
  updatePlayerName: (teamKey: TeamKey, capNumber: number, name: string) => void;
}

export default function PlayerStatsModal({
  player,
  teamKey,
  closeModal,
  updatePlayerStat,
  updatePlayerName,
}: PlayerStatsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            Player #{player.capNumber} -{" "}
            {teamKey === "blue" ? "Blue Team" : "White Team"}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player Name
          </label>
          <input
            type="text"
            value={player.name}
            onChange={(e) =>
              updatePlayerName(teamKey, player.capNumber, e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-4">
          {/* Goals */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Goals</span>
              <div className="flex items-center">
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "goals", -1)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-l-md hover:bg-red-200"
                  disabled={player.goals <= 0}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-gray-100 font-bold">
                  {player.goals}
                </div>
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "goals", 1)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-r-md hover:bg-green-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Kick-outs */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Kick-outs</span>
              <div className="flex items-center">
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "kickouts", -1)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-l-md hover:bg-red-200"
                  disabled={player.kickouts <= 0}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-gray-100 font-bold">
                  {player.kickouts}
                </div>
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "kickouts", 1)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-r-md hover:bg-green-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Yellow Cards */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Yellow Cards</span>
              <div className="flex items-center">
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "yellowCards", -1)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-l-md hover:bg-red-200"
                  disabled={player.yellowCards <= 0}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-gray-100 font-bold">
                  {player.yellowCards}
                </div>
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "yellowCards", 1)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-r-md hover:bg-green-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Red Cards */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Red Cards</span>
              <div className="flex items-center">
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "redCards", -1)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-l-md hover:bg-red-200"
                  disabled={player.redCards <= 0}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-gray-100 font-bold">
                  {player.redCards}
                </div>
                <button
                  onClick={() => updatePlayerStat(player, teamKey, "redCards", 1)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-r-md hover:bg-green-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
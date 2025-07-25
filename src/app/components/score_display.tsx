// src/app/components/score_display_updated.tsx
import { Team, TeamKey } from "../../lib/types";

interface ScoreDisplayProps {
  blueTeam: Team;
  whiteTeam: Team;
  handleTeamNameEdit: (team: TeamKey) => void;
  updateScore?: (team: TeamKey, increment: number) => void;
  matchCompleted?: boolean;
}

export default function ScoreDisplay({
  blueTeam,
  whiteTeam,
  handleTeamNameEdit,
  updateScore,
  matchCompleted = false,
}: ScoreDisplayProps) {
  return (
    <div className="border-2 border-black rounded-lg p-6 mb-6 bg-white">
      <div className="flex">
        {/* Team Names and W/L/D */}
        <div className="w-1/4 text-left">
          <div
            className="font-bold text-xl text-blue-800 mb-2 cursor-pointer"
            onClick={() => handleTeamNameEdit("blue")}
          >
            {blueTeam.name}
          </div>
          <div className="text-sm text-gray-600">w/l/d</div>
        </div>

        {/* Central Score Display */}
        <div className="w-2/4 flex justify-center items-center">
          <div className="flex items-center">
            {/* Blue team score controls */}
            {updateScore && !matchCompleted && (
              <div className="flex flex-col mr-2">
                <button
                  onClick={() => updateScore("blue", 1)}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-t hover:bg-blue-200 text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => updateScore("blue", -1)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded-b hover:bg-red-200 text-sm"
                  disabled={blueTeam.score <= 0}
                >
                  -
                </button>
              </div>
            )}
            
            <div className="text-5xl font-bold mx-2">{blueTeam.score}</div>
            <div className="text-4xl font-bold text-gray-800 mx-2">VS</div>
            <div className="text-5xl font-bold mx-2">{whiteTeam.score}</div>

            {/* White team score controls */}
            {updateScore && !matchCompleted && (
              <div className="flex flex-col ml-2">
                <button
                  onClick={() => updateScore("white", 1)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-t hover:bg-gray-200 text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => updateScore("white", -1)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded-b hover:bg-red-200 text-sm"
                  disabled={whiteTeam.score <= 0}
                >
                  -
                </button>
              </div>
            )}
          </div>
        </div>

        {/* White Team Name and W/L/D */}
        <div className="w-1/4 text-right">
          <div
            className="font-bold text-xl text-gray-800 mb-2 cursor-pointer"
            onClick={() => handleTeamNameEdit("white")}
          >
            {whiteTeam.name}
          </div>
          <div className="text-sm text-gray-600">w/l/d</div>
        </div>
      </div>
      
      {matchCompleted && (
        <div className="mt-4 text-center">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
            ✓ Match Completed
          </div>
        </div>
      )}
    </div>
  );
}
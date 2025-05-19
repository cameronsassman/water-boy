// ScoreDisplay.tsx
import { Team, TeamKey } from "../../lib/types";

interface ScoreDisplayProps {
  blueTeam: Team;
  whiteTeam: Team;
  handleTeamNameEdit: (team: TeamKey) => void;
}

export default function ScoreDisplay({
  blueTeam,
  whiteTeam,
  handleTeamNameEdit
}: ScoreDisplayProps) {
  return (
    <div className="border-2 border-black rounded-lg p-6 mb-6 bg-white">
      <div className="flex">
        {/* Team Names and W/L/D */}
        <div className="w-1/4 text-left">
          <div 
            className="font-bold text-xl text-blue-800 mb-2 cursor-pointer" 
            style={{ fontFamily: 'cursive' }}
            onClick={() => handleTeamNameEdit("blue")}
          >
            {blueTeam.name}
          </div>
          <div className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
            w/l/d
          </div>
        </div>
        
        {/* Central Score Display */}
        <div className="w-2/4 flex justify-center items-center">
          <div className="text-5xl font-bold mx-2" style={{ fontFamily: 'cursive' }}>
            {blueTeam.score}
          </div>
          
          <div className="text-4xl font-bold text-gray-800 mx-2" style={{ fontFamily: 'cursive' }}>VS</div>
          
          <div className="text-5xl font-bold mx-2" style={{ fontFamily: 'cursive' }}>
            {whiteTeam.score}
          </div>
        </div>
        
        {/* White Team Name and W/L/D */}
        <div className="w-1/4 text-right">
          <div 
            className="font-bold text-xl text-gray-800 mb-2 cursor-pointer" 
            style={{ fontFamily: 'cursive' }}
            onClick={() => handleTeamNameEdit("white")}
          >
            {whiteTeam.name}
          </div>
          <div className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
            w/l/d
          </div>
        </div>
      </div>
    </div>
  );
}
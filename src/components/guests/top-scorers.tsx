// components/guests/top-scorers.tsx
"use client";

import { useState, useEffect } from 'react';

interface TopScorer {
  playerId: string;
  name: string;
  capNumber: number;
  totalGoals: number;
  team: {
    schoolName: string;
    teamLogo: string | null;
  };
}

interface TopScorersProps {
  limit?: number;
}

export default function TopScorers({ limit = 5 }: TopScorersProps) {
  const [data, setData] = useState<{ scorers: TopScorer[]; totalGoals: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/top-scorers?limit=${limit}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return (
    <div className="w-full max-w-full bg-white border border-gray-200 rounded-lg lg:rounded-none lg:border-l-0 lg:border-r lg:border-t-0 lg:border-b-0 h-fit overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r lg:bg-gradient-to-b from-blue-50 to-white p-3 lg:p-4 border-b border-gray-200 w-full">
        <div className="flex items-center justify-between w-full">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide truncate">🏆 Top Scorers</h3>
          {data && (
            <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border flex-shrink-0">
              Total: <span className="font-bold">{data.totalGoals}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 lg:p-4 w-full">
        {isLoading ? (
          <div className="space-y-3 w-full">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 w-full">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="w-32 h-3 bg-gray-200 rounded animate-pulse mb-2 max-w-full"></div>
                  <div className="w-24 h-2 bg-gray-200 rounded animate-pulse max-w-full"></div>
                </div>
                <div className="w-8 h-6 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
              </div>
            ))}
          </div>
        ) : !data?.scorers?.length ? (
          <div className="text-center py-4 lg:py-6 w-full">
            <div className="text-gray-400 text-2xl mb-2">⚽</div>
            <p className="text-gray-500 text-sm">No goals scored yet</p>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {data.scorers.map((player, index) => (
              <div 
                key={player.playerId} 
                className="flex items-center gap-3 p-2 lg:p-3 rounded-lg hover:bg-blue-50 transition-colors w-full"
              >
                {/* Position Badge */}
                <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${index === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                    index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-300' : 
                    index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                  {index + 1}
                </div>

                {/* Team Logo */}
                {player.team.teamLogo && (
                  <div className="flex-shrink-0">
                    <img 
                      src={player.team.teamLogo} 
                      alt=""
                      className="w-8 h-8 lg:w-10 lg:h-10 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Player Info */}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">{player.team.schoolName}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">#{player.capNumber}</span>
                  </div>
                </div>

                {/* Goals */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900 text-sm lg:text-base">{player.totalGoals}</div>
                  <div className="text-xs text-gray-400 hidden lg:block">goals</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
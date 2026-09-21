"use client";

import Bubble from "./Bubble";
import { useHomeData } from "./HomeDataProvider";

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function TeamBadge({ label }: { label: string }) {
  return (
    <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-black text-white text-sm shrink-0">
      {label}
    </span>
  );
}

export default function LivePanel() {
  const { live } = useHomeData();

  return (
    <div className="relative bg-[#07091F] rounded-3xl overflow-hidden px-7 py-7 flex flex-col min-h-[260px]">
      <Bubble className="w-40 h-40 -top-16 -right-10 bg-white/[0.04] border-0" />
      <Bubble className="w-28 h-28 -bottom-10 -left-8 bg-white/[0.04] border-0" />

      {live.length > 0 ? (
        <div className="relative flex-1 flex flex-col justify-center gap-6 divide-y divide-white/10">
          {live.map((match, i) => (
            <div key={match.id} className={`text-center ${i > 0 ? "pt-6" : ""}`}>
              <p className="text-[#38B6E8] text-xs font-bold uppercase tracking-widest mb-4">
                {match.pool_name ?? "Main Pool"}
              </p>

              <div className="flex items-center justify-center gap-6">
                <TeamBadge label={initials(match.home_team_name)} />
                <span className="font-black text-4xl text-white tabular-nums">
                  {match.home_score ?? 0}
                  <span className="text-[#38B6E8] mx-2">–</span>
                  {match.away_score ?? 0}
                </span>
                <TeamBadge label={initials(match.away_team_name)} />
              </div>

              <div className="flex items-center justify-center gap-16 mt-2">
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  {match.home_team_name}
                </span>
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  {match.away_team_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative flex-1 flex items-center justify-center text-center text-white/50 text-sm">
          No matches live right now
        </div>
      )}
    </div>
  );
}
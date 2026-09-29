"use client";

import Bubble from "./Bubble";
import { useHomeData } from "./HomeDataProvider";

export default function LivePanel() {
  const { live } = useHomeData();

  return (
    <div className="relative bg-[#07091F] rounded-3xl overflow-hidden px-7 py-7 flex flex-col min-h-[260px]">
      <Bubble className="w-40 h-40 -top-16 -right-10 bg-white/[0.04] border-0" />
      <Bubble className="w-28 h-28 -bottom-10 -left-8 bg-white/[0.04] border-0" />

      {live.length > 0 ? (
        <div className={`relative flex-1 grid gap-4 ${live.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 place-content-center"}`}>
          {live.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 flex flex-col justify-center"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E23744] animate-pulse" />
                <p className="text-[#38B6E8] text-[10px] font-bold uppercase tracking-widest">
                  {match.pool_name ?? "Main Pool"} · Live
                </p>
              </div>

              <div className="divide-y divide-white/10">
                <div className="flex items-center gap-3 py-2.5">
                  <span className="text-white text-xs font-bold uppercase tracking-wider flex-1 min-w-0 truncate">
                    {match.home_team_name}
                  </span>
                  <span className="font-black text-xl text-white tabular-nums shrink-0">
                    {match.home_score ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2.5">
                  <span className="text-white text-xs font-bold uppercase tracking-wider flex-1 min-w-0 truncate">
                    {match.away_team_name}
                  </span>
                  <span className="font-black text-xl text-white tabular-nums shrink-0">
                    {match.away_score ?? 0}
                  </span>
                </div>
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
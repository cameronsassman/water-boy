"use client";

import { useHomeData } from "./HomeDataProvider";

type Upcoming = ReturnType<typeof useHomeData>["upcoming"][number];

// Anything matching "high school" goes right; everything else (Aquatic Centre) goes left.
const isRightPool = (name?: string | null) => /high\s*school/i.test(name ?? "");

function buildRows(upcoming: Upcoming[]) {
  const sorted = [...upcoming].sort(
    (a, b) =>
      a.day - b.day ||
      (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99"),
  );

  const slots = new Map<string, { left: Upcoming[]; right: Upcoming[] }>();
  for (const m of sorted) {
    const key = `${m.day}|${m.start_time ?? "TBC"}`;
    const slot = slots.get(key) ?? { left: [], right: [] };
    (isRightPool(m.pool_name) ? slot.right : slot.left).push(m);
    slots.set(key, slot);
  }

  return [...slots.values()].flatMap(({ left, right }) =>
    Array.from({ length: Math.max(left.length, right.length) }, (_, i) => ({
      left: left[i] as Upcoming | undefined,
      right: right[i] as Upcoming | undefined,
    })),
  );
}

function UpcomingCard({ match }: { match: Upcoming }) {
  return (
    <div className="rounded-2xl border border-[#CFE6F8] bg-[#F3FAFF] px-3 py-3 sm:px-5 sm:py-4 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C]">
          {match.pool_name ?? "Main Pool"}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8]">
          Day {match.day} · {match.start_time ?? "TBC"}
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="w-full font-bold uppercase text-xs text-gray-900 truncate">
          {match.home_team_name}
        </span>
        <span className="font-black text-[10px] text-white bg-[#07091F] rounded-full px-3 py-1">
          vs
        </span>
        <span className="w-full font-bold uppercase text-xs text-gray-900 truncate">
          {match.away_team_name}
        </span>
      </div>
    </div>
  );
}

export default function HomeMain() {
  const { upcoming, groups, scorers } = useHomeData();
  const rows = buildRows(upcoming);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-10">
        <section id="live">
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-[#CFE6F8] bg-white px-4 py-8 text-center text-gray-400 text-sm">
              No upcoming matches right now
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {rows.flatMap((row, i) =>
                [row.left, row.right].map((match, side) =>
                  match ? (
                    <UpcomingCard key={match.id} match={match} />
                  ) : (
                    <div key={`empty-${i}-${side}`} />
                  ),
                ),
              )}
            </div>
          )}
        </section>

        <section id="standings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div key={g.id} className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden">
                <div className="bg-[#07091F] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-white font-black uppercase text-xs tracking-wider">{g.name}</span>
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-widest">Pts</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {g.rows.length === 0 ? (
                    <div className="px-4 py-4 text-center text-gray-400 text-xs">No matches played yet</div>
                  ) : (
                    g.rows.map((row) => (
                      <div key={row.team_id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-5 text-gray-400 font-bold text-xs shrink-0">{row.rank}</span>
                        <span className="flex-1 font-bold uppercase text-xs text-gray-900 truncate">
                          {row.team_name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {row.played}P · {row.point_diff >= 0 ? "+" : ""}
                          {row.point_diff}
                        </span>
                        <span className="font-black text-sm text-[#1B6FC8] w-6 text-right">{row.points}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section id="scorers" className="self-start">
        <div className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-black uppercase text-sm tracking-wide text-[#07091F]">Top Scorers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {scorers.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No goals scored yet</div>
            ) : (
              scorers.map((s, i) => (
                <div key={s.player_id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      i === 0 ? "text-[#1B6FC8]" : "text-gray-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{s.player_name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.team_name}</div>
                  </div>
                  <div className="font-black text-lg text-[#07091F]">{s.goals}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
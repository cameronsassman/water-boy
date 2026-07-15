export default function StandingsLoading() {
    return (
      <div className="min-h-screen bg-[#FFFFFC]">
        <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">Group Stage · Live updated</div>
            <h1 className="text-white font-black uppercase text-4xl leading-none">Standings</h1>
            <p className="text-[#7A9CC8] text-sm mt-1">Top 4 per group → Cup · Bottom 4 → Festival</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-200 bg-white overflow-hidden animate-pulse">
                <div className="bg-[#07091F] px-4 py-3 flex items-center justify-between">
                  <div className="h-4 w-24 bg-white/20 rounded" />
                  <div className="h-3 w-14 bg-white/10 rounded" />
                </div>
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2 px-2 py-3">
                      <div className="w-5 h-5 bg-gray-200 rounded shrink-0" />
                      <div className="flex-1 h-3 bg-gray-200 rounded" />
                      {Array.from({ length: 5 }).map((_, k) => (
                        <div key={k} className="w-6 h-3 bg-gray-100 rounded" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
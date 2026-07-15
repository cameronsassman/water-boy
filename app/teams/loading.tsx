export default function TeamsLoading() {
    return (
      <div className="min-h-screen bg-[#FFFFFC]">
        <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">32 Teams · 4 Groups</div>
            <h1 className="text-white font-black uppercase text-4xl leading-none">Teams</h1>
            <p className="text-[#7A9CC8] text-sm mt-1">Profiles · Player stats · Standings</p>
          </div>
        </div>
  
        {/* Top scorers skeleton */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="max-w-7xl mx-auto">
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] border-l-2 border-[#F5C518] pl-2 mb-4">Tournament Top Scorers</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1 animate-pulse">
                  <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
  
        {/* Group tabs skeleton */}
        <div className="border-b-2 border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto flex gap-1 px-5 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
  
        {/* Team rows skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border border-gray-200 bg-white flex items-center gap-3 px-4 py-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-40" />
                <div className="h-2.5 bg-gray-100 rounded w-56" />
              </div>
              <div className="hidden sm:flex gap-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="w-10 h-8 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
export default function StandingsLoading() {
  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden animate-pulse"
            >
              <div className="bg-[#07091F] px-4 py-3 flex items-center justify-between">
                <div className="h-4 w-24 bg-white/20 rounded" />
                <div className="h-3 w-14 bg-white/10 rounded" />
              </div>
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2 px-4 py-3">
                    <div className="w-5 h-5 bg-[#EAF6FE] rounded-full shrink-0" />
                    <div className="flex-1 h-3 bg-[#EAF6FE] rounded" />
                    {Array.from({ length: 5 }).map((_, k) => (
                      <div key={k} className="w-6 h-3 bg-[#EAF6FE]/60 rounded" />
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
export default function FixturesLoading() {
    return (
      <div className="min-h-screen bg-[#EAF6FE]">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((d) => (
              <div
                key={d}
                className="h-10 w-20 rounded-full bg-white border border-[#CFE6F8] animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white border border-[#CFE6F8]" />
            ))}
          </div>
        </div>
      </div>
    );
  }
export default function Loading() {
    return (
      <div className="fixed inset-0 bg-gray-50 z-40 flex items-center justify-center">
        <div className="text-center">
          {/* Spinner */}
          <div className="relative mb-8">
            {/* Outer ring */}
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            {/* Water polo ball in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🏊‍♂️</span>
              </div>
            </div>
          </div>
  
          {/* Loading text */}
          <div className="text-xl font-semibold text-blue-900 mb-2">
            Loading...
          </div>
          
          {/* Subtitle */}
          <div className="text-sm text-blue-600">
            SACS Water Polo Tournament
          </div>
        </div>
      </div>
    );
  }
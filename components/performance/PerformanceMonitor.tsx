// components/performance/PerformanceMonitor.tsx
"use client";
import { useEffect, useState } from "react";
import { usePerformance } from "./PerformanceContext";

export default function PerformanceMonitor() {
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const { getPerformanceData } = usePerformance();

  useEffect(() => {
    // Measure client-side performance
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");
    const firstPaint = paint.find((p) => p.name === "first-paint")?.startTime || 0;
    const firstContentfulPaint = paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0;

    const perfData = getPerformanceData();

    setMetrics({
      pageLoadTime: navigation?.domComplete - navigation?.fetchStart || 0,
      renderTime: firstContentfulPaint || firstPaint || 0,
      hydrationTime: performance.now(),
      totalTime: navigation?.domComplete - navigation?.fetchStart || 0,
      ...perfData,
    });
  }, [getPerformanceData]);

  if (!metrics) return null;

  const formatTime = (ms: number) => {
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getColor = (time: number) => {
    if (time < 100) return "text-green-400";
    if (time < 500) return "text-yellow-400";
    return "text-red-400";
  };

  const totalTime = metrics.totalTime || metrics.pageLoadTime;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
          expanded ? "bg-[#07091F] text-white" : "bg-[#1B6FC8] text-white hover:bg-[#0D4A8A]"
        } shadow-lg border border-[#38B6E8]/30`}
      >
        {expanded ? "✕ Close" : `⚡ ${formatTime(totalTime)}`}
      </button>

      {expanded && (
        <div className="absolute bottom-14 right-0 w-96 max-h-[80vh] overflow-y-auto bg-[#07091F] border border-[#1B3A6E] shadow-2xl p-4 text-xs font-mono">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1B3A6E]">
            <span className="text-[#38B6E8] font-bold uppercase tracking-wider">Performance</span>
            <span className="text-[#7A9CC8] text-[10px]">{metrics.timestamp}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#7A9CC8]">Total Page Load</span>
              <span className={`font-bold ${getColor(totalTime)}`}>{formatTime(totalTime)}</span>
            </div>

            {metrics.serverRenderTime > 0 && (
              <div className="flex justify-between">
                <span className="text-[#7A9CC8]">Server Render</span>
                <span className="text-white">{formatTime(metrics.serverRenderTime)}</span>
              </div>
            )}

            {metrics.dataFetchTime > 0 && (
              <div className="flex justify-between">
                <span className="text-[#7A9CC8]">Data Fetching</span>
                <span className={`font-bold ${getColor(metrics.dataFetchTime)}`}>
                  {formatTime(metrics.dataFetchTime)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[#7A9CC8]">Client Hydration</span>
              <span className="text-white">{formatTime(metrics.hydrationTime)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#7A9CC8]">First Paint</span>
              <span className="text-white">{formatTime(metrics.renderTime)}</span>
            </div>
          </div>

          {metrics.dataSources && metrics.dataSources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#1B3A6E]">
              <div className="text-[#7A9CC8] text-[10px] uppercase tracking-wider mb-1">Data Sources</div>
              {metrics.dataSources.map((ds: any, i: number) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-[#7A9CC8] truncate max-w-[200px]">{ds.name}</span>
                  <span className={getColor(ds.time)}>{formatTime(ds.time)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-[#1B3A6E] text-[10px] text-[#3A5A8E]">
            <div>Page: {metrics.pagePath || "unknown"}</div>
            <div>Mode: {metrics.serverRenderTime > 0 ? "SSR" : "CSR"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
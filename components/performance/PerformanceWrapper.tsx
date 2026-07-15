// components/performance/PerformanceWrapper.tsx
"use client";
import { useEffect, useState } from "react";
import PerformanceMonitor from "./PerformanceMonitor";

type PerformanceWrapperProps = {
  children: React.ReactNode;
  dataSources?: { name: string; time: number }[];
  serverRenderTime?: number;
  dataFetchTime?: number;
};

export default function PerformanceWrapper({
  children,
  dataSources = [],
  serverRenderTime = 0,
  dataFetchTime = 0,
}: PerformanceWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [fetchTime, setFetchTime] = useState(dataFetchTime);

  useEffect(() => {
    setMounted(true);
    // Measure actual data fetch time if not provided
    if (!dataFetchTime && dataSources.length > 0) {
      // This will be overridden by the monitor's own measurement
      setFetchTime(performance.now());
    }
  }, [dataFetchTime, dataSources]);

  // Use a performance mark to track component render
  useEffect(() => {
    performance.mark("component-render-start");
    return () => {
      performance.mark("component-render-end");
      performance.measure("component-render", "component-render-start", "component-render-end");
    };
  }, []);

  return (
    <>
      {children}
      {mounted && (
        <PerformanceMonitor
          dataFetchTime={fetchTime}
          dataSources={dataSources}
          serverRenderTime={serverRenderTime}
        />
      )}
    </>
  );
}
// lib/performance.ts
"use server";
import { headers } from "next/headers";

export async function measureServerPerformance<T>(
  fn: () => Promise<T>
): Promise<{ data: T; renderTime: number; fetchTime: number }> {
  const start = Date.now();
  const data = await fn();
  const fetchTime = Date.now() - start;
  
  // Server render time is measured from request start
  const headersList = headers();
  const requestStart = parseInt(headersList.get("x-request-start") || "0");
  const renderTime = requestStart > 0 ? Date.now() - requestStart : 0;

  return { data, renderTime, fetchTime };
}

// For client components
export function usePerformanceTracking(name: string) {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      // Store in sessionStorage to persist across navigations
      if (typeof window !== "undefined") {
        const existing = JSON.parse(sessionStorage.getItem("perf-data") || "[]");
        existing.push({ name, time: duration, timestamp: Date.now() });
        sessionStorage.setItem("perf-data", JSON.stringify(existing));
      }
      return duration;
    },
  };
}
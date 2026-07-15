// components/performance/PerformanceContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type DataSource = { name: string; time: number };
type PerformanceData = {
  dataSources: DataSource[];
  serverRenderTime: number;
  dataFetchTime: number;
  pagePath: string;
  timestamp: string;
};

type PerformanceContextType = {
  addDataSource: (name: string, time: number) => void;
  setServerRenderTime: (time: number) => void;
  setDataFetchTime: (time: number) => void;
  getPerformanceData: () => PerformanceData | null;
};

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [serverRenderTime, setServerRenderTime] = useState(0);
  const [dataFetchTime, setDataFetchTime] = useState(0);
  const [pagePath, setPagePath] = useState("");

  useEffect(() => {
    setPagePath(window.location.pathname);
  }, []);

  const addDataSource = (name: string, time: number) => {
    setDataSources((prev) => [...prev, { name, time }]);
  };

  const getPerformanceData = (): PerformanceData | null => {
    if (!pagePath) return null;
    return {
      dataSources,
      serverRenderTime,
      dataFetchTime,
      pagePath,
      timestamp: new Date().toLocaleTimeString(),
    };
  };

  return (
    <PerformanceContext.Provider
      value={{
        addDataSource,
        setServerRenderTime,
        setDataFetchTime,
        getPerformanceData,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used within PerformanceProvider");
  }
  return context;
}
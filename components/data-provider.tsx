"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface DataContextValue {
  refreshKey: number;
  mutate: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const mutate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <DataContext.Provider value={{ refreshKey, mutate }}>
      {children}
    </DataContext.Provider>
  );
}

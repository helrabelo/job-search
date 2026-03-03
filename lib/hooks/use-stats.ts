"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/data-provider";

interface StatsData {
  statusBreakdown: { status: string; count: number }[];
  dismissBreakdown: { dismiss_reason: string; count: number }[];
  timeline: { month: string; total: number; applied: number }[];
  keywords: { keyword: string; count: number }[];
  activity: {
    reviewedThisWeek: number;
    appliedThisWeek: number;
    lastAppliedAt: string | null;
  };
  remoteBreakdown: { is_remote: number; count: number }[];
}

interface Filters {
  status: string;
  remote: boolean;
  search: string;
  matchKeywords: boolean;
  sort?: string;
  sources: string[];
}

export function useStats(filters: Filters) {
  const { refreshKey } = useData();
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.remote) params.set("remote", "1");
    if (filters.search) params.set("search", filters.search);
    if (filters.matchKeywords) params.set("match_keywords", "1");
    if (filters.sources.length > 0) params.set("sources", filters.sources.join(","));

    fetch(`/api/stats?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [filters, refreshKey]);

  return data;
}

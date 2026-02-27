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
  threadId: string;
  matchKeywords: boolean;
  sort?: string;
  source?: string;
}

export function useStats(filters: Filters) {
  const { refreshKey } = useData();
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.remote) params.set("remote", "1");
    if (filters.search) params.set("search", filters.search);
    if (filters.threadId) params.set("thread_id", filters.threadId);
    if (filters.matchKeywords) params.set("match_keywords", "1");
    if (filters.source) params.set("source", filters.source);

    fetch(`/api/stats?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [filters, refreshKey]);

  return data;
}

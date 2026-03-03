"use client";

import { useEffect, useState } from "react";
import { DataProvider } from "@/components/data-provider";
import { RefreshButton } from "@/components/refresh-button";
import { FilterBar } from "@/components/filter-bar";
import { PostList } from "@/components/post-list";
import { StatsSidebar } from "@/components/stats-sidebar";

const LAST_SEEN_KEY = "hn-tracker-last-seen";
const FILTERS_KEY = "job-tracker-filters";

const DEFAULT_FILTERS = {
  status: "all",
  remote: false,
  search: "",
  matchKeywords: false,
  sources: [] as string[],
} as const;

type Filters = {
  status: string;
  remote: boolean;
  search: string;
  matchKeywords: boolean;
  sort?: string;
  sources: string[];
};

function getLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SEEN_KEY);
}

function updateLastSeen() {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

function loadFilters(): Filters {
  if (typeof window === "undefined") return { ...DEFAULT_FILTERS };
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    const saved = JSON.parse(raw);
    return {
      status: saved.status ?? DEFAULT_FILTERS.status,
      remote: saved.remote ?? DEFAULT_FILTERS.remote,
      search: "", // never persist search — it's ephemeral
      matchKeywords: saved.matchKeywords ?? DEFAULT_FILTERS.matchKeywords,
      sort: saved.sort,
      sources: Array.isArray(saved.sources) ? saved.sources : [],
    };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

function saveFilters(filters: Filters) {
  const { search, ...rest } = filters;
  localStorage.setItem(FILTERS_KEY, JSON.stringify(rest));
}

function DashboardContent() {
  const [filters, setFilters] = useState<Filters>(() => loadFilters());
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  // Persist filter changes to localStorage
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  useEffect(() => {
    setLastSeenAt(getLastSeen());
    // Update last seen after a brief delay so badges show on this visit
    const timer = setTimeout(updateLastSeen, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Job Tracker
          </h1>
          <p className="text-sm text-neutral-500">
            Job posts from HN, RemoteOK &amp; WeWorkRemotely
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>
          <PostList filters={filters} lastSeenAt={lastSeenAt} />
        </div>

        {/* Sidebar - hidden on small screens */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-8">
            <StatsSidebar filters={filters} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { PostStatus, Thread } from "@/lib/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "in_progress", label: "In Progress" },
  { value: "dismissed", label: "Dismissed" },
];

interface Filters {
  status: string;
  remote: boolean;
  search: string;
  threadId: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  refreshKey: number;
}

export function FilterBar({ filters, onChange, refreshKey }: FilterBarProps) {
  const [threads, setThreads] = useState<(Thread & { post_count: number })[]>(
    []
  );

  useEffect(() => {
    fetch("/api/threads")
      .then((r) => r.json())
      .then(setThreads)
      .catch(console.error);
  }, [refreshKey]);

  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange({ ...filters, status: tab.value })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.status === tab.value
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Second row: remote toggle, thread select, search */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.remote}
            onChange={(e) =>
              onChange({ ...filters, remote: e.target.checked })
            }
            className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
          />
          Remote only
        </label>

        <select
          value={filters.threadId}
          onChange={(e) => onChange({ ...filters, threadId: e.target.value })}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All threads</option>
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.month} ({t.post_count} posts)
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

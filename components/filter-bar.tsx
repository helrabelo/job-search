"use client";

import { useState } from "react";
import { useThreads } from "@/lib/hooks/use-threads";
import { KeywordManager } from "./keyword-manager";

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
  matchKeywords: boolean;
  sort?: string;
  source?: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const threads = useThreads();
  const [showKeywordManager, setShowKeywordManager] = useState(false);

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

        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.matchKeywords}
            onChange={(e) =>
              onChange({ ...filters, matchKeywords: e.target.checked })
            }
            className="rounded border-neutral-300 text-yellow-500 focus:ring-yellow-500"
          />
          Matches my skills
        </label>

        <button
          onClick={() => setShowKeywordManager(true)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Manage keywords
        </button>

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

        <select
          value={filters.source ?? "all"}
          onChange={(e) => onChange({ ...filters, source: e.target.value === "all" ? undefined : e.target.value })}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All sources</option>
          <option value="hn">Hacker News</option>
          <option value="remoteok">RemoteOK</option>
          <option value="weworkremotely">WeWorkRemotely</option>
        </select>

        <select
          value={filters.sort ?? "default"}
          onChange={(e) => onChange({ ...filters, sort: e.target.value === "default" ? undefined : e.target.value })}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="default">Sort: Default</option>
          <option value="relevance">Sort: Relevance</option>
        </select>

        <input
          type="text"
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {showKeywordManager && (
        <KeywordManager
          onClose={() => setShowKeywordManager(false)}
          onUpdate={() => onChange({ ...filters })}
        />
      )}
    </div>
  );
}

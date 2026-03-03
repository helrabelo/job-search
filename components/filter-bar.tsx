"use client";

import { useState } from "react";
import { KeywordManager } from "./keyword-manager";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "in_progress", label: "In Progress" },
  { value: "dismissed", label: "Dismissed" },
];

const SOURCES: { value: string; label: string }[] = [
  { value: "hn", label: "Hacker News" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "weworkremotely", label: "WWR" },
];

interface Filters {
  status: string;
  remote: boolean;
  search: string;
  matchKeywords: boolean;
  sort?: string;
  sources: string[];
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showKeywordManager, setShowKeywordManager] = useState(false);

  function toggleSource(source: string) {
    const current = filters.sources;
    const next = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    onChange({ ...filters, sources: next });
  }

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

      {/* Second row: toggles, source buttons, sort, search */}
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

        {/* Source toggle buttons */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-neutral-400">Sources:</span>
          {SOURCES.map((src) => {
            const isActive =
              filters.sources.length === 0 ||
              filters.sources.includes(src.value);
            return (
              <button
                key={src.value}
                onClick={() => toggleSource(src.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-100 text-neutral-400 line-through"
                }`}
              >
                {src.label}
              </button>
            );
          })}
        </div>

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

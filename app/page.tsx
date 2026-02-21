"use client";

import { useState } from "react";
import { RefreshButton } from "@/components/refresh-button";
import { FilterBar } from "@/components/filter-bar";
import { PostList } from "@/components/post-list";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    remote: false,
    search: "",
    threadId: "",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            HN Job Tracker
          </h1>
          <p className="text-sm text-neutral-500">
            Browse &quot;Who is Hiring&quot; posts from Hacker News
          </p>
        </div>
        <RefreshButton
          onComplete={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          refreshKey={refreshKey}
        />
      </div>

      {/* Post list */}
      <PostList filters={filters} refreshKey={refreshKey} />
    </div>
  );
}

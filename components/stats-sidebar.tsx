"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DISMISS_REASONS } from "@/lib/types";

interface StatsData {
  statusBreakdown: { status: string; count: number }[];
  dismissBreakdown: { dismiss_reason: string; count: number }[];
  timeline: { month: string; total: number; applied: number }[];
  keywords: { keyword: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  saved: "bg-yellow-500",
  applied: "bg-green-500",
  in_progress: "bg-purple-500",
  dismissed: "bg-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  saved: "Saved",
  applied: "Applied",
  in_progress: "In Progress",
  dismissed: "Dismissed",
};

function MiniBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 truncate text-right text-xs text-neutral-500">
        {label}
      </span>
      <div className="flex-1 h-4 bg-neutral-100 rounded overflow-hidden">
        <div
          className={`h-full ${color} rounded`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-xs font-medium text-neutral-600 tabular-nums text-right">
        {count}
      </span>
    </div>
  );
}

export function StatsSidebar({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [refreshKey]);

  if (!data) {
    return (
      <div className="text-xs text-neutral-400 py-4">Loading stats...</div>
    );
  }

  const totalPosts = data.statusBreakdown.reduce((s, r) => s + r.count, 0);
  const maxStatus = Math.max(...data.statusBreakdown.map((s) => s.count), 1);
  const maxDismiss = data.dismissBreakdown.length > 0
    ? Math.max(...data.dismissBreakdown.map((d) => d.count), 1)
    : 1;
  const topKeywords = data.keywords.slice(0, 10);
  const maxKeyword = topKeywords.length > 0
    ? Math.max(...topKeywords.map((k) => k.count), 1)
    : 1;

  return (
    <div className="space-y-5">
      {/* Total */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-2xl font-bold text-neutral-900 tabular-nums">
          {totalPosts}
        </div>
        <div className="text-xs text-neutral-500">Total posts tracked</div>
      </div>

      {/* Status breakdown */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          By Status
        </h3>
        <div className="space-y-1.5">
          {data.statusBreakdown.map((s) => (
            <MiniBar
              key={s.status}
              label={STATUS_LABELS[s.status] ?? s.status}
              count={s.count}
              max={maxStatus}
              color={STATUS_COLORS[s.status] ?? "bg-neutral-300"}
            />
          ))}
        </div>
      </div>

      {/* Dismiss reasons */}
      {data.dismissBreakdown.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Dismiss Reasons
          </h3>
          <div className="space-y-1.5">
            {data.dismissBreakdown.map((d) => (
              <MiniBar
                key={d.dismiss_reason}
                label={
                  DISMISS_REASONS.find((r) => r.value === d.dismiss_reason)
                    ?.label ?? d.dismiss_reason
                }
                count={d.count}
                max={maxDismiss}
                color="bg-red-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Top keywords */}
      {topKeywords.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Top Keywords
          </h3>
          <div className="space-y-1.5">
            {topKeywords.map((k) => (
              <MiniBar
                key={k.keyword}
                label={k.keyword}
                count={k.count}
                max={maxKeyword}
                color="bg-indigo-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Link to full stats */}
      <Link
        href="/stats"
        className="block rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-600 hover:bg-neutral-50"
      >
        View full statistics &rarr;
      </Link>
    </div>
  );
}

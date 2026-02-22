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

function HorizontalBar({
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
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-right text-sm text-neutral-600 truncate">
        {label}
      </span>
      <div className="flex-1 h-6 bg-neutral-100 rounded overflow-hidden">
        <div
          className={`h-full ${color} rounded transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-sm font-medium text-neutral-700 tabular-nums">
        {count}
      </span>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-neutral-400">Loading statistics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-red-500">Failed to load statistics.</p>
      </div>
    );
  }

  const maxStatus = Math.max(...data.statusBreakdown.map((s) => s.count), 1);
  const maxDismiss = Math.max(...data.dismissBreakdown.map((d) => d.count), 1);
  const maxTimeline = Math.max(...data.timeline.map((t) => t.total), 1);
  const maxKeyword = Math.max(...data.keywords.map((k) => k.count), 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Statistics</h1>
      </div>

      <div className="space-y-8">
        {/* Status breakdown */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            By Status
          </h2>
          <div className="space-y-2">
            {data.statusBreakdown.map((s) => (
              <HorizontalBar
                key={s.status}
                label={STATUS_LABELS[s.status] ?? s.status}
                count={s.count}
                max={maxStatus}
                color={STATUS_COLORS[s.status] ?? "bg-neutral-300"}
              />
            ))}
          </div>
        </section>

        {/* Dismiss reasons */}
        {data.dismissBreakdown.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Dismiss Reasons
            </h2>
            <div className="space-y-2">
              {data.dismissBreakdown.map((d) => (
                <HorizontalBar
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
          </section>
        )}

        {/* Timeline */}
        {data.timeline.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Posts by Month
            </h2>
            <div className="space-y-2">
              {data.timeline.map((t) => (
                <div key={t.month}>
                  <HorizontalBar
                    label={t.month}
                    count={t.total}
                    max={maxTimeline}
                    color="bg-orange-400"
                  />
                  {t.applied > 0 && (
                    <div className="ml-[calc(8rem+0.75rem)] mt-0.5">
                      <span className="text-xs text-green-600">
                        {t.applied} applied
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Keyword frequency */}
        {data.keywords.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Top Tech Keywords
            </h2>
            <div className="space-y-2">
              {data.keywords.map((k) => (
                <HorizontalBar
                  key={k.keyword}
                  label={k.keyword}
                  count={k.count}
                  max={maxKeyword}
                  color="bg-indigo-400"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

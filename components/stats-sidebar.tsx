"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DISMISS_REASONS } from "@/lib/types";

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

function ProgressRing({
  percentage,
  size = 56,
  stroke = 5,
  color,
}: {
  percentage: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f5f5f5"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
      <div className={`text-lg font-bold tabular-nums ${accent ?? "text-neutral-900"}`}>
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      {sub && (
        <div className="mt-0.5 text-[10px] text-neutral-400">{sub}</div>
      )}
    </div>
  );
}

function FunnelStep({
  label,
  count,
  total,
  color,
  isLast,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  isLast?: boolean;
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1.5 self-stretch rounded-full ${color}`} />
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-neutral-700">{label}</span>
          <span className="text-xs font-bold tabular-nums text-neutral-900">{count}</span>
        </div>
        <div className="text-[10px] text-neutral-400 tabular-nums">{pct}% of total</div>
      </div>
      {!isLast && (
        <svg className="w-3 h-3 text-neutral-300 shrink-0 -mr-0.5" fill="none" viewBox="0 0 12 12">
          <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
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

  const statusMap = Object.fromEntries(
    data.statusBreakdown.map((s) => [s.status, s.count])
  );
  const totalPosts = data.statusBreakdown.reduce((s, r) => s + r.count, 0);
  const newCount = statusMap["new"] ?? 0;
  const savedCount = statusMap["saved"] ?? 0;
  const appliedCount = statusMap["applied"] ?? 0;
  const inProgressCount = statusMap["in_progress"] ?? 0;
  const dismissedCount = statusMap["dismissed"] ?? 0;

  const reviewed = totalPosts - newCount;
  const reviewPct = totalPosts > 0 ? (reviewed / totalPosts) * 100 : 0;
  const applicationRate = reviewed > 0 ? ((appliedCount + inProgressCount) / reviewed) * 100 : 0;
  const activePipeline = appliedCount + inProgressCount;

  const maxStatus = Math.max(...data.statusBreakdown.map((s) => s.count), 1);
  const maxDismiss =
    data.dismissBreakdown.length > 0
      ? Math.max(...data.dismissBreakdown.map((d) => d.count), 1)
      : 1;
  const topKeywords = data.keywords.slice(0, 10);
  const maxKeyword =
    topKeywords.length > 0
      ? Math.max(...topKeywords.map((k) => k.count), 1)
      : 1;

  return (
    <div className="space-y-4">
      {/* Pipeline Overview */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Application Pipeline
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <ProgressRing percentage={reviewPct} color="#f97316" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold tabular-nums text-neutral-800">
                {reviewPct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-700">
              {reviewed} of {totalPosts} reviewed
            </div>
            <div className="text-[11px] text-neutral-400">
              {newCount} positions need review
            </div>
          </div>
        </div>
        <div className="space-y-0.5 border-t border-neutral-100 pt-3">
          <FunnelStep label="Total Tracked" count={totalPosts} total={totalPosts} color="bg-neutral-300" />
          <FunnelStep label="Reviewed" count={reviewed} total={totalPosts} color="bg-orange-400" />
          <FunnelStep label="Applied" count={appliedCount} total={totalPosts} color="bg-green-500" />
          <FunnelStep label="Interviewing" count={inProgressCount} total={totalPosts} color="bg-purple-500" isLast />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Application Rate"
          value={`${applicationRate.toFixed(0)}%`}
          sub={`${activePipeline} of ${reviewed} reviewed`}
          accent="text-green-600"
        />
        <MetricCard
          label="Saved"
          value={String(savedCount)}
          sub="bookmarked for later"
          accent="text-yellow-600"
        />
        <MetricCard
          label="Active Pipeline"
          value={String(activePipeline)}
          sub="applied + interviewing"
          accent="text-purple-600"
        />
        <MetricCard
          label="Dismissed"
          value={String(dismissedCount)}
          sub={`${reviewed > 0 ? ((dismissedCount / reviewed) * 100).toFixed(0) : 0}% of reviewed`}
          accent="text-neutral-500"
        />
      </div>

      {/* Weekly Activity */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          This Week
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Positions reviewed</span>
            <span className="text-xs font-bold tabular-nums text-neutral-800">
              {data.activity.reviewedThisWeek}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Applications sent</span>
            <span className="text-xs font-bold tabular-nums text-green-600">
              {data.activity.appliedThisWeek}
            </span>
          </div>
          {data.activity.lastAppliedAt && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
              <span className="text-xs text-neutral-500">Last applied</span>
              <span className="text-xs font-medium text-neutral-600">
                {formatRelativeDate(data.activity.lastAppliedAt)}
              </span>
            </div>
          )}
        </div>
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

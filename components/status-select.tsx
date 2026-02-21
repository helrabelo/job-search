"use client";

import type { PostStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: PostStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "saved", label: "Saved", color: "bg-yellow-100 text-yellow-800" },
  { value: "applied", label: "Applied", color: "bg-green-100 text-green-800" },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "dismissed",
    label: "Dismissed",
    color: "bg-neutral-100 text-neutral-500",
  },
];

export function StatusBadge({ status }: { status: PostStatus }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${opt?.color ?? ""}`}
    >
      {opt?.label ?? status}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: PostStatus;
  onChange: (status: PostStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PostStatus)}
      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

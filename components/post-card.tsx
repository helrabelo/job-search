"use client";

import { StatusBadge } from "./status-select";
import { stripHtml } from "@/lib/parser";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post & { month?: string };
  onClick: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const preview = stripHtml(post.content).slice(0, 200);

  return (
    <button
      onClick={onClick}
      className="block w-full rounded-lg border border-neutral-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-neutral-900">
              {post.company ?? "Unknown Company"}
            </h3>
            {post.is_remote === 1 && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Remote
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
            {preview}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={post.status} />
          <span className="text-[11px] text-neutral-400">
            {new Date(post.posted_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </button>
  );
}

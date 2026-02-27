"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { PostDetail } from "./post-detail";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import { usePosts } from "@/lib/hooks/use-posts";
import type { Post } from "@/lib/types";
import { DISMISS_REASONS } from "@/lib/types";

interface PostListProps {
  filters: {
    status: string;
    remote: boolean;
    search: string;
    threadId: string;
    matchKeywords: boolean;
  };
}

export function PostList({ filters }: PostListProps) {
  const { mutate } = useData();
  const { toast } = useToast();
  const { posts, total, page, totalPages, loading, profileKeywords, setPage, refetch } = usePosts(filters);
  const [selectedPost, setSelectedPost] = useState<
    (Post & { month?: string; thread_title?: string }) | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Clear selection on filter or page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters, page]);

  function handlePostUpdate(updated: Post) {
    setSelectedPost((prev) => (prev ? { ...prev, ...updated } : null));
    refetch();
    mutate();
  }

  function handleSelect(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  async function handleBulkDismiss(reason: string) {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const count = selectedIds.size;
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: "dismissed",
          dismiss_reason: reason,
        }),
      });
      const data = await res.json();
      const undoIds = data.undo_ids ?? [];
      setSelectedIds(new Set());
      refetch();
      mutate();
      toast(`Dismissed ${count} post${count !== 1 ? "s" : ""}`, {
        type: "success",
        action: undoIds.length > 0
          ? {
              label: "Undo",
              onClick: async () => {
                await fetch("/api/undo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ undo_ids: undoIds }),
                });
                refetch();
                mutate();
                toast("Restored", { type: "info" });
              },
            }
          : undefined,
      });
    } catch (err) {
      console.error("Bulk dismiss failed:", err);
      toast("Bulk dismiss failed", { type: "error" });
    } finally {
      setBulkLoading(false);
    }
  }

  const allOnPageSelected =
    posts.length > 0 && posts.every((p) => selectedIds.has(p.id));

  if (loading && posts.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">No posts found.</p>
        <p className="mt-2 text-sm text-neutral-400">
          Click &quot;Refresh&quot; to fetch the latest Who is Hiring thread.
          <br />
          New threads are usually posted around 11 AM ET on the 1st of each
          month.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {total} post{total !== 1 && "s"} found
        </span>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
          Select all
        </label>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <span className="text-neutral-300">|</span>
          <span className="text-xs text-neutral-500">Dismiss as:</span>
          {DISMISS_REASONS.map((reason) => (
            <button
              key={reason.value}
              onClick={() => handleBulkDismiss(reason.value)}
              disabled={bulkLoading}
              className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {reason.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-neutral-400 hover:text-neutral-600"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            profileKeywords={profileKeywords}
            selected={selectedIds.has(post.id)}
            onSelect={handleSelect}
            onClick={() => setSelectedPost(post)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          profileKeywords={profileKeywords}
          onUpdate={handlePostUpdate}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { PostDetail } from "./post-detail";
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
  refreshKey: number;
  onPostUpdate?: () => void;
}

export function PostList({ filters, refreshKey, onPostUpdate }: PostListProps) {
  const [posts, setPosts] = useState<(Post & { month?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<
    (Post & { month?: string }) | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.remote) params.set("remote", "1");
    if (filters.search) params.set("search", filters.search);
    if (filters.threadId) params.set("thread_id", filters.threadId);
    if (filters.matchKeywords) params.set("match_keywords", "1");
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setProfileKeywords(data.profileKeywords ?? []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, refreshKey]);

  // Clear selection on filter or page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters, page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handlePostUpdate(updated: Post) {
    setSelectedPost((prev) => (prev ? { ...prev, ...updated } : null));
    fetchPosts();
    onPostUpdate?.();
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
    try {
      await fetch("/api/posts/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: "dismissed",
          dismiss_reason: reason,
        }),
      });
      setSelectedIds(new Set());
      fetchPosts();
      onPostUpdate?.();
    } catch (err) {
      console.error("Bulk dismiss failed:", err);
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

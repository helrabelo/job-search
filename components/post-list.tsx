"use client";

import { useCallback, useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { PostDetail } from "./post-detail";
import type { Post } from "@/lib/types";

interface PostListProps {
  filters: {
    status: string;
    remote: boolean;
    search: string;
    threadId: string;
  };
  refreshKey: number;
}

export function PostList({ filters, refreshKey }: PostListProps) {
  const [posts, setPosts] = useState<(Post & { month?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<
    (Post & { month?: string }) | null
  >(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.remote) params.set("remote", "1");
    if (filters.search) params.set("search", filters.search);
    if (filters.threadId) params.set("thread_id", filters.threadId);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handlePostUpdate(updated: Post) {
    setPosts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
    setSelectedPost((prev) => (prev ? { ...prev, ...updated } : null));
  }

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
      <div className="mb-3 text-sm text-neutral-500">
        {total} post{total !== 1 && "s"} found
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
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
          onUpdate={handlePostUpdate}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}

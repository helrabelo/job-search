"use client";

import { useCallback, useEffect, useState } from "react";
import { useData } from "@/components/data-provider";
import type { Post } from "@/lib/types";

interface Filters {
  status: string;
  remote: boolean;
  search: string;
  threadId: string;
  matchKeywords: boolean;
}

interface UsePostsResult {
  posts: (Post & { month?: string; thread_title?: string })[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  profileKeywords: string[];
  setPage: (page: number) => void;
  refetch: () => void;
}

export function usePosts(filters: Filters): UsePostsResult {
  const { refreshKey } = useData();
  const [posts, setPosts] = useState<(Post & { month?: string; thread_title?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, total, page, totalPages, loading, profileKeywords, setPage, refetch: fetchPosts };
}

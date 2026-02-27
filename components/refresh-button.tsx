"use client";

import { useState } from "react";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import type { ScrapeResult } from "@/lib/types";

export function RefreshButton() {
  const { mutate } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  async function handleScrape() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (!res.ok) throw new Error("Scrape failed");
      const data: ScrapeResult = await res.json();
      setResult(data);
      mutate();
      if (data.newPosts > 0) {
        toast(`Found ${data.newPosts} new post${data.newPosts !== 1 ? "s" : ""}`, { type: "success" });
      } else {
        toast("All caught up — no new posts", { type: "info" });
      }
    } catch (err) {
      console.error(err);
      toast("Scrape failed", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleScrape}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Fetching...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </>
        )}
      </button>
      {result && (
        <div className="flex flex-col gap-1 text-sm text-neutral-600">
          {result.newPosts > 0 ? (
            <span className="font-medium text-green-600">
              +{result.newPosts} new post{result.newPosts !== 1 && "s"}
            </span>
          ) : (
            <span>All caught up — no new posts</span>
          )}
          {result.perSource?.map((s) => (
            <span key={s.source} className="text-xs text-neutral-400">
              {s.source}: {s.newPosts} new from {s.threads} thread{s.threads !== 1 ? "s" : ""}
              {s.errors && <span className="text-red-400"> (error: {s.errors})</span>}
            </span>
          ))}
          {result.threads?.map((t) => (
            <span key={t.month} className="text-xs text-neutral-400">
              {t.month}: {t.alreadyStored} stored / {t.totalComments} on HN
              {t.skippedDeleted > 0 &&
                ` (${t.skippedDeleted} deleted/dead)`}
              {t.newAdded > 0 && ` (+${t.newAdded} new)`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { StatusSelect } from "./status-select";
import type { Post, PostStatus } from "@/lib/types";

interface PostDetailProps {
  post: Post & { month?: string; thread_title?: string };
  onUpdate: (post: Post) => void;
  onClose: () => void;
}

export function PostDetail({ post, onUpdate, onClose }: PostDetailProps) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [notes, setNotes] = useState(post.notes ?? "");
  const [appliedAt, setAppliedAt] = useState(post.applied_at ?? "");
  const [saving, setSaving] = useState(false);

  async function save(updates: Record<string, any>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(newStatus: PostStatus) {
    setStatus(newStatus);
    save({ status: newStatus });
  }

  function handleNotesSave() {
    save({ notes, applied_at: appliedAt || null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-neutral-900">
              {post.company ?? "Unknown Company"}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              by {post.author ?? "unknown"} &middot;{" "}
              {new Date(post.posted_at).toLocaleDateString()}
              {post.month && <> &middot; {post.month}</>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="prose prose-sm max-h-80 overflow-y-auto border-b border-neutral-100 p-5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Controls */}
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Status
            </label>
            <StatusSelect value={status} onChange={handleStatusChange} />
            {post.is_remote === 1 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Remote
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Applied date
            </label>
            <input
              type="date"
              value={appliedAt}
              onChange={(e) => setAppliedAt(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Add your notes here..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Close
            </button>
            <button
              onClick={handleNotesSave}
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { StatusSelect } from "./status-select";
import { highlightHtmlContent } from "@/lib/highlight";
import { timeAgo } from "@/lib/time";
import type { DismissReason, Post, PostStatus } from "@/lib/types";

const today = () => new Date().toISOString().split("T")[0];

const showAppliedDate = (s: PostStatus) => s === "applied" || s === "in_progress";

const DISMISS_OPTIONS: { value: DismissReason; label: string }[] = [
  { value: "wrong_stack", label: "Wrong Stack" },
  { value: "no_visa", label: "No Visa" },
  { value: "not_remote", label: "Not Remote" },
  { value: "not_developer", label: "Not Dev Role" },
  { value: "location_gated", label: "Location" },
  { value: "low_pay", label: "Low Pay" },
];

interface PostDetailProps {
  post: Post & { month?: string; thread_title?: string };
  profileKeywords?: string[];
  onUpdate: (post: Post) => void;
  onClose: () => void;
}

export function PostDetail({ post, profileKeywords = [], onUpdate, onClose }: PostDetailProps) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [notes, setNotes] = useState(post.notes ?? "");
  const [appliedAt, setAppliedAt] = useState(post.applied_at ?? today());
  const [saving, setSaving] = useState(false);
  const [dismissSuggestions, setDismissSuggestions] = useState<
    { reason: string; count: number; matchedKeywords: string[] }[]
  >([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch dismiss pattern suggestions for undecided posts
  useEffect(() => {
    if (post.status !== "new" && post.status !== "saved") return;
    fetch(`/api/dismiss-patterns?post_id=${post.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.matches?.length > 0) {
          setDismissSuggestions(data.matches);
        }
      })
      .catch(() => {});
  }, [post.id, post.status]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll("a").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    if (profileKeywords.length > 0) {
      highlightHtmlContent(contentRef.current, profileKeywords);
    }
  }, [post.content, profileKeywords]);

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

  async function handleApply() {
    await save({ status: "applied", applied_at: appliedAt || today() });
    onClose();
  }

  async function handleDismiss(reason: DismissReason) {
    await save({ status: "dismissed", dismiss_reason: reason });
    onClose();
  }

  async function handleNotesSave() {
    const updates: Record<string, any> = { notes };
    if (showAppliedDate(status)) {
      updates.applied_at = appliedAt || null;
    }
    await save(updates);
    onClose();
  }

  const isUndecided = status === "new" || status === "saved";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20"
      onMouseDown={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div ref={panelRef} className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                {post.company ?? "Unknown Company"}
              </h2>
              {post.is_remote === 1 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Remote
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">
              by {post.author ?? "unknown"} &middot;{" "}
              {timeAgo(post.posted_at)}
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
          ref={contentRef}
          className="prose prose-sm max-h-80 overflow-y-auto border-b border-neutral-100 p-5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Dismiss pattern suggestions */}
        {isUndecided && dismissSuggestions.length > 0 && (
          <div className="border-b border-neutral-100 bg-amber-50 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-amber-700">
                Similar to {dismissSuggestions[0].count} dismissed post{dismissSuggestions[0].count !== 1 ? "s" : ""}
                {dismissSuggestions[0].matchedKeywords.length > 0 && (
                  <> ({dismissSuggestions[0].matchedKeywords.join(", ")})</>
                )}
              </span>
              <button
                onClick={() => handleDismiss(dismissSuggestions[0].reason as DismissReason)}
                disabled={saving}
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                Dismiss as {DISMISS_OPTIONS.find((r) => r.value === dismissSuggestions[0].reason)?.label ?? dismissSuggestions[0].reason}
              </button>
            </div>
          </div>
        )}

        {/* Decision bar — primary actions for undecided posts */}
        {isUndecided && (
          <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                disabled={saving}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Applied
              </button>
              <div className="h-5 w-px bg-neutral-300" />
              <div className="flex flex-wrap gap-1.5">
                {DISMISS_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleDismiss(r.value)}
                    disabled={saving}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Already-decided banner */}
        {status === "dismissed" && post.dismiss_reason && (
          <div className="border-b border-neutral-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            Dismissed &mdash; {DISMISS_OPTIONS.find((r) => r.value === post.dismiss_reason)?.label ?? post.dismiss_reason}
          </div>
        )}
        {(status === "applied" || status === "in_progress") && (
          <div className="border-b border-neutral-100 bg-green-50 px-5 py-3 text-sm text-green-700">
            Applied {post.applied_at ? timeAgo(post.applied_at) : ""}
            {status === "in_progress" && " — In Progress"}
          </div>
        )}

        {/* Secondary controls */}
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <StatusSelect value={status} onChange={handleStatusChange} />
          </div>

          {showAppliedDate(status) && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-neutral-700">Applied</label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Add notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
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

"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";

interface CoverLetterData {
  id: number;
  post_id: number;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function CoverLetter({ postId }: { postId: number }) {
  const { toast } = useToast();
  const [letter, setLetter] = useState<CoverLetterData | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cover-letter/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setLetter(data);
          setContent(data.content);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.message || "Generation failed", { type: "error" });
        return;
      }

      const data = await res.json();
      setLetter(data);
      setContent(data.content);
      setExpanded(true);
      toast("Cover letter generated", { type: "success" });
    } catch {
      toast("Failed to generate", { type: "error" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!letter) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cover-letter/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setLetter(data);
        toast("Cover letter saved", { type: "success" });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard", { type: "info" });
  }

  if (loading) return null;

  return (
    <div className="border-t border-neutral-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
      >
        <span>Cover Letter {letter ? `(v${letter.version})` : ""}</span>
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-3 px-5 pb-4">
          {letter ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || content === letter.content}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save edits"}
                </button>
                <button
                  onClick={handleCopy}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
                >
                  Copy
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                >
                  {generating ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Cover Letter"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

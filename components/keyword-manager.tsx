"use client";

import { useEffect, useRef, useState } from "react";

interface Keyword {
  id: number;
  keyword: string;
}

interface KeywordManagerProps {
  onClose: () => void;
  onUpdate: () => void;
}

export function KeywordManager({ onClose, onUpdate }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchKeywords();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function fetchKeywords() {
    const res = await fetch("/api/keywords");
    setKeywords(await res.json());
  }

  async function addKeyword() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError("");

    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: trimmed }),
    });

    if (res.status === 409) {
      setError("Keyword already exists");
      return;
    }

    if (res.ok) {
      setInput("");
      await fetchKeywords();
      onUpdate();
    }
  }

  async function removeKeyword(id: number) {
    await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    await fetchKeywords();
    onUpdate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20"
      onMouseDown={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node))
          onClose();
      }}
    >
      <div ref={panelRef} className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            Profile Keywords
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Add keyword (e.g. React, TypeScript)"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={addKeyword}
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw.id}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800"
              >
                {kw.keyword}
                <button
                  onClick={() => removeKeyword(kw.id)}
                  className="ml-0.5 rounded-full p-0.5 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-900"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {keywords.length === 0 && (
              <p className="text-sm text-neutral-400">
                No keywords yet. Add skills and technologies you&apos;re looking for.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface ResearchData {
  company_name: string;
  company_url: string | null;
  linkedin_url: string | null;
  glassdoor_url: string | null;
  levels_url: string | null;
}

export function CompanyResearch({ postId }: { postId: number }) {
  const [data, setData] = useState<ResearchData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/company-research?post_id=${postId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [postId]);

  if (!data) return null;

  const links = [
    { label: "Website", url: data.company_url, icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
    { label: "LinkedIn", url: data.linkedin_url, icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2V9zm2-6a2 2 0 110 4 2 2 0 010-4z" },
    { label: "Glassdoor", url: data.glassdoor_url, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-4h8m-8-4h4" },
    { label: "Levels.fyi", url: data.levels_url, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0H3m6 0h6m0 0v-10a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6" },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="border-t border-neutral-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
      >
        <span>Company Research — {data.company_name}</span>
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
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

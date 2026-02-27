import type { ScraperPlugin, ScraperResult, ScrapedPost } from "./types";

const REMOTEOK_API = "https://remoteok.com/api";

interface RemoteOKJob {
  id: string;
  epoch: string;
  date: string;
  company: string;
  position: string;
  description: string;
  tags: string[];
  url: string;
  location?: string;
}

export const remoteOkScraper: ScraperPlugin = {
  name: "remoteok",

  async scrape(): Promise<ScraperResult> {
    const res = await fetch(REMOTEOK_API, {
      headers: { "User-Agent": "HN-Job-Tracker/1.0" },
    });

    if (!res.ok) {
      throw new Error(`RemoteOK fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as RemoteOKJob[];

    // First element is metadata, skip it
    const jobs = data.slice(1).filter((j) => j.id && j.company);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // RemoteOK doesn't have threads, we create a synthetic one per month
    const threadId = `remoteok-${month}`;

    const posts: ScrapedPost[] = jobs.map((job) => {
      const content = `<p><b>${job.company}</b> | ${job.position} | Remote</p>${job.description || ""}`;
      return {
        id: `rok-${job.id}`,
        thread_id: threadId,
        author: job.company,
        content,
        company: job.company,
        is_remote: true,
        posted_at: job.date || now.toISOString(),
        source: "remoteok",
      };
    });

    return {
      threads: [
        {
          id: threadId,
          title: `RemoteOK Jobs — ${month}`,
          month,
          posted_at: now.toISOString(),
          source: "remoteok",
        },
      ],
      posts,
    };
  },
};

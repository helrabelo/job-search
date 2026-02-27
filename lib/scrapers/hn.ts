import { parseCompany, isRemote, extractMonth } from "../parser";
import type { ScraperPlugin, ScraperResult, ScrapedThread, ScrapedPost } from "./types";

interface AlgoliaHit {
  objectID: string;
  title: string;
  created_at: string;
  created_at_i: number;
}

interface HNItem {
  id: number;
  by?: string;
  text?: string;
  time: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
}

const ALGOLIA_URL =
  "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=who+is+hiring&hitsPerPage=10";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

async function findThreads(count: number = 2): Promise<AlgoliaHit[]> {
  const data = await fetchJson<{ hits: AlgoliaHit[] }>(ALGOLIA_URL);
  const hiring = data.hits.filter(
    (h) => /who is hiring/i.test(h.title) && !/who wants/i.test(h.title)
  );
  hiring.sort((a, b) => b.created_at_i - a.created_at_i);
  return hiring.slice(0, count);
}

async function fetchItems(ids: number[]): Promise<HNItem[]> {
  const BATCH_SIZE = 20;
  const results: HNItem[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const items = await Promise.all(
      batch.map((id) =>
        fetchJson<HNItem>(`${HN_ITEM_URL}/${id}.json`).catch(() => null)
      )
    );
    for (const item of items) {
      if (item) results.push(item);
    }
  }
  return results;
}

export const hnScraper: ScraperPlugin = {
  name: "hn",

  async scrape(): Promise<ScraperResult> {
    const algoliaThreads = await findThreads(2);
    const threads: ScrapedThread[] = [];
    const posts: ScrapedPost[] = [];

    for (const thread of algoliaThreads) {
      const threadId = thread.objectID;
      const month = extractMonth(thread.title, thread.created_at);

      threads.push({
        id: threadId,
        title: thread.title,
        month,
        posted_at: thread.created_at,
        source: "hn",
      });

      const hnThread = await fetchJson<HNItem>(
        `${HN_ITEM_URL}/${threadId}.json`
      );

      if (!hnThread.kids || hnThread.kids.length === 0) continue;

      const comments = await fetchItems(hnThread.kids);

      for (const comment of comments) {
        if (!comment.text || comment.deleted || comment.dead) continue;

        const company = parseCompany(comment.text);
        const remote = isRemote(comment.text);
        const postedAt = new Date(comment.time * 1000).toISOString();

        posts.push({
          id: String(comment.id),
          thread_id: threadId,
          author: comment.by || null,
          content: comment.text,
          company,
          is_remote: remote,
          posted_at: postedAt,
          source: "hn",
        });
      }
    }

    return { threads, posts };
  },
};

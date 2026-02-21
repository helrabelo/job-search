import { getDb } from "@/db";
import { migrate } from "@/db/migrate";
import { parseCompany, isRemote, extractMonth } from "./parser";
import type { AlgoliaHit, HNItem, ScrapeResult } from "./types";

const ALGOLIA_URL =
  "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=who+is+hiring&hitsPerPage=10";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

/**
 * Fetch the most recent "Who is Hiring" threads from Algolia.
 */
async function findThreads(
  count: number = 2
): Promise<AlgoliaHit[]> {
  const data = await fetchJson<{ hits: AlgoliaHit[] }>(ALGOLIA_URL);

  // Filter to actual "Who is hiring?" threads (not "Who wants to be hired?")
  const hiring = data.hits.filter((h) =>
    /who is hiring/i.test(h.title) && !/who wants/i.test(h.title)
  );

  // Sort by date descending
  hiring.sort((a, b) => b.created_at_i - a.created_at_i);

  return hiring.slice(0, count);
}

/**
 * Fetch a batch of HN items in parallel.
 */
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

/**
 * Main scrape function. Finds recent threads, fetches new comments, stores them.
 */
export async function scrape(): Promise<ScrapeResult> {
  migrate();

  const db = getDb();
  const threads = await findThreads(2);

  if (threads.length === 0) {
    return { newPosts: 0, totalPosts: 0, threadsChecked: 0 };
  }

  let totalNew = 0;

  // Prepare statements
  const upsertThread = db.prepare(`
    INSERT INTO threads (id, title, month, posted_at, fetched_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET fetched_at = datetime('now')
  `);

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (id, thread_id, author, content, company, is_remote, posted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const existingPostIds = new Set(
    db
      .prepare("SELECT id FROM posts")
      .all()
      .map((r: any) => r.id as number)
  );

  for (const thread of threads) {
    const threadId = Number(thread.objectID);
    const month = extractMonth(thread.title, thread.created_at);

    upsertThread.run(threadId, thread.title, month, thread.created_at);

    // Fetch thread to get top-level comment IDs
    const hnThread = await fetchJson<HNItem>(
      `${HN_ITEM_URL}/${threadId}.json`
    );

    if (!hnThread.kids || hnThread.kids.length === 0) continue;

    // Filter to only new comment IDs
    const newIds = hnThread.kids.filter((id) => !existingPostIds.has(id));

    if (newIds.length === 0) continue;

    // Fetch new comments
    const comments = await fetchItems(newIds);

    const insertMany = db.transaction(() => {
      for (const comment of comments) {
        if (!comment.text || comment.deleted || comment.dead) continue;

        const company = parseCompany(comment.text);
        const remote = isRemote(comment.text) ? 1 : 0;
        const postedAt = new Date(comment.time * 1000).toISOString();

        insertPost.run(
          comment.id,
          threadId,
          comment.by || null,
          comment.text,
          company,
          remote,
          postedAt
        );
        totalNew++;
      }
    });

    insertMany();
  }

  const totalPosts = (
    db.prepare("SELECT COUNT(*) as count FROM posts").get() as any
  ).count;

  return {
    newPosts: totalNew,
    totalPosts,
    threadsChecked: threads.length,
  };
}

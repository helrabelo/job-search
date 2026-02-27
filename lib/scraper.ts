import { getDb } from "@/db";
import { parseCompany, isRemote, extractMonth } from "./parser";
import { calculateScore } from "./scoring";
import type { AlgoliaHit, HNItem, ScrapeResult, ThreadResult } from "./types";

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
  const db = getDb();
  const threads = await findThreads(2);

  if (threads.length === 0) {
    return { newPosts: 0, totalPosts: 0, threadsChecked: 0, threads: [] };
  }

  let totalNew = 0;
  const threadResults: ThreadResult[] = [];

  // Prepare statements
  const upsertThread = db.prepare(`
    INSERT INTO threads (id, title, month, posted_at, fetched_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET fetched_at = datetime('now')
  `);

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (id, thread_id, author, content, company, is_remote, posted_at, first_seen_at, relevance_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  // Load profile keywords for scoring
  const profileKeywords = (
    db.prepare("SELECT keyword FROM profile_keywords ORDER BY keyword").all() as { keyword: string }[]
  ).map((r) => r.keyword);

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

    const totalComments = hnThread.kids?.length ?? 0;
    const alreadyStored = hnThread.kids
      ? hnThread.kids.filter((id) => existingPostIds.has(id)).length
      : 0;

    if (!hnThread.kids || hnThread.kids.length === 0) {
      threadResults.push({
        title: thread.title,
        month,
        totalComments: 0,
        alreadyStored: 0,
        newAdded: 0,
        skippedDeleted: 0,
      });
      continue;
    }

    // Filter to only new comment IDs
    const newIds = hnThread.kids.filter((id) => !existingPostIds.has(id));

    if (newIds.length === 0) {
      threadResults.push({
        title: thread.title,
        month,
        totalComments,
        alreadyStored,
        newAdded: 0,
        skippedDeleted: totalComments - alreadyStored,
      });
      continue;
    }

    // Fetch new comments
    const comments = await fetchItems(newIds);

    let threadNew = 0;
    let threadSkipped = 0;

    const insertMany = db.transaction(() => {
      for (const comment of comments) {
        if (!comment.text || comment.deleted || comment.dead) {
          threadSkipped++;
          continue;
        }

        const company = parseCompany(comment.text);
        const remote = isRemote(comment.text) ? 1 : 0;
        const postedAt = new Date(comment.time * 1000).toISOString();
        const score = calculateScore(comment.text, profileKeywords, remote === 1);

        insertPost.run(
          comment.id,
          threadId,
          comment.by || null,
          comment.text,
          company,
          remote,
          postedAt,
          score
        );
        threadNew++;
        totalNew++;
      }
    });

    insertMany();

    // Log scrape event
    db.prepare(
      "INSERT INTO scrape_log (thread_id, new_post_count) VALUES (?, ?)"
    ).run(threadId, threadNew);

    // Count items that failed to fetch as skipped too
    const fetchFailures = newIds.length - comments.length;

    threadResults.push({
      title: thread.title,
      month,
      totalComments,
      alreadyStored,
      newAdded: threadNew,
      skippedDeleted: threadSkipped + fetchFailures,
    });
  }

  const totalPosts = (
    db.prepare("SELECT COUNT(*) as count FROM posts").get() as any
  ).count;

  return {
    newPosts: totalNew,
    totalPosts,
    threadsChecked: threads.length,
    threads: threadResults,
  };
}

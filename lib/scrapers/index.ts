import { getDb } from "@/db";
import { calculateScore } from "../scoring";
import type { ScraperPlugin, ScraperResult } from "./types";
import { hnScraper } from "./hn";
import { remoteOkScraper } from "./remoteok";
import { wwrScraper } from "./weworkremotely";

export const scraperRegistry: ScraperPlugin[] = [
  hnScraper,
  remoteOkScraper,
  wwrScraper,
];

export interface MultiScrapeResult {
  newPosts: number;
  totalPosts: number;
  sourcesChecked: string[];
  perSource: { source: string; threads: number; newPosts: number; errors?: string }[];
}

/**
 * Run one or all scrapers and store results.
 */
export async function runScrapers(sourceName?: string): Promise<MultiScrapeResult> {
  const db = getDb();
  const scrapers = sourceName
    ? scraperRegistry.filter((s) => s.name === sourceName)
    : scraperRegistry;

  const profileKeywords = (
    db.prepare("SELECT keyword FROM profile_keywords ORDER BY keyword").all() as { keyword: string }[]
  ).map((r) => r.keyword);

  const existingPostIds = new Set(
    db.prepare("SELECT id FROM posts").all().map((r: any) => r.id as number)
  );
  // Also track string-based IDs for non-HN sources
  const existingStringIds = new Set(
    db.prepare("SELECT id FROM posts").all().map((r: any) => String(r.id))
  );

  const upsertThread = db.prepare(`
    INSERT INTO threads (id, title, month, posted_at, fetched_at, source)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(id) DO UPDATE SET fetched_at = datetime('now')
  `);

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (id, thread_id, author, content, company, is_remote, posted_at, first_seen_at, relevance_score, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `);

  let totalNew = 0;
  const perSource: MultiScrapeResult["perSource"] = [];

  for (const scraper of scrapers) {
    let result: ScraperResult;
    try {
      result = await scraper.scrape();
    } catch (err: any) {
      perSource.push({ source: scraper.name, threads: 0, newPosts: 0, errors: err.message });
      continue;
    }

    let sourceNew = 0;

    db.transaction(() => {
      for (const thread of result.threads) {
        // Use numeric ID for HN, hash for others
        const threadId = /^\d+$/.test(thread.id) ? Number(thread.id) : hashStringId(thread.id);
        upsertThread.run(threadId, thread.title, thread.month, thread.posted_at, thread.source);
      }

      for (const post of result.posts) {
        const postId = /^\d+$/.test(post.id) ? Number(post.id) : hashStringId(post.id);
        const threadId = /^\d+$/.test(post.thread_id) ? Number(post.thread_id) : hashStringId(post.thread_id);

        if (existingPostIds.has(postId) || existingStringIds.has(String(postId))) continue;

        const score = calculateScore(post.content, profileKeywords, post.is_remote);
        insertPost.run(
          postId,
          threadId,
          post.author,
          post.content,
          post.company,
          post.is_remote ? 1 : 0,
          post.posted_at,
          score,
          post.source
        );
        sourceNew++;
        totalNew++;
        existingPostIds.add(postId);
      }

      // Log scrape events
      for (const thread of result.threads) {
        const threadId = /^\d+$/.test(thread.id) ? Number(thread.id) : hashStringId(thread.id);
        db.prepare(
          "INSERT INTO scrape_log (thread_id, new_post_count) VALUES (?, ?)"
        ).run(threadId, sourceNew);
      }
    })();

    perSource.push({
      source: scraper.name,
      threads: result.threads.length,
      newPosts: sourceNew,
    });
  }

  const totalPosts = (db.prepare("SELECT COUNT(*) as count FROM posts").get() as any).count;

  return {
    newPosts: totalNew,
    totalPosts,
    sourcesChecked: scrapers.map((s) => s.name),
    perSource,
  };
}

/**
 * Convert a string ID to a stable numeric hash for SQLite integer primary key.
 */
function hashStringId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Ensure positive and large enough to not collide with HN IDs
  return Math.abs(hash) + 2_000_000_000;
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const newSince = request.nextUrl.searchParams.get("new_since");

  let query = `
    SELECT t.*, COUNT(p.id) as post_count
    FROM threads t
    LEFT JOIN posts p ON p.thread_id = t.id
    GROUP BY t.id
    ORDER BY t.posted_at DESC
  `;

  const threads = db.prepare(query).all() as any[];

  // If new_since is provided, add new_count per thread
  if (newSince) {
    const newCounts = db
      .prepare(
        `SELECT thread_id, COUNT(*) as new_count
         FROM posts
         WHERE first_seen_at > ?
         GROUP BY thread_id`
      )
      .all(newSince) as { thread_id: number; new_count: number }[];

    const countMap = Object.fromEntries(newCounts.map((r) => [r.thread_id, r.new_count]));
    for (const t of threads) {
      t.new_count = countMap[t.id] ?? 0;
    }
  }

  return NextResponse.json(threads);
}

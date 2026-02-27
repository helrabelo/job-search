import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calculateScore } from "@/lib/scoring";

export async function POST() {
  const db = getDb();

  const profileKeywords = (
    db.prepare("SELECT keyword FROM profile_keywords ORDER BY keyword").all() as { keyword: string }[]
  ).map((r) => r.keyword);

  const posts = db
    .prepare("SELECT id, content, is_remote FROM posts")
    .all() as { id: number; content: string; is_remote: number }[];

  const update = db.prepare("UPDATE posts SET relevance_score = ? WHERE id = ?");

  db.transaction(() => {
    for (const post of posts) {
      const score = calculateScore(post.content, profileKeywords, post.is_remote === 1);
      update.run(score, post.id);
    }
  })();

  return NextResponse.json({ scored: posts.length });
}

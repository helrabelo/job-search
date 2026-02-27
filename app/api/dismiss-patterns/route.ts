import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { analyzeDismissPatterns, matchDismissPatterns } from "@/lib/dismiss-patterns";

export async function GET(request: NextRequest) {
  const db = getDb();
  const postId = request.nextUrl.searchParams.get("post_id");

  // Get all dismissed posts
  const dismissed = db
    .prepare(
      "SELECT content, dismiss_reason FROM posts WHERE status = 'dismissed' AND dismiss_reason IS NOT NULL"
    )
    .all() as { content: string; dismiss_reason: string }[];

  const patterns = analyzeDismissPatterns(dismissed);

  // If a post_id is provided, check if it matches any pattern
  if (postId) {
    const post = db
      .prepare("SELECT content FROM posts WHERE id = ?")
      .get(Number(postId)) as { content: string } | undefined;

    if (post) {
      const matches = matchDismissPatterns(post.content, patterns);
      return NextResponse.json({ patterns, matches });
    }
  }

  return NextResponse.json({ patterns, matches: [] });
}

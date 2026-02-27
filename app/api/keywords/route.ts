import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { calculateScore } from "@/lib/scoring";

function rescoreAll(db: ReturnType<typeof getDb>) {
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
}

export async function GET() {
  const db = getDb();
  const keywords = db
    .prepare("SELECT * FROM profile_keywords ORDER BY keyword")
    .all();
  return NextResponse.json(keywords);
}

export async function POST(request: NextRequest) {
  const { keyword } = await request.json();

  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO profile_keywords (keyword) VALUES (?)")
      .run(keyword.trim());
    const created = db
      .prepare("SELECT * FROM profile_keywords WHERE id = ?")
      .get(result.lastInsertRowid);
    rescoreAll(db);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Keyword already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}

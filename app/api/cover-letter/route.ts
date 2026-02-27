import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { generateCoverLetter } from "@/lib/cover-letter";

export async function POST(request: NextRequest) {
  const db = getDb();
  const { postId } = await request.json();

  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const post = db
    .prepare("SELECT content, company FROM posts WHERE id = ?")
    .get(Number(postId)) as { content: string; company: string | null } | undefined;

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const content = await generateCoverLetter(post.content, post.company);

    // Get current version count
    const existing = db
      .prepare("SELECT MAX(version) as v FROM cover_letters WHERE post_id = ?")
      .get(Number(postId)) as { v: number | null };

    const version = (existing?.v ?? 0) + 1;

    const result = db
      .prepare(
        "INSERT INTO cover_letters (post_id, content, version) VALUES (?, ?, ?)"
      )
      .run(Number(postId), content, version);

    const letter = db
      .prepare("SELECT * FROM cover_letters WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json(letter);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Generation failed", message: err.message },
      { status: 500 }
    );
  }
}

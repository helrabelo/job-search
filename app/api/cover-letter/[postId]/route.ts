import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const db = getDb();

  const letter = db
    .prepare(
      "SELECT * FROM cover_letters WHERE post_id = ? ORDER BY version DESC LIMIT 1"
    )
    .get(Number(postId));

  if (!letter) {
    return NextResponse.json(null);
  }

  return NextResponse.json(letter);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const { content } = await request.json();
  const db = getDb();

  // Update the latest version
  const letter = db
    .prepare(
      "SELECT id FROM cover_letters WHERE post_id = ? ORDER BY version DESC LIMIT 1"
    )
    .get(Number(postId)) as { id: number } | undefined;

  if (!letter) {
    return NextResponse.json({ error: "No cover letter found" }, { status: 404 });
  }

  db.prepare(
    "UPDATE cover_letters SET content = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(content, letter.id);

  const updated = db
    .prepare("SELECT * FROM cover_letters WHERE id = ?")
    .get(letter.id);

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { migrate } from "@/db/migrate";
import type { PostStatus } from "@/lib/types";

const VALID_STATUSES: PostStatus[] = [
  "new",
  "saved",
  "applied",
  "in_progress",
  "dismissed",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  migrate();

  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status, notes, applied_at } = body;

  const db = getDb();

  // Verify post exists
  const existing = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const updates: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.push("status = ?");
    values.push(status);
  }

  if (notes !== undefined) {
    updates.push("notes = ?");
    values.push(notes);
  }

  if (applied_at !== undefined) {
    updates.push("applied_at = ?");
    values.push(applied_at);
  }

  values.push(postId);

  db.prepare(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
  return NextResponse.json(updated);
}

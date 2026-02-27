import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
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
  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status, notes, applied_at, dismiss_reason } = body;

  const db = getDb();

  // Verify post exists and get current values for undo log
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId) as Record<string, any> | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const updates: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];
  const undoFields: { field: string; oldValue: string | null; newValue: string | null }[] = [];

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    undoFields.push({ field: "status", oldValue: existing.status, newValue: status });
    updates.push("status = ?");
    values.push(status);
  }

  if (notes !== undefined) {
    updates.push("notes = ?");
    values.push(notes);
  }

  if (applied_at !== undefined) {
    undoFields.push({ field: "applied_at", oldValue: existing.applied_at, newValue: applied_at });
    updates.push("applied_at = ?");
    values.push(applied_at);
  }

  if (dismiss_reason !== undefined) {
    undoFields.push({ field: "dismiss_reason", oldValue: existing.dismiss_reason, newValue: dismiss_reason });
    updates.push("dismiss_reason = ?");
    values.push(dismiss_reason);
  }

  values.push(postId);

  // Log undo entries and update in a transaction
  const insertUndo = db.prepare(
    "INSERT INTO undo_log (post_id, field, old_value, new_value) VALUES (?, ?, ?, ?)"
  );
  const updatePost = db.prepare(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`);

  const undoIds: number[] = [];
  db.transaction(() => {
    // Expire old undo entries
    db.prepare("DELETE FROM undo_log WHERE created_at < datetime('now', '-24 hours')").run();

    for (const entry of undoFields) {
      const result = insertUndo.run(postId, entry.field, entry.oldValue, entry.newValue);
      undoIds.push(Number(result.lastInsertRowid));
    }
    updatePost.run(...values);
  })();

  const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
  return NextResponse.json({ ...updated as object, undo_ids: undoIds });
}

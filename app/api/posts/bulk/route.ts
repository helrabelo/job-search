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

export async function PATCH(request: NextRequest) {

  const body = await request.json();
  const { ids, status, dismiss_reason } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 }
    );
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();

  const updates: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (status !== undefined) {
    updates.push("status = ?");
    values.push(status);
  }

  if (dismiss_reason !== undefined) {
    updates.push("dismiss_reason = ?");
    values.push(dismiss_reason);
  }

  const placeholders = ids.map(() => "?").join(", ");

  // Log undo entries for each post before updating
  const undoIds: number[] = [];
  const insertUndo = db.prepare(
    "INSERT INTO undo_log (post_id, field, old_value, new_value) VALUES (?, ?, ?, ?)"
  );

  db.transaction(() => {
    // Expire old undo entries
    db.prepare("DELETE FROM undo_log WHERE created_at < datetime('now', '-24 hours')").run();

    // Get current values for affected posts
    const posts = db
      .prepare(`SELECT id, status, dismiss_reason FROM posts WHERE id IN (${placeholders})`)
      .all(...ids) as { id: number; status: string; dismiss_reason: string | null }[];

    for (const post of posts) {
      if (status !== undefined) {
        const r = insertUndo.run(post.id, "status", post.status, status);
        undoIds.push(Number(r.lastInsertRowid));
      }
      if (dismiss_reason !== undefined) {
        const r = insertUndo.run(post.id, "dismiss_reason", post.dismiss_reason, dismiss_reason);
        undoIds.push(Number(r.lastInsertRowid));
      }
    }

    const allValues = [...values, ...ids];
    db.prepare(
      `UPDATE posts SET ${updates.join(", ")} WHERE id IN (${placeholders})`
    ).run(...allValues);
  })();

  return NextResponse.json({ updated: ids.length, undo_ids: undoIds });
}

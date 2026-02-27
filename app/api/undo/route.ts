import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export async function POST(request: NextRequest) {
  const { undo_ids } = await request.json();

  if (!Array.isArray(undo_ids) || undo_ids.length === 0) {
    return NextResponse.json(
      { error: "undo_ids must be a non-empty array" },
      { status: 400 }
    );
  }

  const db = getDb();

  const getEntry = db.prepare("SELECT * FROM undo_log WHERE id = ?");
  const deleteEntry = db.prepare("DELETE FROM undo_log WHERE id = ?");

  const restored: number[] = [];

  db.transaction(() => {
    for (const undoId of undo_ids) {
      const entry = getEntry.get(undoId) as {
        id: number;
        post_id: number;
        field: string;
        old_value: string | null;
      } | undefined;

      if (!entry) continue;

      db.prepare(
        `UPDATE posts SET ${entry.field} = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(entry.old_value, entry.post_id);

      deleteEntry.run(undoId);
      restored.push(entry.post_id);
    }
  })();

  return NextResponse.json({ restored: [...new Set(restored)] });
}

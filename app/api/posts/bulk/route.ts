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

export async function PATCH(request: NextRequest) {
  migrate();

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
  values.push(...ids);

  const result = db
    .prepare(
      `UPDATE posts SET ${updates.join(", ")} WHERE id IN (${placeholders})`
    )
    .run(...values);

  return NextResponse.json({ updated: result.changes });
}

import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { migrate } from "@/db/migrate";

export async function GET() {
  migrate();

  const db = getDb();
  const threads = db
    .prepare(
      `SELECT t.*, COUNT(p.id) as post_count
       FROM threads t
       LEFT JOIN posts p ON p.thread_id = t.id
       GROUP BY t.id
       ORDER BY t.posted_at DESC`
    )
    .all();

  return NextResponse.json(threads);
}

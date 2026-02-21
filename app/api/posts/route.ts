import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { migrate } from "@/db/migrate";

export async function GET(request: NextRequest) {
  migrate();

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const remote = params.get("remote");
  const search = params.get("search");
  const threadId = params.get("thread_id");
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];

  if (status && status !== "all") {
    conditions.push("p.status = ?");
    values.push(status);
  }

  if (remote === "1") {
    conditions.push("p.is_remote = 1");
  }

  if (threadId) {
    conditions.push("p.thread_id = ?");
    values.push(Number(threadId));
  }

  if (search) {
    conditions.push("(p.content LIKE ? OR p.company LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM posts p ${where}`)
    .get(...values) as { count: number };

  const posts = db
    .prepare(
      `SELECT p.*, t.month, t.title as thread_title
       FROM posts p
       JOIN threads t ON t.id = p.thread_id
       ${where}
       ORDER BY p.posted_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...values, limit, offset);

  return NextResponse.json({
    posts,
    total: countRow.count,
    page,
    totalPages: Math.ceil(countRow.count / limit),
  });
}

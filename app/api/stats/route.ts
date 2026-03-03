import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { TECH_KEYWORDS } from "@/lib/tech-keywords";

function buildFilterClause(params: URLSearchParams) {
  const conditions: string[] = [];
  const values: any[] = [];

  const status = params.get("status");
  if (status && status !== "all") {
    conditions.push("p.status = ?");
    values.push(status);
  }

  if (params.get("remote") === "1") {
    conditions.push("p.is_remote = 1");
  }

  const threadId = params.get("thread_id");
  if (threadId) {
    conditions.push("p.thread_id = ?");
    values.push(Number(threadId));
  }

  const search = params.get("search");
  if (search) {
    conditions.push("(p.content LIKE ? OR p.company LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term);
  }

  const sources = params.get("sources");
  if (sources) {
    const sourceList = sources.split(",").filter(Boolean);
    if (sourceList.length > 0) {
      conditions.push(`p.source IN (${sourceList.map(() => "?").join(",")})`);
      values.push(...sourceList);
    }
  }

  const db = getDb();
  const matchKeywords = params.get("match_keywords");
  if (matchKeywords === "1") {
    const profileKeywords = (
      db.prepare("SELECT keyword FROM profile_keywords ORDER BY keyword").all() as { keyword: string }[]
    ).map((r) => r.keyword);
    if (profileKeywords.length > 0) {
      const kwConditions = profileKeywords.map(() => "p.content LIKE ?");
      conditions.push(`(${kwConditions.join(" OR ")})`);
      for (const kw of profileKeywords) {
        values.push(`%${kw}%`);
      }
    }
  }

  return { conditions, values };
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const params = request.nextUrl.searchParams;
  const { conditions, values } = buildFilterClause(params);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const andFilter = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  const statusBreakdown = db
    .prepare(`SELECT status, COUNT(*) as count FROM posts p ${where} GROUP BY status ORDER BY count DESC`)
    .all(...values) as { status: string; count: number }[];

  const dismissBreakdown = db
    .prepare(
      `SELECT dismiss_reason, COUNT(*) as count FROM posts p WHERE status = 'dismissed' AND dismiss_reason IS NOT NULL ${andFilter} GROUP BY dismiss_reason ORDER BY count DESC`
    )
    .all(...values) as { dismiss_reason: string; count: number }[];

  const timeline = db
    .prepare(
      `SELECT t.month,
              COUNT(p.id) as total,
              SUM(CASE WHEN p.status = 'applied' OR p.status = 'in_progress' THEN 1 ELSE 0 END) as applied
       FROM posts p
       JOIN threads t ON t.id = p.thread_id
       ${where}
       GROUP BY t.month
       ORDER BY t.month`
    )
    .all(...values) as { month: string; total: number; applied: number }[];

  const weeklyReviewed = db
    .prepare(
      `SELECT COUNT(*) as count FROM posts p
       WHERE status != 'new' AND updated_at >= datetime('now', '-7 days') ${andFilter}`
    )
    .get(...values) as { count: number };

  const weeklyApplied = db
    .prepare(
      `SELECT COUNT(*) as count FROM posts p
       WHERE status IN ('applied', 'in_progress') AND applied_at >= datetime('now', '-7 days') ${andFilter}`
    )
    .get(...values) as { count: number };

  const lastApplied = db
    .prepare(
      `SELECT applied_at FROM posts p WHERE applied_at IS NOT NULL ${andFilter} ORDER BY applied_at DESC LIMIT 1`
    )
    .get(...values) as { applied_at: string } | undefined;

  const remoteBreakdown = db
    .prepare(
      `SELECT is_remote, COUNT(*) as count FROM posts p WHERE status != 'new' ${andFilter} GROUP BY is_remote`
    )
    .all(...values) as { is_remote: number; count: number }[];

  const keywords: { keyword: string; count: number }[] = [];
  for (const kw of TECH_KEYWORDS) {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM posts p ${where} ${where ? "AND" : "WHERE"} content LIKE ?`)
      .get(...values, `%${kw}%`) as { count: number };
    if (row.count > 0) {
      keywords.push({ keyword: kw, count: row.count });
    }
  }
  keywords.sort((a, b) => b.count - a.count);
  const topKeywords = keywords.slice(0, 20);

  return NextResponse.json({
    statusBreakdown,
    dismissBreakdown,
    timeline,
    keywords: topKeywords,
    activity: {
      reviewedThisWeek: weeklyReviewed.count,
      appliedThisWeek: weeklyApplied.count,
      lastAppliedAt: lastApplied?.applied_at ?? null,
    },
    remoteBreakdown,
  });
}

import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { migrate } from "@/db/migrate";
import { TECH_KEYWORDS } from "@/lib/tech-keywords";

export async function GET() {
  migrate();
  const db = getDb();

  const statusBreakdown = db
    .prepare("SELECT status, COUNT(*) as count FROM posts GROUP BY status ORDER BY count DESC")
    .all() as { status: string; count: number }[];

  const dismissBreakdown = db
    .prepare(
      "SELECT dismiss_reason, COUNT(*) as count FROM posts WHERE status = 'dismissed' AND dismiss_reason IS NOT NULL GROUP BY dismiss_reason ORDER BY count DESC"
    )
    .all() as { dismiss_reason: string; count: number }[];

  const timeline = db
    .prepare(
      `SELECT t.month,
              COUNT(p.id) as total,
              SUM(CASE WHEN p.status = 'applied' OR p.status = 'in_progress' THEN 1 ELSE 0 END) as applied
       FROM posts p
       JOIN threads t ON t.id = p.thread_id
       GROUP BY t.month
       ORDER BY t.month`
    )
    .all() as { month: string; total: number; applied: number }[];

  const keywords: { keyword: string; count: number }[] = [];
  for (const kw of TECH_KEYWORDS) {
    const row = db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE content LIKE ?")
      .get(`%${kw}%`) as { count: number };
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
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractUrlFromHtml(html: string): string | null {
  const match = html.match(/href="(https?:\/\/[^"]+)"/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const postId = request.nextUrl.searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const id = Number(postId);

  // Check cache
  const cached = db
    .prepare("SELECT * FROM company_research WHERE post_id = ?")
    .get(id) as any;

  if (cached) {
    return NextResponse.json(cached);
  }

  // Get post data
  const post = db
    .prepare("SELECT company, content FROM posts WHERE id = ?")
    .get(id) as { company: string | null; content: string } | undefined;

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const company = post.company ?? "Unknown";
  const slug = slugify(company);
  const companyUrl = extractUrlFromHtml(post.content);

  const research = {
    post_id: id,
    company_name: company,
    company_url: companyUrl,
    linkedin_url: slug ? `https://linkedin.com/company/${slug}` : null,
    glassdoor_url: slug ? `https://glassdoor.com/Reviews/${slug}-Reviews` : null,
    levels_url: slug ? `https://levels.fyi/companies/${slug}` : null,
  };

  // Cache it
  db.prepare(
    `INSERT INTO company_research (post_id, company_name, company_url, linkedin_url, glassdoor_url, levels_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    research.post_id,
    research.company_name,
    research.company_url,
    research.linkedin_url,
    research.glassdoor_url,
    research.levels_url
  );

  return NextResponse.json(research);
}

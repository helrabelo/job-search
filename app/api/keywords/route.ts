import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { migrate } from "@/db/migrate";

export async function GET() {
  migrate();
  const db = getDb();
  const keywords = db
    .prepare("SELECT * FROM profile_keywords ORDER BY keyword")
    .all();
  return NextResponse.json(keywords);
}

export async function POST(request: NextRequest) {
  migrate();
  const { keyword } = await request.json();

  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO profile_keywords (keyword) VALUES (?)")
      .run(keyword.trim());
    const created = db
      .prepare("SELECT * FROM profile_keywords WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Keyword already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}

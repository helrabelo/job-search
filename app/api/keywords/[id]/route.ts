import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const keywordId = Number(id);
  if (isNaN(keywordId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM profile_keywords WHERE id = ?").run(keywordId);
  return NextResponse.json({ ok: true });
}

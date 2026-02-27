import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const source = body.source as string | undefined;
    const result = await runScrapers(source);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scrape failed", message: String(error) },
      { status: 500 }
    );
  }
}

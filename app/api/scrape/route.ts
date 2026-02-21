import { NextResponse } from "next/server";
import { scrape } from "@/lib/scraper";

export async function POST() {
  try {
    const result = await scrape();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scrape failed", message: String(error) },
      { status: 500 }
    );
  }
}

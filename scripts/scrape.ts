import { scrape } from "../lib/scraper";

async function main() {
  console.log("[scrape] Starting...");
  const result = await scrape();
  console.log(
    `[scrape] Done. ${result.newPosts} new posts, ${result.totalPosts} total, ${result.threadsChecked} threads checked.`
  );
}

main().catch((err) => {
  console.error("[scrape] Error:", err);
  process.exit(1);
});

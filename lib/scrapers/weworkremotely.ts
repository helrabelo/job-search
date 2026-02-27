import type { ScraperPlugin, ScraperResult, ScrapedPost } from "./types";

const WWR_RSS = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

/**
 * Decode HTML entities (&lt; &gt; &amp; &quot; &#39; &#xxx;) back to real characters.
 */
function decodeEntities(str: string): string {
  const map: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };
  return str
    .replace(/&(?:lt|gt|amp|quot|nbsp|#39);/g, (m) => map[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export const wwrScraper: ScraperPlugin = {
  name: "weworkremotely",

  async scrape(): Promise<ScraperResult> {
    const res = await fetch(WWR_RSS);
    if (!res.ok) {
      throw new Error(`WWR fetch failed: ${res.status}`);
    }

    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const threadId = `wwr-${month}`;

    const posts: ScrapedPost[] = items.map((item, i) => {
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        "";
      // WWR uses HTML-entity-encoded descriptions, not CDATA
      const rawDescription =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
        "";
      const description = decodeEntities(rawDescription);
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const guid = item.match(/<guid.*?>(.*?)<\/guid>/)?.[1] || `wwr-${i}`;

      // Extract company from title (usually "Company: Role")
      const parts = title.split(":");
      const company = parts.length > 1 ? parts[0].trim() : null;

      const content = `<p><b>${title}</b> | Remote</p>${description}<p><a href="${link}">${link}</a></p>`;

      return {
        id: `wwr-${guid.replace(/[^a-zA-Z0-9]/g, "-")}`,
        thread_id: threadId,
        author: company,
        content,
        company,
        is_remote: true,
        posted_at: pubDate ? new Date(pubDate).toISOString() : now.toISOString(),
        source: "weworkremotely",
        apply_url: link || null,
      };
    });

    return {
      threads: [
        {
          id: threadId,
          title: `WeWorkRemotely Jobs — ${month}`,
          month,
          posted_at: now.toISOString(),
          source: "weworkremotely",
        },
      ],
      posts,
    };
  },
};

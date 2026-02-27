import { stripHtml } from "./parser";
import { TECH_KEYWORDS } from "./tech-keywords";

interface DismissPattern {
  reason: string;
  count: number;
  keywords: string[];
}

/**
 * Analyze dismissed posts to find recurring tech keywords per dismiss reason.
 */
export function analyzeDismissPatterns(
  posts: { content: string; dismiss_reason: string }[]
): DismissPattern[] {
  const groups = new Map<string, string[]>();

  for (const post of posts) {
    if (!post.dismiss_reason) continue;
    if (!groups.has(post.dismiss_reason)) {
      groups.set(post.dismiss_reason, []);
    }
    groups.get(post.dismiss_reason)!.push(post.content);
  }

  const patterns: DismissPattern[] = [];

  for (const [reason, contents] of groups) {
    const kwCounts = new Map<string, number>();

    for (const content of contents) {
      const text = stripHtml(content).toLowerCase();
      for (const kw of TECH_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) {
          kwCounts.set(kw, (kwCounts.get(kw) ?? 0) + 1);
        }
      }
    }

    // Top keywords that appear in >30% of dismissed posts for this reason
    const threshold = Math.max(1, Math.floor(contents.length * 0.3));
    const topKeywords = [...kwCounts.entries()]
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    patterns.push({
      reason,
      count: contents.length,
      keywords: topKeywords,
    });
  }

  return patterns.sort((a, b) => b.count - a.count);
}

/**
 * Check if a post matches any dismiss pattern.
 */
export function matchDismissPatterns(
  content: string,
  patterns: DismissPattern[]
): { reason: string; count: number; matchedKeywords: string[] }[] {
  const text = stripHtml(content).toLowerCase();
  const matches: { reason: string; count: number; matchedKeywords: string[] }[] = [];

  for (const pattern of patterns) {
    if (pattern.keywords.length === 0) continue;

    const matched = pattern.keywords.filter((kw) =>
      text.includes(kw.toLowerCase())
    );

    // If the post matches >50% of the pattern's keywords, it's a match
    if (matched.length >= Math.ceil(pattern.keywords.length / 2)) {
      matches.push({
        reason: pattern.reason,
        count: pattern.count,
        matchedKeywords: matched,
      });
    }
  }

  return matches;
}

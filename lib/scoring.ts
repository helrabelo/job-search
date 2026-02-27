import { stripHtml } from "./parser";
import { TECH_KEYWORDS } from "./tech-keywords";

/**
 * Calculate a relevance score (0–100) for a post based on profile keywords and features.
 */
export function calculateScore(
  content: string,
  profileKeywords: string[],
  isRemote: boolean
): number {
  const text = stripHtml(content).toLowerCase();
  let score = 0;

  // Profile keyword matches: +10 each
  for (const kw of profileKeywords) {
    if (text.includes(kw.toLowerCase())) {
      score += 10;
    }
  }

  // Remote: +15
  if (isRemote) {
    score += 15;
  }

  // Tech keyword matches (from our tech list, if also in profile): +5 each
  const profileLower = new Set(profileKeywords.map((k) => k.toLowerCase()));
  for (const tech of TECH_KEYWORDS) {
    if (profileLower.has(tech.toLowerCase())) continue; // already counted above
    if (text.includes(tech.toLowerCase())) {
      score += 3;
    }
  }

  // Company name present (first line not empty): +5
  const firstLine = text.split("\n")[0]?.trim();
  if (firstLine && firstLine.length > 0 && firstLine.includes("|")) {
    score += 5;
  }

  // Detailed listing (>200 chars): +5
  if (text.length > 200) {
    score += 5;
  }

  return Math.min(100, score);
}

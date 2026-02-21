/**
 * Extract company name from the first line of a job posting.
 * HN convention: "Company Name | Role | Location | ..."
 */
export function parseCompany(html: string): string | null {
  // Get first line of text content
  const firstLine = stripHtml(html).split("\n")[0]?.trim();
  if (!firstLine) return null;

  // Split by common delimiters: | or –  or —
  const parts = firstLine.split(/\s*[|–—]\s*/);
  const company = parts[0]?.trim();

  if (!company || company.length > 100) return null;
  return company;
}

/**
 * Detect if a posting mentions remote work.
 */
export function isRemote(html: string): boolean {
  return /\bremote\b/i.test(html);
}

/**
 * Strip HTML tags for plain-text preview.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p>/gi, "\n")
    .replace(/<\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Extract month string (YYYY-MM) from a thread title or date.
 */
export function extractMonth(title: string, createdAt: string): string {
  // Try to parse from title like "Ask HN: Who is hiring? (February 2026)"
  const monthNames: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const match = title.match(
    /\((\w+)\s+(\d{4})\)/i
  );
  if (match) {
    const monthNum = monthNames[match[1].toLowerCase()];
    if (monthNum) return `${match[2]}-${monthNum}`;
  }

  // Fallback: use the created_at date
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

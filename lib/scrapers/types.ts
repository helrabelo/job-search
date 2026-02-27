export interface ScrapedThread {
  id: string;
  title: string;
  month: string;
  posted_at: string;
  source: string;
}

export interface ScrapedPost {
  id: string;
  thread_id: string;
  author: string | null;
  content: string;
  company: string | null;
  is_remote: boolean;
  posted_at: string;
  source: string;
}

export interface ScraperResult {
  threads: ScrapedThread[];
  posts: ScrapedPost[];
}

export interface ScraperPlugin {
  name: string;
  scrape(): Promise<ScraperResult>;
}

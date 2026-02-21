export type PostStatus =
  | "new"
  | "saved"
  | "applied"
  | "in_progress"
  | "dismissed";

export interface Thread {
  id: number;
  title: string;
  month: string;
  posted_at: string;
  fetched_at: string;
}

export interface Post {
  id: number;
  thread_id: number;
  author: string | null;
  content: string;
  company: string | null;
  is_remote: number;
  posted_at: string;
  status: PostStatus;
  notes: string | null;
  applied_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface ScrapeResult {
  newPosts: number;
  totalPosts: number;
  threadsChecked: number;
}

export interface AlgoliaHit {
  objectID: string;
  title: string;
  created_at: string;
  created_at_i: number;
}

export interface HNItem {
  id: number;
  by?: string;
  text?: string;
  time: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
}

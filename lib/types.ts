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

export type DismissReason =
  | "wrong_stack"
  | "no_visa"
  | "not_remote"
  | "not_developer"
  | "location_gated"
  | "low_pay";

export const DISMISS_REASONS: { value: DismissReason; label: string }[] = [
  { value: "wrong_stack", label: "Wrong stack" },
  { value: "no_visa", label: "No visa / work permit" },
  { value: "not_remote", label: "Not remote first" },
  { value: "not_developer", label: "Not a developer role" },
  { value: "location_gated", label: "Location gated / blocked" },
  { value: "low_pay", label: "Low pay" },
];

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
  dismiss_reason: string | null;
  first_seen_at: string | null;
  relevance_score: number;
  source: string;
  updated_at: string;
  created_at: string;
}

export interface ThreadResult {
  title: string;
  month: string;
  totalComments: number;
  alreadyStored: number;
  newAdded: number;
  skippedDeleted: number;
}

export interface ScrapeResult {
  newPosts: number;
  totalPosts: number;
  threadsChecked?: number;
  threads?: ThreadResult[];
  sourcesChecked?: string[];
  perSource?: { source: string; threads: number; newPosts: number; errors?: string }[];
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

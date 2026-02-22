import { getDb } from "./index";

export function migrate() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      month TEXT NOT NULL,
      posted_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES threads(id),
      author TEXT,
      content TEXT NOT NULL,
      company TEXT,
      is_remote INTEGER DEFAULT 0,
      posted_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT,
      applied_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_is_remote ON posts(is_remote);
  `);

  // Add dismiss_reason column if it doesn't exist
  const cols = db.prepare("PRAGMA table_info(posts)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "dismiss_reason")) {
    db.exec("ALTER TABLE posts ADD COLUMN dismiss_reason TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

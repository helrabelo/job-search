import { getDb } from "./index";

interface Migration {
  version: number;
  name: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "baseline_schema",
    up: `
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

      CREATE TABLE IF NOT EXISTS profile_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL UNIQUE COLLATE NOCASE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    name: "add_dismiss_reason",
    up: `
      -- Add dismiss_reason column if it doesn't exist (safe for existing DBs)
      ALTER TABLE posts ADD COLUMN dismiss_reason TEXT;
    `,
  },
  {
    version: 3,
    name: "add_undo_log",
    up: `
      CREATE TABLE IF NOT EXISTS undo_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_undo_log_post_id ON undo_log(post_id);
    `,
  },
];

let migrated = false;

export function migrate() {
  if (migrated) return;

  const db = getDb();

  // Create schema_version table if missing
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Determine current version
  const row = db.prepare("SELECT MAX(version) as v FROM schema_version").get() as { v: number | null };
  const currentVersion = row?.v ?? 0;

  // Detect if this is an existing DB that was never versioned
  // If tables exist but no schema_version entries, bootstrap from the right point
  if (currentVersion === 0) {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = new Set(tables.map((t) => t.name));

    if (tableNames.has("posts")) {
      // DB already has baseline tables — mark version 1 as applied
      db.prepare("INSERT OR IGNORE INTO schema_version (version, name) VALUES (?, ?)").run(1, "baseline_schema");

      // Check if dismiss_reason column exists
      const cols = db.prepare("PRAGMA table_info(posts)").all() as { name: string }[];
      if (cols.some((c) => c.name === "dismiss_reason")) {
        db.prepare("INSERT OR IGNORE INTO schema_version (version, name) VALUES (?, ?)").run(2, "add_dismiss_reason");
      }

      // Check if undo_log table exists
      if (tableNames.has("undo_log")) {
        db.prepare("INSERT OR IGNORE INTO schema_version (version, name) VALUES (?, ?)").run(3, "add_undo_log");
      }
    }
  }

  // Re-read current version after bootstrapping
  const updatedRow = db.prepare("SELECT MAX(version) as v FROM schema_version").get() as { v: number | null };
  const startVersion = updatedRow?.v ?? 0;

  // Run pending migrations
  const pending = migrations.filter((m) => m.version > startVersion);

  for (const m of pending) {
    try {
      db.exec(m.up);
    } catch (err: any) {
      // Skip "duplicate column" errors for ALTER TABLE (idempotent)
      if (err.message?.includes("duplicate column")) {
        // Column already exists, skip
      } else {
        throw err;
      }
    }
    db.prepare("INSERT INTO schema_version (version, name) VALUES (?, ?)").run(m.version, m.name);
  }

  migrated = true;
}

/**
 * Access the migrations array (for adding new migrations from other modules).
 */
export { migrations };

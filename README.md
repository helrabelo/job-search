# HN Job Tracker

A local-first job tracker that scrapes Hacker News "Who is Hiring?" threads and gives you tools to filter, tag, and manage applications.

Built with Next.js, SQLite (via better-sqlite3), and Tailwind CSS. Everything runs locally — no accounts, no external services, no data leaves your machine.

## Features

- **Auto-scrape** — Fetches the latest "Who is Hiring?" threads from the HN Algolia API
- **Status tracking** — Mark posts as New, Saved, Applied, In Progress, or Dismissed
- **Quick dismiss** — One-click dismiss with reasons (wrong stack, no visa, not remote, etc.)
- **Profile keywords** — Add your skills/tech, filter posts that match, and see keywords highlighted in post content
- **Statistics** — Dashboard sidebar and full stats page with status breakdown, dismiss reasons, timeline, and tech keyword frequency
- **Search and filter** — Filter by status, remote-only, thread, free-text search, and skill match
- **Relative dates** — "3d ago", "2w ago" instead of raw dates

## Setup

```bash
git clone https://github.com/helrabelo/job-search.git
cd job-search
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created automatically on first request. No configuration needed.

## Usage

1. Click **Refresh** on the dashboard to scrape the latest HN hiring threads
2. Browse posts, use filters to narrow down
3. Click a post to view details, change status, add notes, or dismiss
4. Go to **Manage keywords** to add your skills — posts matching your keywords get highlighted
5. Check **Matches my skills** to filter to relevant posts only
6. View **Statistics** for an overview of your progress

## Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** SQLite via better-sqlite3 (stored at `db/data.db`)
- **Scraping:** HN Algolia API + HN item API

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run scrape` | Scrape HN threads from CLI |

## Auto-Scrape (Cron)

New "Who is Hiring?" threads are posted on the 1st of each month around 11 AM ET. You can set up a cron job to scrape automatically so new posts are waiting for you.

```bash
# Edit your crontab
crontab -e

# Scrape every 6 hours on the 1st-3rd of each month (catches the thread + stragglers)
0 */6 1-3 * * cd /path/to/job-search && npm run scrape >> /tmp/hn-scrape.log 2>&1

# Or scrape daily if you prefer
0 9 * * * cd /path/to/job-search && npm run scrape >> /tmp/hn-scrape.log 2>&1
```

Replace `/path/to/job-search` with your actual project path. The scraper is idempotent — it skips posts already in the database, so running it often is safe.

You can also scrape manually anytime by clicking **Refresh** in the UI or running `npm run scrape`.

## Project Structure

```
app/
  api/
    posts/        # CRUD for job posts
    keywords/     # Profile keywords CRUD
    stats/        # Statistics aggregation
    scrape/       # Trigger scrape from UI
    threads/      # List scraped threads
  stats/          # Statistics page
components/       # React components
db/               # SQLite database + migrations
lib/              # Utilities (parser, scraper, highlight, types)
scripts/          # CLI scrape script
```

## License

MIT

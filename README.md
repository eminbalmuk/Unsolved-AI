# Unsolved

Unsolved is a polished MVP for discovering unresolved SaaS problems from public customer signals. It implements the first product slice from `plan.docx`: discovery feed, problem detail analysis, founder dashboard, B2B report preview, admin pipeline view, mock API routes, seed data, and AI-generated homepage imagery.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui with Radix primitives and Geist typography
- lucide-react icons, motion animations, Recharts visualizations
- Seed/mock data for the first MVP phase

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Routes

- `/` - animated landing page
- `/explora` - Discovery Feed
- `/explore` - Discovery Feed alias
- `/problems/[slug]` - problem detail, evidence, Pain Score, validation
- `/dashboard` - founder watchlist
- `/reports` - B2B weekly report preview
- `/login` - email/password sign in
- `/register` - account creation
- `/admin` - pipeline and scoring controls

## Mock APIs

- `GET /api/ingest` - fetches and normalizes live public signals
- `GET /api/auth/me` - current session user
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/problems?q=&sector=&sort=` - live public data with seed fallback
- `GET /api/problems/[id]`
- `POST /api/problems/[id]/analysis` - on-demand Turkish AI analysis and solution suggestions
- `POST /api/problems/[id]/validate`
- `GET /api/reports/weekly`

## Live ingestion

The Explore feed now pulls real public data server-side from:

- Reddit public listing/search JSON for configurable subreddit targets
- Hacker News official Firebase API for recent `Ask HN` problem-seeking threads
- Apple iTunes/App Store customer review RSS JSON for configured app IDs

Live source fetches are cached for 15 minutes and fall back to Supabase-stored problems, then the seed dataset, if every provider fails. When `DATABASE_URL` is configured, normalized problems and source snippets are persisted in Supabase so the app does not repeatedly fetch already-known forum problems. Optional environment variables:

- `REDDIT_USER_AGENT`
- `REDDIT_SUBREDDITS` - comma-separated subreddit list, for example `SaaS,startups,smallbusiness`
- `REDDIT_MAX_AGE_DAYS` - Reddit signal freshness window, defaults to `365`
- `HACKER_NEWS_STORY_LIMIT` - recent Ask HN items to inspect, defaults to `60`
- `APPLE_RSS_COUNTRY`

## Turkish problem analysis

Problem detail pages include an on-demand `Analiz Et` button. It calls BytePlus Ark only when the user asks for analysis, then returns a compact Turkish summary, pain drivers, solution ideas, MVP steps, and risks. Required environment variables:

- `BYTEPLUS_ARK_API_KEY`
- `BYTEPLUS_ARK_API_URL` (defaults to the BytePlus Ark chat completions endpoint)
- `BYTEPLUS_ARK_MODEL` (defaults to `deepseek-v3-2-251201`)

When `DATABASE_URL` is configured, Turkish analysis results are stored in Supabase. Previously analyzed problems render from the database and the `Analiz Et` button is disabled, preventing duplicate model calls and reducing token cost.

Live auth, payment, Supabase, Pinecone, OAuth-based Reddit API access, and FastAPI LLM pipeline are intentionally left as integration boundaries for the next phase.

## Supabase + Prisma auth

Fill `.env` with the required Supabase and auth values, then run:

```bash
npm run db:generate
npm run db:setup:supabase
npm run db:seed:problems
```

Use the Supabase transaction pooler URL for `DATABASE_URL` on Vercel and local development. `db:setup:supabase` creates the required Supabase tables through a guarded SQL setup script, which avoids local IPv6/direct-connection issues.

Supabase Auth can run with `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Persistent problem storage, validation storage, and AI-analysis caching require `DATABASE_URL` / `DIRECT_URL` as well.

# Supabase SQL prompt — Financial Navigator comments

Paste everything below into the Supabase SQL editor (or the Supabase AI / SQL assistant) and run it as-is.

---

Create two tables for a Node/Express app that talks to Supabase through PostgREST only (service role, RLS on, no anon policies). Do not create a providers or entries table. Provider directory records stay in `data/seed.json` in the Express/React app. Comments are the only user-generated data in Postgres.

Requirements:

1. `public.navigator_countries`
   - `slug text primary key` — lowercase kebab: netherlands, germany, denmark, finland, norway, sweden
   - `name text not null unique` — Netherlands, Germany, Denmark, Finland, Norway, Sweden
   - `code text not null unique` — NL, DE, DK, FI, NO, SE
   - Seed those six rows with upsert on slug

2. `public.navigator_comments`
   - `id uuid primary key default gen_random_uuid()`
   - `entry_slug text not null` — provider page slug, e.g. `bank-deutsche-bank`. Check: `^[a-z0-9]+(-[a-z0-9]+)*$`
   - `country_slug text null` — FK to `navigator_countries.slug`, on update cascade, on delete set null
   - `author_name text not null` — trimmed length 2–80
   - `body text not null` — trimmed length 2–2000
   - `created_at timestamptz not null default now()`
   - Index `(entry_slug, created_at desc)` for `GET /api/entries/:slug/comments`

3. Enable RLS on both tables. Do not add anon or authenticated policies. The Express server uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS.

4. Do not touch `public.navigator_workspace` if it exists. Do not add triggers, views, or storage buckets.

Return only the SQL.

---

The checked-in file `sql/002_comments.sql` is the same schema, ready to run.

For admin comments (`is_admin`, `parent_id`), use `sql/SUPABASE_COMMENTS_ADMIN_PROMPT.md` or run `sql/004_comments_admin.sql`.

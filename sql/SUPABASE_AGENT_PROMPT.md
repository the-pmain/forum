# Supabase AI agent prompt — Financial Navigator (current)

Paste **everything below the line** into the Supabase SQL agent. Do not attach catalogue JSON or `sql/003` files.

---

You are updating one Postgres project for Financial Navigator. The Node/Express app talks to Supabase **only through PostgREST** (HTTP). It uses `SUPABASE_SERVICE_ROLE_KEY`. There is no supabase-js client. RLS stays on. Add **no** anon or authenticated policies.

## What belongs in Postgres

Only public comments and a small country lookup.

## What must not be in Postgres

Do **not** create tables named providers, entries, loans, products, catalogue, or similar.

Do **not** store directory records, verified flags, hidden flags, PIN/admin sessions, or catalogue packs in Postgres. Those live in the Express/React app (`data/seed.json` + server memory). Admin PIN, verify, hide, edit, and delete never touch this database.

If `public.navigator_workspace` already exists, **leave it**. Do not insert catalogue JSON. Do not empty it. Do not drop it unless the user explicitly asks. The app does not read that table.

Do not run any “merge catalog” / `p01.sql`–`p28.sql` batches. Do not paste large JSON into this database.

Do not add triggers, views, storage buckets, Edge Functions, or GraphQL.

## Target schema (idempotent)

### 1. `public.navigator_countries`

Create if missing.

| Column | Type | Rules |
|---|---|---|
| `slug` | text | primary key, lowercase kebab |
| `name` | text | not null unique |
| `code` | text | not null unique |

The table may already exist **empty**. Empty countries break comment inserts (`country_slug` FK). Upsert these six rows (on `slug`):

- netherlands / Netherlands / NL
- germany / Germany / DE
- denmark / Denmark / DK
- finland / Finland / FI
- norway / Norway / NO
- sweden / Sweden / SE

Enable RLS. No policies.

### 2. `public.navigator_comments`

Create if missing, then **alter** existing installs so they match this shape. Keep existing comment rows.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `entry_slug` | text not null | provider page id, check `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `country_slug` | text null | FK to `navigator_countries.slug`, on update cascade, on delete set null |
| `author_name` | text not null | trimmed length 2–80 |
| `body` | text not null | trimmed length 2–2000 (HTML allowed by the app; DB only checks length) |
| `created_at` | timestamptz not null | default `now()` |
| `is_admin` | boolean not null | default `false`. Express sets this when the admin PIN cookie is present on `POST /api/entries/:slug/comments`. Admin rows are listed first. |
| `parent_id` | uuid null | FK to `navigator_comments.id` on delete cascade. One-level admin reply. Null = top-level. Express rejects replies-to-replies. |

Existing rows: `is_admin` stays false; `parent_id` stays null.

Indexes (create if missing):

- `(entry_slug, created_at desc)`
- `(entry_slug, is_admin desc, created_at desc)`
- `(parent_id)`

Enable RLS. No policies.

### 3. Schema cache

After DDL: `notify pgrst, 'reload schema';`

PostgREST must expose:

- `GET /rest/v1/navigator_comments?entry_slug=eq.<slug>&select=id,entry_slug,country_slug,author_name,body,created_at,is_admin,parent_id`
- `POST /rest/v1/navigator_comments` with those columns (service role)

A missing `is_admin` or `parent_id` column is a failure. Confirm both exist before you stop.

## How the app uses this

- `GET /api/entries/:slug/comments` → select by `entry_slug`, then Express sorts admin first, then `created_at` desc. Replies nest in the UI via `parent_id`.
- `POST /api/entries/:slug/comments` → insert. Visitors: `is_admin=false`, `parent_id=null`. Admin session: `author_name='Admin'`, `is_admin=true`, optional `parent_id`.
- Directory catalogue, verified, hidden, edit, trash: **not** in this database.

## Do

1. Inspect current tables/columns.
2. Create anything missing.
3. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for `is_admin` and `parent_id`.
4. Add indexes if missing.
5. Enable RLS if not enabled.
6. Reload the PostgREST schema cache.
7. Return only the SQL you ran, then a one-line confirmation that `navigator_comments.is_admin` and `navigator_comments.parent_id` exist.

Return only SQL (plus that one confirmation line). Do not invent extra objects.

# Supabase SQL prompt — admin comments

Paste everything below into the Supabase SQL agent / SQL editor. Run it on the existing comments schema. Do not invent extra tables.

---

You are updating the Financial Navigator Postgres project. The Node/Express app talks to Supabase through PostgREST only (service role, RLS on, no anon policies).

Directory provider records stay in the Express/React app (`data/seed.json` and server memory). Do **not** create a providers, entries, or verified/hidden table. Verified and hidden flags are not stored in Postgres.

`public.navigator_comments` already exists (id, entry_slug, country_slug, author_name, body, created_at). Add two columns for admin notes:

1. `is_admin boolean not null default false`
   - Set by Express when the HMAC admin cookie is present on `POST /api/entries/:slug/comments`.
   - The API lists comments with admin rows first, then `created_at desc`.
2. `parent_id uuid null references public.navigator_comments(id) on delete cascade`
   - One-level reply. Only admin sessions may set it. Replies to replies are rejected in Express.

Also:

- `create index` on `(entry_slug, is_admin desc, created_at desc)` named `navigator_comments_entry_admin_created_at_idx` if missing
- `create index` on `(parent_id)` named `navigator_comments_parent_id_idx` if missing
- Keep RLS enabled. Add **no** anon or authenticated policies.
- `notify pgrst, 'reload schema';` after the ALTER.
- Do not drop existing comments. Do not change `navigator_countries`. Do not touch `navigator_workspace` if it exists.

Return only the SQL.

---

The checked-in file `sql/004_comments_admin.sql` is the same migration, ready to run.

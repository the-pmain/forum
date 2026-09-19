-- Admin comment flags for navigator_comments.
-- Directory records stay in the Express app (data/seed.json + server memory). Do not create a providers table.
-- Run in the Supabase SQL editor after sql/002_comments.sql if those columns were missing.

alter table public.navigator_comments
  add column if not exists is_admin boolean not null default false;

alter table public.navigator_comments
  add column if not exists parent_id uuid null references public.navigator_comments (id) on delete cascade;

create index if not exists navigator_comments_entry_admin_created_at_idx
  on public.navigator_comments (entry_slug, is_admin desc, created_at desc);

create index if not exists navigator_comments_parent_id_idx
  on public.navigator_comments (parent_id);

comment on column public.navigator_comments.is_admin is
  'True when the comment was posted from an authenticated admin session. Admin comments are listed first.';

comment on column public.navigator_comments.parent_id is
  'Optional parent comment for a one-level admin reply. Null means a top-level comment.';

notify pgrst, 'reload schema';

-- Countries (slug lookup) + public comments for provider entry pages.
-- Directory provider records stay in data/seed.json in the app, not in Postgres.
-- navigator_workspace is unused leftover if it exists. Do not load the catalogue into it.
-- Run this in the Supabase SQL editor. 001_schema.sql is unused leftover.

create table if not exists public.navigator_countries (
  slug text not null,
  name text not null,
  code text not null,
  constraint navigator_countries_pkey primary key (slug),
  constraint navigator_countries_code_key unique (code),
  constraint navigator_countries_name_key unique (name)
);

insert into public.navigator_countries (slug, name, code) values
  ('netherlands', 'Netherlands', 'NL'),
  ('germany', 'Germany', 'DE'),
  ('denmark', 'Denmark', 'DK'),
  ('finland', 'Finland', 'FI'),
  ('norway', 'Norway', 'NO'),
  ('sweden', 'Sweden', 'SE')
on conflict (slug) do update
set name = excluded.name,
    code = excluded.code;

create table if not exists public.navigator_comments (
  id uuid not null default gen_random_uuid(),
  entry_slug text not null,
  country_slug text null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  is_admin boolean not null default false,
  parent_id uuid null,
  constraint navigator_comments_pkey primary key (id),
  constraint navigator_comments_country_slug_fkey foreign key (country_slug) references public.navigator_countries (slug) on update cascade on delete set null,
  constraint navigator_comments_parent_id_fkey foreign key (parent_id) references public.navigator_comments (id) on delete cascade,
  constraint navigator_comments_author_name_check check (
    (char_length(btrim(author_name)) >= 2)
    and (char_length(btrim(author_name)) <= 80)
  ),
  constraint navigator_comments_body_check check (
    (char_length(btrim(body)) >= 2)
    and (char_length(btrim(body)) <= 2000)
  ),
  constraint navigator_comments_entry_slug_check check (entry_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

alter table public.navigator_comments
  add column if not exists is_admin boolean not null default false;

alter table public.navigator_comments
  add column if not exists parent_id uuid null references public.navigator_comments (id) on delete cascade;

create index if not exists navigator_comments_entry_created_idx
  on public.navigator_comments (entry_slug, created_at desc);

create index if not exists navigator_comments_entry_admin_created_at_idx
  on public.navigator_comments (entry_slug, is_admin desc, created_at desc);

create index if not exists navigator_comments_parent_id_idx
  on public.navigator_comments (parent_id);

alter table public.navigator_countries enable row level security;
alter table public.navigator_comments enable row level security;

comment on table public.navigator_countries is
  'Stable country slugs used by directory filters and optional comment context.';

comment on table public.navigator_comments is
  'Public comments for a provider entry page, keyed by the provider slug (entry_slug).';

comment on column public.navigator_comments.is_admin is
  'True when the comment was posted from an authenticated admin session. Admin comments are listed first.';

comment on column public.navigator_comments.parent_id is
  'Optional parent comment for a one-level admin reply. Null means a top-level comment.';

notify pgrst, 'reload schema';

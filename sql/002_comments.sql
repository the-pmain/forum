-- Countries (slug lookup) + public comments for provider entry pages.
-- Directory provider records stay in the Express app / navigator_workspace JSON.
-- Run this in the Supabase SQL editor after 001_schema.sql.

create table if not exists public.navigator_countries (
  slug text primary key,
  name text not null unique,
  code text not null unique
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
  id uuid primary key default gen_random_uuid(),
  entry_slug text not null,
  country_slug text null references public.navigator_countries (slug) on update cascade on delete set null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint navigator_comments_entry_slug_check check (entry_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint navigator_comments_author_name_check check (char_length(btrim(author_name)) between 2 and 80),
  constraint navigator_comments_body_check check (char_length(btrim(body)) between 2 and 2000)
);

create index if not exists navigator_comments_entry_created_idx
  on public.navigator_comments (entry_slug, created_at desc);

alter table public.navigator_countries enable row level security;
alter table public.navigator_comments enable row level security;

comment on table public.navigator_countries is
  'Stable country slugs used by directory filters and optional comment context.';

comment on table public.navigator_comments is
  'Public comments for a provider entry page, keyed by the provider slug (entry_slug).';

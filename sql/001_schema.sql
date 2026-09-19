-- Unused by the app. Directory records live in data/seed.json.
-- Kept so an existing empty table is harmless. Do not load providers into this row.

create table if not exists public.navigator_workspace (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.navigator_workspace enable row level security;

-- Service-role requests from the Express server bypass RLS.
-- No anon policies: the public API reads through Express, not the browser.

comment on table public.navigator_workspace is
  'Unused leftover. Directory records live in data/seed.json.';

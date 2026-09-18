-- Financial Navigator workspace, consumed through Supabase PostgREST (HTTP).
-- Run in the Supabase SQL editor, then expose the table to the service role.

create table if not exists public.navigator_workspace (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.navigator_workspace enable row level security;

-- Service-role requests from the Express server bypass RLS.
-- No anon policies: the public API reads through Express, not the browser.

comment on table public.navigator_workspace is
  'Single-row JSON workspace for the Financial Navigator directory.';

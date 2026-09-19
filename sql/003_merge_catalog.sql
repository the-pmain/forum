-- UNUSED. The app does not read navigator_workspace. Directory records are in data/seed.json.
-- Kept so an existing empty row is harmless. Do not run this to “fix” an empty catalogue.

create table if not exists public.navigator_workspace (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.navigator_workspace enable row level security;

comment on table public.navigator_workspace is
  'Single-row JSON workspace for the Financial Navigator directory.';

insert into public.navigator_workspace (id, payload, updated_at)
values ('nl-de-nordics-2026-v1', $jn${"schemaVersion":1,"app":"Financial Navigator","workspaceId":"nl-de-nordics-2026-v1","sourceFile":"netherlands_germany_nordics_directory.xlsx","sourceNote":"Scope: Netherlands, Germany, Denmark, Finland, Norway and Sweden. Iceland removed. Existing provider and borrowing information retained without a fresh audit. Ten card/smaller-credit products added from official sources reviewed 18 September 2026. Amount types and upper-age uncertainty are explicit. This local directory does not make or submit credit applications. Netherlands consumer-credit catalogue mapped 19 September 2026 (nl-consumer-credit/1.0): 134 records. Review-hold and legacy/existing-only records are kept but excluded from new-offer results. Brokers and comparison platforms are Aggregators, not lenders. Europe mining solutions added 19 September 2026 (GoMining, BitFuFu, Bitdeer, NiceHash). Country availability is Check until local terms are verified.","countries":["Netherlands","Germany","Denmark","Finland","Norway","Sweden"],"providers":[],"favorites":[],"trash":[],"lastSaved":null,"revision":0,"appliedPacks":["high-street-banks-2026-09-18","loans-credit-2026-09-18-v1","cards-small-credit-2026-09-18-v1","nl-consumer-credit-2026-09-19-v1","mining-solutions-europe-2026-09-19-v1"]}$jn$::jsonb, now())
on conflict (id) do nothing;

notify pgrst, 'reload schema';

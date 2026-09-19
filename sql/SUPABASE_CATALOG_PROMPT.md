# Do not run this. The catalogue is `data/seed.json` in the app. Supabase stores comments only.

# Supabase agent prompt — Financial Navigator catalogue (obsolete)

This prompt was for loading providers into `navigator_workspace`. The app no longer reads that table. An empty workspace row will not empty the UI. Leave the SQL files in `sql/003/` unused.

---

Paste everything below into your Supabase SQL agent. Do **not** paste `sql/003_merge_catalog.sql` and the `sql/003/p*.sql` batches into the chat together — that ~760KB JSON blob freezes the agent. Execute the numbered files **one at a time** in the SQL editor. Do not invent extra tables.

---

You are updating the Financial Navigator Postgres project used by a Node/Express app through PostgREST (service role, RLS on, no anon policies).

## Current shape

These objects should already exist from the comments work:

- `public.navigator_countries` (slugs netherlands, germany, denmark, finland, norway, sweden)
- `public.navigator_comments` (public notes on entry pages)

Directory records are **not** comment rows and must **not** become a providers/loans/mining table. They live in one JSON document:

- table `public.navigator_workspace`
- primary key `id = 'nl-de-nordics-2026-v1'`
- column `payload jsonb` (`providers`, `trash`, `appliedPacks`, `sourceNote`, …)

This project currently has comments but may be missing `navigator_workspace`. PostgREST will 404 with PGRST205 until that table exists and the schema cache is reloaded.

## Do

1. Create `public.navigator_workspace` if it does not exist (id text PK, payload jsonb not null, updated_at timestamptz default now()).
2. Enable RLS. Add **no** anon or authenticated policies. The Express server uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS.
3. `notify pgrst, 'reload schema';` after creating the table.
4. If the workspace row is missing, insert the skeleton payload from `sql/003_merge_catalog.sql` (providers array empty), then append providers from the `sql/003/p*.sql` batches until all 273 ids are present (original six-country workbook + NL consumer credit + Europe mining).
5. If the workspace row already exists, **append only missing provider ids**. Do not overwrite existing providers. Do not replace the whole payload. Append pack ids `nl-consumer-credit-2026-09-19-v1` and `mining-solutions-europe-2026-09-19-v1` to `appliedPacks` via `sql/003/z_apply.sql`.
6. Keep `trash`, `favorites`, comments, and countries untouched.

## Do not

- Do not create `providers`, `entries`, `loans`, `mining`, `products`, or similar tables.
- Do not alter `navigator_comments` or `navigator_countries`.
- Do not drop RLS or add anon policies.
- Do not replace JSON null amount/age/BKR values with 0, unlimited, age 18, “no maximum age”, or “no BKR”.
- Do not delete `publicationStatus: "review_hold"` (12 editorial records) or `"legacy"` (11 existing-only records). The app hides them from public new-offer results.
- Do not treat comparison platforms or brokers as lenders; they are category `Aggregators`.
- Do not reconstruct provider objects from memory. Run the SQL files as written.
- Do not open, paste, or execute more than one `sql/003/p*.sql` file in a single turn.

## Mapping already applied in the SQL payload

NL consumer-credit snapshot 19 September 2026, 134 records, origin `nl-consumer-credit/1.0`:

- Upsert key: `id`
- Open/primary products → Netherlands `Listed`
- Review holds → `Check` + `publicationStatus: review_hold`
- Closed/legacy → `Restricted` + `publicationStatus: legacy`
- Amounts keep `amount_basis` (credit limit vs purchase value vs mortgage principal vs monthly entitlement)
- Application age kept separate from repayment age
- Brokers/comparisons → `Aggregators`

Europe mining, origin `mining-solutions-europe/1.0`: GoMining (GREEN, instant_fast), BitFuFu (YELLOW, daily_threshold), Bitdeer (YELLOW, pool_threshold), NiceHash (GREEN_YELLOW, instant_fast). All six countries `Check`.

## Execute

Run these files **one per turn** in the SQL editor. Wait for success before opening the next file. Do not load the next batch into context until the current statement finishes.

1. `sql/003_merge_catalog.sql` — table + empty workspace row (skip insert if the row already exists)
2. `sql/003/p01.sql`, `p02.sql`, … in numeric order until the last `p*.sql` — 10 providers per file, idempotent
3. `sql/003/z_apply.sql` — pack ids + schema reload
4. `sql/003/z_verify.sql` — counts

If you are in the SQL editor (not the agent), you may run several `p*.sql` files in one paste. The agent must not.

Expected on a first insert of the seed: 273 providers, 134 NL credit, 4 mining, 12 review-hold, 11 legacy, both new pack ids present.

If the table was just created, reload the API schema cache (`NOTIFY` is already in the SQL). Confirm `GET /rest/v1/navigator_workspace?id=eq.nl-de-nordics-2026-v1` no longer returns PGRST205.

Return only: whether the table was created or already existed, whether the row was inserted or merged, the verification counts, and confirmation that comment tables were not changed.

---

Companion files: `sql/003_merge_catalog.sql`, then every `sql/003/p*.sql` in numeric order, then `sql/003/z_apply.sql` and `sql/003/z_verify.sql`.

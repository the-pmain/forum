# Financial Navigator

Full-stack port of the six-country cards and small-credit directory. The public UI follows the original local HTML workspace. Directory records ship in `data/seed.json` (server + client). Comments go through Express to Postgres via Supabase PostgREST when configured.

## Stack

- One Node 20+ ESM TypeScript repo
- React 19, Vite, React Router (`BrowserRouter` / `StaticRouter`)
- Tailwind CSS v4 via `@tailwindcss/vite`
- Custom i18n (React context + `en` / `nl` / `de` locale files)
- Same-origin `fetch` to `/api`
- Vite prerenders public pages to static HTML, then hydrates
- Express 5, `tsx`, `cookie-parser`, HMAC admin cookie, in-memory rate limits
- Vite proxies `/api` → Express `:3001` in development
- Express serves `dist` + `/api` in production
- Optional Postgres through Supabase PostgREST (HTTP, no `supabase-js`)
- `pdf-lib`, `pdfjs-dist`, and `docx` for directory exports

## Scripts

```bash
npm install
cp .env.example .env
npm run dev          # API :3001 + Vite :5173
npm run build        # typecheck, Vite build, SSG
npm start            # production: Express serves dist + /api
```

## Railway

The service is a single Express process: Railpack runs `npm run build`, then `npm start` serves `dist` and `/api` on `0.0.0.0:$PORT`. `dist` is produced at build time and copied into the runtime image; it is not committed. Do not set `RAILPACK_SPA_OUTPUT_DIR` or Railway will serve the UI with Caddy and drop `/api`.

In the Railway service, set:

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | yes | Random string, 24+ characters |
| `ADMIN_PIN` | yes | Four digits for `/admin`. Not a trivial sequence in production. |
| `SUPABASE_URL` | yes for comments | Project URL, with or without `/rest/v1` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for comments | Server-only; never the anon key |
| `NODE_ENV` | set by Railway | `production` |

Without Supabase the directory still boots from `data/seed.json`. Comments need the comments table. Health check: `GET /api/health`.

## Admin

Set `SESSION_SECRET` and `ADMIN_PIN` (four digits). Open **Admin** and enter the PIN on the keypad. Visitors can browse, filter, save a local shortlist, and export CSV / PDF / DOCX. Verify, hide, add, edit, remove, import, and admin comment replies need the admin cookie. Hidden entries stay in server memory and are omitted for visitors; the admin still sees them marked Hidden. Verified entries stay in the app, not in Postgres.

## Data

`data/seed.json` is the six-country workbook plus later packs:

- Netherlands consumer-credit catalogue, 19 September 2026 (`nl-consumer-credit/1.0`, 134 records). Review-hold and legacy/existing-only records stay out of public new-offer results. Brokers and comparison sites map to Compare & arrange, not to lenders.
- Finland, Sweden, Norway, Denmark and Germany consumer-credit catalogue, 19 September 2026 (`europe-consumer-credit/1.0`, 210 records). Amounts stay in the record currency. `hold_*` records stay in the editorial queue. Brokers are not lenders.
- Europe mining solutions, 19 September 2026 (GoMining, BitFuFu, Bitdeer, NiceHash). Country availability starts as Check.

Rebuild packs with `npm run catalog`. Listed is not approval. This app does not submit credit applications.

## Supabase

Supabase is only for public comments (`sql/002_comments.sql`, then `sql/004_comments_admin.sql` for `is_admin` / `parent_id`). Directory entries are not stored there. `navigator_workspace` is unused; you can leave the empty table or ignore it.

Paste-ready agent prompt for the current schema: `sql/SUPABASE_AGENT_PROMPT.md`.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for comments. The catalogue always loads from `data/seed.json` in the app.

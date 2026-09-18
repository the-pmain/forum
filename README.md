# Financial Navigator

Full-stack port of the six-country cards and small-credit directory. The public UI follows the original local HTML workspace. Writes go through Express to Postgres via Supabase PostgREST when configured.

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

The service is a single Express process: Railpack runs `npm run build`, then `npm start` serves `dist` and `/api` on `0.0.0.0:$PORT`. `RAILPACK_NO_SPA=1` stops Railpack from treating the Vite app as a static Caddy site.

In the Railway service, set:

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | yes | Random string, 24+ characters |
| `ADMIN_PASSWORD` | yes | Admin sign-in at `/admin` |
| `SUPABASE_URL` | yes for persistence | Project URL, with or without `/rest/v1` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for persistence | Server-only; never the anon key |
| `NODE_ENV` | set by Railway | `production` |

Without Supabase the directory still boots from `data/seed.json`, but every deploy wipes writes and comments (unless the comments table exists and Supabase is configured). Health check: `GET /api/health`.

## Admin

Set `SESSION_SECRET` and `ADMIN_PASSWORD`. Sign in at `/admin`. Visitors can browse, filter, save a local shortlist, and export CSV / PDF / DOCX. Shared add / edit / delete / import requires the admin cookie.

## Supabase

Run `sql/001_schema.sql`, then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Without them the server keeps the seed workspace in memory.

## Data

`data/seed.json` is extracted from `Financial_Navigator_Cards_and_Small_Credit.html` (135 providers, six countries). Listed is not approval. This app does not submit credit applications.

# IPO GMP Tracker

Production-oriented IPO grey market intelligence app with a strict TypeScript backend and frontend.

## Architecture

```text
IPOTrackr HTML → single-run TypeScript scraper → Convex → Express API → React dashboard
```

- `backend/`: Express 5 + TypeScript API on port `8001`.
- `scraper/`: native fetch + Cheerio one-shot scraper, independent of the API server.
- `convex/`: schema, current IPO queries/upserts, and GMP history queries.
- `frontend/`: Vite + React 19 + strict TypeScript, proxied to `/api` during development.

Convex is the production source of truth. MongoDB and Python are not used by the application.

## Commands

```bash
npm install
cd frontend && yarn install && cd ..
npm run build
npm start
npm run scrape
```

- `npm run build` builds the Vite frontend and compiles the backend/scraper to `dist-server/`.
- `npm start` starts the compiled Express API and serves `frontend/dist` when present.
- `npm run scrape` performs exactly one scrape, upserts Convex records, logs counts, and exits.
- `npm run dev:server` runs the TypeScript API with watch mode on port `8001`.

## API convention

All backend routes are under `/api`:

- `GET /api/health`
- `GET /api/ipos`
- `GET /api/ipos/:id`

Frontend requests must use the typed helpers in `frontend/src/lib/api.ts` with relative paths. TanStack Query owns reads and polling; React never contacts IPOTrackr or Convex directly.

## Environment

Copy `.env.example` values into the server environment. `CONVEX_SITE_URL` and `CONVEX_APP_TOKEN` remain server-only and must never use a `VITE_` prefix. `CORS_ORIGINS` is a comma-separated allowlist.

Without Convex credentials, `/api/ipos` returns a deliberate `available: false` response and the dashboard shows its unavailable-data state. No fake IPOs are substituted.

## Verification

```bash
cd frontend && yarn typecheck
npm run build
curl http://localhost:8001/api/health
```

The production deployment and Convex setup are documented in `DEPLOYMENT.md`; the living product contract is in `memory/SPEC.md`.
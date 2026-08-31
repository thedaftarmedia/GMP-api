# IPO GMP Tracker deployment

## Architecture

`IPOTrackr HTML → scraper/index.ts → Convex ipos + gmpHistory → FastAPI /api → Vite React dashboard`

The scraper is a single-run process. It does not start an HTTP server and does not schedule itself. Render Cron starts `npm run scrape` every 30 minutes. The web process is independent and runs FastAPI; when `frontend/dist` exists, the FastAPI middleware serves the Vite build while leaving `/api/*` on the API router.

## Environment variables

Set these server-side only:

| Variable | Required | Purpose |
|---|---:|---|
| `CONVEX_SITE_URL` | Yes for live data | Convex deployment site URL used by FastAPI and the scraper |
| `CONVEX_APP_TOKEN` | Yes for live data | Shared server-to-server token checked by Convex functions |
| `IPO_SOURCE_URL` | No | Defaults to `https://ipotrackr.davincin.eu.org/` |
| `MONGO_URL` | Existing local fallback | Existing FastAPI template configuration |
| `DB_NAME` | Existing local fallback | Existing FastAPI template configuration |
| `CORS_ORIGINS` | Recommended | Comma-separated frontend origins |

Never prefix Convex credentials with `VITE_` and never put them in browser code.

## Convex setup

1. Create a Convex project and authenticate locally: `npx convex dev`.
2. Set the server-only token in the Convex deployment: `npx convex env set CONVEX_APP_TOKEN <random-secret>`.
3. Deploy schema and functions: `CONVEX_DEPLOY_KEY=<deploy-key> npx convex deploy`.
4. Put the production site URL and the same app token into both the Render Web Service and Render Cron Job environments.

## Render Web Service

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `PORT` is supplied by Render; add `CONVEX_SITE_URL`, `CONVEX_APP_TOKEN`, `IPO_SOURCE_URL`, `MONGO_URL`, `DB_NAME`, and `CORS_ORIGINS`.

## Render Cron Job

- Build command: `npm install`
- Command: `npm run scrape`
- Schedule: `*/30 * * * *`
- Environment: `CONVEX_SITE_URL`, `CONVEX_APP_TOKEN`, and optionally `IPO_SOURCE_URL`.

## Local commands

```bash
npm install
cd frontend && yarn install && cd ..
npx convex dev
npm run build
npm run scrape
npm start
```

With no Convex credentials, the web API intentionally returns an explicit unavailable-data response and `npm run scrape` exits non-zero without writing anything. This preview therefore contains no fake IPO rows.
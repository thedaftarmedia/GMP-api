# IPO GMP Tracker living spec

## What it does

IPO GMP Tracker is a dark financial dashboard for validated current IPO grey market data. It presents Mainboard and SME records, status counts, GMP and estimated listing values, expected profit/loss, subscription, issue size, lot size, bidding period, source links, and actual database update timestamps.

## Data model

- `ipos`: one Convex document per IPO, keyed by Convex `_id` and deduplicated by stable `sourceId`. It stores the latest normalized fields, category, status, active flag, and scrape/update timestamps.
- `gmpHistory`: separate Convex documents keyed to the IPO and source ID. A history row is created only when GMP or GMP percentage changes.
- `lastSeenAt` and `active` are retained so a transient source failure never deletes or archives current data.

## Data flow

`https://ipotrackr.davincin.eu.org/` → server-only Cheerio parser → normalized records → Convex upsert/history mutation → FastAPI API → TanStack Query dashboard.

The source currently renders semantic IPO cards rather than a literal HTML table. The parser discovers those `article[itemtype*="FinancialProduct"]` cards, reads their metadata and labels, detects status from section headings, and detects SME from the source badge.

## Key flows

- The dashboard shell renders immediately, then shows skeleton rows while `/api/ipos` loads.
- Missing Convex configuration renders a clear unavailable-data state; it never injects fake IPO data.
- Search, category/status filters, sorting, retry, and horizontal table scrolling operate entirely in the frontend over API data.
- Render Cron runs `npm run scrape` once every 30 minutes; there is no scraper timer and no browser scraping.

## API

- `GET /api/health` → `{ "status": "ok" }`
- `GET /api/ipos` → grouped `mainboard` and `sme` arrays with `available` state
- `GET /api/ipos/{id}` → one IPO document, or a clean 404/503 response

## Auth

There is no user authentication or gated area. Convex access is server-to-server using `CONVEX_APP_TOKEN`; the browser only calls FastAPI.

## Current deployment limitation

The preview has no Convex deployment credentials. Live scrape writes and populated API records require setting `CONVEX_SITE_URL` and `CONVEX_APP_TOKEN` in the web and cron environments, deploying the Convex functions, and running the cron command once.
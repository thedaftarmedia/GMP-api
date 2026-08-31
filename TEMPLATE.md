# IPO GMP Tracker context capsule

## Runtime

- Backend: Express 5 + strict TypeScript, source at `backend/server.ts`, port `8001`.
- Frontend: Vite + React 19 + Tailwind v4, source at `frontend/src`, port `3000`.
- Vite proxies `/api/*` to port `8001`; browser calls stay relative through `frontend/src/lib/api.ts`.
- Production build output: frontend at `frontend/dist`, backend/scraper at `dist-server`.
- `npm start` runs `dist-server/backend/server.js` and Express serves the frontend build.

## Backend pattern

- Mount every API router beneath `/api` in `backend/server.ts`.
- Define hand-written API interfaces in `backend/types/` and keep their matching frontend interfaces in sync in the same edit.
- Convex calls live in `backend/services/convex.ts`; credentials are never returned to the browser.
- Keep API errors generic and preserve the explicit unavailable state when Convex is not configured.
- The backend is TypeScript-only. Do not reintroduce Python, FastAPI, Mongo, or JSON persistence.

## Frontend pattern

- `frontend/src/main.tsx` already mounts QueryClientProvider and BrowserRouter.
- Pages live in `frontend/src/pages/*.tsx`; routes live in `frontend/src/App.tsx`.
- Use TanStack Query rather than fetch-in-effect and relative `apiGet`/mutation helpers rather than direct fetch calls.
- Every interactive and user-facing element uses a unique kebab-case `data-testid`.
- Installed UI includes shadcn button, card, input, label, select, dialog, sheet, tabs, badge, calendar, sonner, textarea, table, popover, dropdown-menu, and checkbox.

## Scraper

- `runIPOScraper()` is exported by `scraper/index.ts`.
- `npm run scrape` performs one source fetch, parses semantic IPO cards with Cheerio, validates/normalizes records, upserts Convex, records changed GMP observations, and exits.
- Never add an internal timer or browser scraping. Render Cron owns the `*/30 * * * *` schedule.

## Commands

```bash
npm run dev:server
yarn --cwd frontend dev
cd frontend && yarn typecheck
npm run build
npm run scrape
```

## Configuration

Server-only variables: `CONVEX_SITE_URL`, `CONVEX_APP_TOKEN`, `IPO_SOURCE_URL`, `CORS_ORIGINS`, `PORT`. The preview currently has no Convex credentials, so populated data and write verification remain blocked until they are provided.
# PennyBid

PennyBid is a procurement tender dashboard with an Angular frontend and an Express/MongoDB API. Procurement teams can create and monitor tenders, while vendors can submit bids and see ranked activity update live.

## Technology

- Angular 22 frontend
- Node.js and Express API
- MongoDB Atlas with Mongoose
- Render-ready backend configuration
- Vercel-ready frontend configuration

## Local setup

Requirements: Node.js 22 or newer, npm, and a MongoDB connection string.

1. Install dependencies:

   ```bash
   npm --prefix backend ci
   npm --prefix frontend ci
   ```

2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`. Keep `MONGODB_DB_NAME=pennybid` unless you intentionally use a different database.

3. Optionally seed an empty database:

   ```bash
   npm run seed
   ```

4. Start the API and frontend in separate terminals:

   ```bash
   npm start
   npm run start:frontend
   ```

The frontend runs at `http://localhost:4200`; the API runs at `http://localhost:3000`. The API health check is available at `http://localhost:3000/api/health`.

## Verification

Run all automated tests, the production frontend build, and production dependency audits from the repository root:

```bash
npm test
npm run build
npm run audit:production
```

## Deploy the API to Render

The root `render.yaml` defines the `pennybid-api` web service.

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, create a Blueprint from the repository.
3. Set the secret `MONGODB_URI` to the verified Atlas connection string.
4. Set `FRONTEND_URL` to the final Vercel origin, for example `https://pennybid.vercel.app`. Multiple allowed origins may be supplied as a comma-separated list.
5. Deploy and verify both `/` and `/api/health` on the Render service URL.

Do not commit `backend/.env` or database credentials. Atlas must allow network access from the deployed service.

## Deploy the frontend to Vercel

1. In `frontend/src/environments/environment.ts`, set `apiUrl` to the deployed Render API URL followed by `/api`.
2. Commit and push that production URL.
3. Import the repository in Vercel and set the **Root Directory** to `frontend`.
4. Vercel detects Angular; `frontend/vercel.json` supplies the production output directory and SPA route fallback.
5. Deploy, then update Render's `FRONTEND_URL` with the exact Vercel production origin.
6. Verify dashboard loading, tender creation, tender detail navigation, bidding, polling, and a direct refresh of a tender detail URL.

## Root scripts

- `npm start` — start the backend
- `npm run start:frontend` — start the Angular development server
- `npm run seed` — safely seed an empty database
- `npm test` — run backend and frontend tests
- `npm run build` — create the Angular production build
- `npm run audit:production` — audit production dependencies

## Production configuration

| Setting | Location | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Render secret | MongoDB Atlas connection |
| `MONGODB_DB_NAME` | Render environment | Database name (`pennybid`) |
| `FRONTEND_URL` | Render environment | Restricts API CORS to the deployed frontend |
| `PORT` | Set automatically by Render | API listener port |
| `apiUrl` | Angular production environment | Deployed Render API base URL ending in `/api` |

## Repository layout

```text
backend/     Express API, MongoDB models, seed command, and API tests
frontend/    Angular application, component/service tests, and Vercel config
render.yaml  Render Blueprint for the API
```

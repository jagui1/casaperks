# CasaPerks

A points-based resident rewards dashboard for property management. Residents can view their points balance, transaction history, and redeem points for gift cards from a curated catalog. (Full spec: [docs/specification.md](docs/specification.md).)

## Current state

- **Phase 1 (done):** Monorepo scaffold, Express server, React + Vite + Tailwind client, single `npm start`, mock data, and a static app shell with sidebar layout and stub pages (Login, Dashboard, History, Rewards).
- **Phase 2 (done):** Backend API returning mock data — no auth yet. Implemented:
  - `GET /health` — server health check
  - `GET /api/gift-cards` — full gift card catalog
  - `GET /api/me` — resident profile (hard-coded to first resident)
  - `GET /api/transactions` — paginated transaction history for that resident, with Zod-validated query params (`page`, `limit`)
- **Not yet:** Phase 3 (JWT login, protected routes), Phase 4 (live dashboard/transactions/rewards UI, redemption flow).

## Prerequisites

- **Node.js** ≥ 18 (needed for Vite and the test runner)
- **npm** ≥ 9

## Setup

```bash
git clone <repo-url> casaperks
cd casaperks
npm install
```

Create a `.env` file at the repo root (used in Phase 3 for JWT):

```bash
echo "JWT_SECRET=replace_with_a_long_random_secret" > .env
```

## Running the app

From the monorepo root:

```bash
npm start
```

- **Backend:** http://localhost:3001  
- **Frontend:** http://localhost:5173  

Stop with `Ctrl+C`.

To run only the server or only the client:

```bash
npm run dev --workspace=server   # port 3001
npm run dev --workspace=client   # port 5173
```

## API (no auth in current build)

| Method | Route | Description |
|--------|--------|-------------|
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/api/gift-cards` | Gift card catalog (array of `{ id, brand, pointCost }`) |
| GET | `/api/me` | Resident profile (hard-coded user; no `passwordHash` in response) |
| GET | `/api/transactions?page=1&limit=10` | Paginated transactions; `page` ≥ 1, `limit` 1–50 |

## Tests

Server tests lock in API contracts and validation so later phases (auth, redemption) don’t break existing behavior.

From the repo root:

```bash
npm test
```

From the server package:

```bash
cd server && npm test
```

Tests live in `server/test/`: API contract tests, mock data shape tests, and validation middleware tests.

## Project layout

```
casaperks/
├── package.json          # Workspaces, npm start, npm test
├── .env                  # JWT_SECRET (Phase 3)
├── client/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx       # Routes
│   │   ├── components/   # Layout, etc.
│   │   └── pages/        # Login, Dashboard, Transactions, Rewards (stubs)
│   └── ...
├── server/               # Express API
│   ├── src/
│   │   ├── app.js        # Express app factory (used by index + tests)
│   │   ├── index.js     # Start server
│   │   ├── data/        # mockData.js (residents, transactions, giftCards)
│   │   ├── middleware/  # validate.js (Zod)
│   │   ├── routes/      # giftCards, me, transactions
│   │   └── schemas/     # transactionSchemas.js
│   └── test/            # API, mockData, validate tests
└── docs/
    ├── specification.md
    └── TODO.md          # Phase checklist
```

## Roadmap

See [docs/TODO.md](docs/TODO.md) for the full phase list. Next up: **Phase 3** (JWT login, auth middleware, protected routes, login UI, logout, admin stub), then **Phase 4** (live dashboard/transactions/rewards pages and redemption flow).

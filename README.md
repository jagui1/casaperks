# CasaPerks

A points-based resident rewards dashboard for property management. Residents can view their points balance, transaction history, and redeem points for gift cards from a curated catalog. (Full spec: [docs/specification.md](docs/specification.md).)

## Current state

- **Phase 1 (done):** Monorepo scaffold, Express server, React + Vite + Tailwind client, single `npm start`, mock data, and app shell with sidebar layout and pages (Login, Dashboard, History, Rewards, Admin placeholder).
- **Phase 2 (done):** Backend API with mock data: `GET /health`, `GET /api/gift-cards`, `GET /api/me`, `GET /api/transactions` (paginated, Zod-validated query params).
- **Phase 3 (done):** JWT authentication: `POST /api/auth/login`, auth middleware protecting all non-login API routes, `/api/me` and `/api/transactions` scoped to the authenticated user, login UI with AuthContext and Axios client, logout, and admin stub (admin users see “Admin portal coming soon” and do not see resident dashboard/history/rewards).
- **Not yet:** Phase 4 (live dashboard/transactions/rewards UI with real data, redemption flow and `POST /api/redemptions`).

## Prerequisites

- **Node.js** ≥ 18 (needed for Vite and the test runner)
- **npm** ≥ 9

## Setup

```bash
git clone <repo-url> casaperks
cd casaperks
npm install
```

Create a `.env` file at the repo root (required for JWT signing):

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

## Login

Use these mock accounts (username / password):

| Username           | Password      | Role     |
|--------------------|---------------|----------|
| `nate.craddock`    | `resident16`  | resident |
| `jeremy.aguillon`  | `resident17`  | resident |
| `admin`            | `admin@casa1` | admin    |

Residents see Dashboard, History, and Rewards. Admins see the “Admin portal coming soon” placeholder. Unauthenticated users are redirected to the login page.

## API

| Method | Route | Auth | Description |
|--------|--------|------|-------------|
| GET | `/health` | No | `{ "status": "ok" }` |
| POST | `/api/auth/login` | No | Body: `{ username, password }`. Returns `{ token }` or 401. |
| GET | `/api/gift-cards` | Yes | Gift card catalog (array of `{ id, brand, pointCost }`) |
| GET | `/api/me` | Yes | Profile for the authenticated user (no `passwordHash`) |
| GET | `/api/transactions?page=1&limit=10` | Yes | Paginated transactions for the authenticated user; `page` ≥ 1, `limit` 1–50 |
| POST | `/api/redemptions` | Yes | Stub (501); full redemption logic in Phase 4 |

Protected routes require header: `Authorization: Bearer <token>`.

## Tests

Server tests cover API contracts, mock data shape, validation middleware, and authentication (login, JWT middleware, protected routes, user scoping).

From the repo root:

```bash
npm test
```

From the server package:

```bash
cd server && npm test
```

Tests live in `server/test/`: `api.test.js`, `auth.test.js`, `mockData.test.js`, `validate.test.js`.

## Project layout

```
casaperks/
├── package.json          # Workspaces, npm start, npm test
├── .env                  # JWT_SECRET (required for auth)
├── client/               # React + Vite + Tailwind
│   └── src/
│       ├── App.jsx       # Routes, RequireAuth
│       ├── api/          # client.js (Axios + auth header)
│       ├── context/      # AuthContext.jsx
│       ├── components/   # Layout (sidebar, logout)
│       └── pages/        # Login, Dashboard, Transactions, Rewards, Admin
├── server/               # Express API
│   ├── src/
│   │   ├── app.js        # Express app factory
│   │   ├── index.js      # Start server (loads .env)
│   │   ├── data/         # mockData.js
│   │   ├── middleware/   # authMiddleware.js, validate.js
│   │   ├── routes/       # auth, giftCards, me, transactions, redemptions (stub)
│   │   └── schemas/      # authSchemas.js, transactionSchemas.js
│   └── test/             # api, auth, mockData, validate
└── docs/
    ├── specification.md
    └── TODO.md           # Phase checklist
```

## Roadmap

See [docs/TODO.md](docs/TODO.md) for the full phase list. Next up: **Phase 4** (live dashboard/transactions/rewards pages, redemption confirmation modal, `POST /api/redemptions` implementation, and wiring redemption result back to the UI).

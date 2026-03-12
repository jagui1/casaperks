# CasaPerks Resident Rewards Dashboard — Software Specification

**Version:** 1.0  
**Date:** March 11, 2026  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Users & Roles](#3-users--roles)
4. [Functional Requirements](#4-functional-requirements)
5. [Security Considerations](#5-security-considerations)
6. [API Endpoints](#6-api-endpoints)
7. [Data Model (Mock)](#7-data-model-mock)
8. [UI / UX Wireframes](#8-ui--ux-wireframes)
9. [Folder & Project Structure](#9-folder--project-structure)
10. [Tech Stack](#10-tech-stack)
11. [Running the Application](#11-running-the-application)
12. [Future Enhancements / Out of Scope](#12-future-enhancements--out-of-scope)

---

## 1. Overview

CasaPerks is a points-based loyalty platform for residential property management. Residents earn points for positive behaviors (on-time rent, referrals, community engagement) and redeem them for gift cards from a curated catalog.

This specification describes a small, self-contained web application that demonstrates the core resident-facing experience: viewing a points balance, reviewing transaction history, and redeeming points for gift cards. The app runs as a monorepo with a single startup command and uses mock in-memory data in place of a live database.

---

## 2. Goals & Non-Goals

### Goals

- Provide a working, demonstrable rewards dashboard for residents
- Implement JWT-based multi-user authentication (resident and admin roles)
- Allow points redemption with balance enforcement (no negative balances)
- Keep the security model lightweight but meaningful via input validation (Zod)
- Run the full stack with a single command (`npm start` from the monorepo root)

### Non-Goals

- No real database — all data lives in server memory and resets on restart
- No gift card code generation — redemption only deducts points and records the transaction
- No payment processing or external integrations
- No email/SMS notifications
- No admin UI — admin role is defined in mock data but no admin-specific interface is built in v1

---

## 3. Users & Roles

| Role      | Description                                                                 |
|-----------|-----------------------------------------------------------------------------|
| `resident` | A property tenant. Can view their own dashboard, transaction history, and redeem points. Cannot access other residents' data. |
| `admin`    | A property manager. Authenticated the same way as a resident. Reserved for future use — no special UI in v1. |

### Mock Users (seed data)

| Username         | Password      | Role      | Starting Points |
|------------------|---------------|-----------|-----------------|
| `nate.craddock`  | `resident16`  | resident  | 1,450           |
| `jeremy.aguillon`| `resident17`  | resident  | 320             |
| `admin`          | `admin@casa1` | admin     | N/A             |

> Passwords are stored as bcrypt hashes in the mock data file — never as plaintext.

---

## 4. Functional Requirements

### 4.1 Authentication

- **Login:** A user submits a username and password. The server validates credentials and returns a signed JWT access token.
- **Token usage:** All protected routes require a valid `Authorization: Bearer <token>` header.
- **Token expiry:** Tokens expire after 1 hour.
- **Logout:** Handled client-side by discarding the token from memory/state (no server-side session to invalidate in v1).
- **Role in token:** The JWT payload includes `userId`, `username`, and `role`.

### 4.2 Resident Dashboard

- Displays the authenticated resident's:
  - Full name and unit number
  - Current points balance (prominently displayed)
  - A summary of their last 5 transactions

### 4.3 Transaction History

- Full paginated list of the resident's point transactions
- Each transaction shows:
  - Date
  - Description (e.g. "On-time rent — February", "Redeemed: Amazon Gift Card")
  - Points earned (positive) or spent (negative, shown in red)
  - Running balance is not shown per-row — only the current total is authoritative

### 4.4 Gift Card Catalog

- Displays all available gift cards from the catalog
- Each card shows:
  - Brand name and logo placeholder
  - Point cost
  - A "Redeem" button
- If the resident has insufficient points, the "Redeem" button is disabled with a tooltip explaining why

### 4.5 Redemption Flow

1. Resident clicks "Redeem" on a gift card
2. A confirmation modal appears: _"Redeem [Brand] Gift Card for [X] points?"_
3. On confirmation, the client calls `POST /api/redemptions`
4. The server:
   - Validates the request body with Zod
   - Verifies the resident has enough points
   - Deducts the points from the resident's balance
   - Records a new transaction of type `redemption`
   - Returns the updated balance
5. On success, the dashboard reflects the new balance immediately
6. On failure (insufficient points or invalid input), an error message is shown inline — no modal crash

### 4.6 Admin Role (Stub)

- Admin users can log in successfully
- The server correctly identifies them via the JWT `role` field
- No admin-specific UI exists in v1 — admin users see an "Admin portal coming soon" placeholder after login

---

## 5. Security Considerations

### 5.1 Authentication — JWT

- Tokens are signed with a secret (`JWT_SECRET`) loaded from an `.env` file (not hardcoded)
- Algorithm: `HS256`
- Payload: `{ userId, username, role, iat, exp }`
- The server rejects expired or malformed tokens with `401 Unauthorized`
- Residents cannot access or modify another resident's data — the `userId` in the token is the authoritative identity; the server never trusts a `userId` from the request body

### 5.2 Input Validation — Zod

All request bodies and query parameters on protected routes are validated server-side using Zod schemas before any business logic executes. Validation failures return `400 Bad Request` with a structured error response.

Key schemas:

| Route                  | Validated Fields                        |
|------------------------|-----------------------------------------|
| `POST /api/auth/login` | `username` (string, min 1), `password` (string, min 1) |
| `POST /api/redemptions`| `giftCardId` (string UUID, required)    |
| `GET /api/transactions`| `page` (int, min 1, optional), `limit` (int, 1–50, optional) |

### 5.3 Additional Lightweight Measures

- **CORS:** Restricted to `http://localhost:5173` (the Vite dev server) in development
- **Rate limiting:** Not implemented in v1 (noted as a future enhancement)
- **Helmet.js:** Applied to set secure HTTP response headers on the Express server
- **No sensitive data in JWT:** Passwords and raw point deltas are never included in the token payload

---

## 6. API Endpoints

All endpoints except `/api/auth/login` require a valid JWT in the `Authorization` header.

| Method | Route                        | Auth Required | Purpose                                                   |
|--------|------------------------------|---------------|-----------------------------------------------------------|
| POST   | `/api/auth/login`            | No            | Validate credentials, return signed JWT |
| GET    | `/api/me`                    | Yes           | Return the authenticated resident's profile and balance |
| GET    | `/api/transactions`          | Yes           | Return paginated transaction history for the current user|
| GET    | `/api/gift-cards`            | Yes           | Return the full gift card catalog |
| POST   | `/api/redemptions`           | Yes           | Redeem a gift card; deducts points if balance is sufficient|

> Response shapes and error envelopes are defined in the implementation — this spec covers routes and purpose only.

---

## 7. Data Model (Mock)

All mock data lives in a single file: `server/src/data/mockData.js`. It is loaded into memory on server start. Mutations (redemptions) update this in-memory object directly and do not persist across restarts.

### Resident

```js
{
  id: "uuid-string",
  username: "jane.doe",
  passwordHash: "$2b$10$...",   // bcrypt hash
  role: "resident",             // "resident" | "admin"
  fullName: "Jane Doe",
  unit: "4B",
  pointsBalance: 1450
}
```

### Transaction

```js
{
  id: "uuid-string",
  residentId: "uuid-string",
  type: "credit" | "redemption",
  description: "On-time rent — February",
  points: 200,                  // positive = earned, negative = spent
  createdAt: "2026-02-01T00:00:00Z"
}
```

### Gift Card

```js
{
  id: "uuid-string",
  brand: "Amazon",
  pointCost: 500,
  imageUrl: null                // placeholder in v1
}
```

---

## 8. UI / UX Wireframes

All views are single-page with React Router handling navigation. The layout is a fixed sidebar on desktop and a bottom nav on mobile.

---

### 8.1 Login Page

```
┌─────────────────────────────────────────┐
│                                         │
│           🏠  CasaPerks                 │
│         Resident Rewards Portal         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Username                         │  │
│  │  [ jane.doe                     ] │  │
│  │                                   │  │
│  │  Password                         │  │
│  │  [ ••••••••••••                 ] │  │
│  │                                   │  │
│  │       [ Log In → ]                │  │
│  │                                   │  │
│  │  ⚠ Invalid credentials           │  │
│  │  (shown on error only)            │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

### 8.2 Dashboard (Main View)

```
┌──────────────┬──────────────────────────────────────────────┐
│  CasaPerks   │                                              │
│  ──────────  │   Good morning, Jane 👋  Unit 4B             │
│  📊 Dashboard│                                              │
│  🧾 History  │  ┌──────────────────────────────────────┐    │
│  🎁 Rewards  │  │   ⭐ YOUR POINTS BALANCE              │   │
│              │  │                                      │   │
│  ──────────  │  │         1,450 pts                    │   │
│  [Log Out]   │  │                                      │   │
│              │  └──────────────────────────────────────┘   │
│              │                                              │
│              │   Recent Activity                            │
│              │  ┌──────────────────────────────────────┐   │
│              │  │ Feb 01  On-time rent — February  +200 │   │
│              │  │ Jan 15  Referral bonus            +500 │   │
│              │  │ Jan 01  On-time rent — January    +200 │   │
│              │  │ Dec 20  Amazon Gift Card          -500 │   │
│              │  │ Dec 01  On-time rent — December   +200 │   │
│              │  │                      [View All →]     │   │
│              │  └──────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────┘
```

---

### 8.3 Transaction History Page

```
┌──────────────┬──────────────────────────────────────────────┐
│  CasaPerks   │  Transaction History                         │
│  ──────────  │                                              │
│  📊 Dashboard│  ┌──────────────────────────────────────┐   │
│  🧾 History  │  │ Date       Description         Points │   │
│  🎁 Rewards  │  │ ────────── ─────────────────── ────── │   │
│              │  │ Feb 01     On-time rent Feb     +200   │   │
│  [Log Out]   │  │ Jan 15     Referral bonus       +500   │   │
│              │  │ Jan 01     On-time rent Jan     +200   │   │
│              │  │ Dec 20     Amazon Gift Card     -500   │   │
│              │  │ Dec 01     On-time rent Dec     +200   │   │
│              │  │ Nov 01     On-time rent Nov     +200   │   │
│              │  │                                        │   │
│              │  │  < Prev    Page 1 of 3    Next >      │   │
│              │  └──────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────┘
```

---

### 8.4 Gift Card Catalog Page

```
┌──────────────┬──────────────────────────────────────────────┐
│  CasaPerks   │  Redeem Points                               │
│  ──────────  │  Your balance: 1,450 pts                     │
│  📊 Dashboard│                                              │
│  🧾 History  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  🎁 Rewards  │  │ [Amazon] │  │ [Target] │  │[Starbucks│  │
│              │  │          │  │          │  │          │  │
│  [Log Out]   │  │  500 pts │  │  300 pts │  │  200 pts │  │
│              │  │ [Redeem] │  │ [Redeem] │  │ [Redeem] │  │
│              │  └──────────┘  └──────────┘  └──────────┘  │
│              │                                              │
│              │  ┌──────────┐  ┌──────────┐                 │
│              │  │  [Visa]  │  │ [iTunes] │                 │
│              │  │          │  │          │                 │
│              │  │ 1000 pts │  │  150 pts │                 │
│              │  │ [Redeem] │  │ [Redeem] │                 │
│              │  │ (disabled│  │          │                 │
│              │  │ tooltip) │  │          │                 │
│              │  └──────────┘  └──────────┘                 │
└──────────────┴──────────────────────────────────────────────┘
```

> Visa card is disabled because 1,000 pts > resident's 1,450 pt balance... wait, this example shows it IS enough. The disabled state appears when `pointCost > balance`.

---

### 8.5 Redemption Confirmation Modal

```
┌─────────────────────────────────────────┐
│                                         │
│   Confirm Redemption                    │
│   ─────────────────                     │
│                                         │
│   You are about to redeem:              │
│                                         │
│       🎁  Amazon Gift Card              │
│           500 points                    │
│                                         │
│   Remaining balance after:              │
│       950 points                        │
│                                         │
│   [ Cancel ]        [ Confirm Redeem ]  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Folder & Project Structure

```
casaperks/
├── package.json                   # Root — defines "start" script using concurrently
├── .env                           # JWT_SECRET (gitignored)
├── .gitignore
│
├── client/                        # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # Router setup
│       ├── api/
│       │   └── client.js          # Axios instance with auth header injection
│       ├── context/
│       │   └── AuthContext.jsx    # JWT storage + login/logout state
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── TransactionsPage.jsx
│       │   └── RewardsPage.jsx
│       └── components/
│           ├── Layout.jsx         # Sidebar + nav shell
│           ├── PointsBadge.jsx
│           ├── TransactionRow.jsx
│           ├── GiftCardCard.jsx
│           └── ConfirmModal.jsx
│
└── server/                        # Node.js + Express backend
    ├── package.json
    └── src/
        ├── index.js               # Entry point — Express app setup
        ├── data/
        │   └── mockData.js        # In-memory residents, transactions, gift cards
        ├── middleware/
        │   ├── authMiddleware.js  # JWT verification middleware
        │   └── validate.js        # Zod validation middleware factory
        ├── routes/
        │   ├── auth.js            # POST /api/auth/login
        │   ├── me.js              # GET /api/me
        │   ├── transactions.js    # GET /api/transactions
        │   ├── giftCards.js       # GET /api/gift-cards
        │   └── redemptions.js     # POST /api/redemptions
        └── schemas/
            ├── authSchemas.js     # Zod schema for login
            ├── redemptionSchemas.js
            └── transactionSchemas.js
```

---

## 10. Tech Stack

| Layer          | Technology                         | Reason                                      |
|----------------|------------------------------------|---------------------------------------------|
| Frontend       | React 18 + Vite                    | Fast dev server, modern component model      |
| Routing        | React Router v6                    | Client-side navigation between dashboard views |
| HTTP Client    | Axios                              | Interceptors for auth header injection       |
| Backend        | Node.js + Express                  | Lightweight, familiar REST server            |
| Authentication | `jsonwebtoken` + `bcryptjs`        | Industry-standard JWT signing; bcrypt for password hashing |
| Validation     | Zod                                | Schema-first, TypeScript-friendly input validation |
| Security headers | `helmet`                         | Minimal effort, meaningful HTTP header hardening |
| Monorepo runner | `concurrently`                   | Single `npm start` command at root          |
| Styling        | Tailwind CSS                       | Utility-first, no design system dependency  |

---

## 11. Running the Application

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# 1. Clone the repo and install all dependencies
git clone <repo-url> casaperks
cd casaperks
npm install              # installs root + workspaces (client + server)

# 2. Create the environment file
echo "JWT_SECRET=replace_this_with_a_long_random_secret" > .env

# 3. Start both client and server
npm start
```

The root `package.json` `start` script uses `concurrently`:

```json
{
  "scripts": {
    "start": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\""
  }
}
```

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:3001    |

### Default Login Credentials

| Username     | Password      | Role     |
|--------------|---------------|----------|
| `jane.doe`   | `resident123` | Resident |
| `mark.smith` | `resident456` | Resident |
| `admin`      | `admin@casa1` | Admin    |

---

## 12. Future Enhancements / Out of Scope

The following items are explicitly out of scope for v1 but are noted here as natural next steps:

### Near-term

- **Persistent database** — Replace in-memory mock with PostgreSQL or SQLite via Prisma
- **Gift card code generation** — Integrate a gift card API (e.g. Tango Card) to issue real codes on redemption
- **Admin dashboard** — UI for admins to manually credit/debit points, view all residents, and manage the catalog
- **Refresh tokens** — Complement short-lived access tokens with a refresh token flow for better UX
- **Rate limiting** — Apply `express-rate-limit` to `/api/auth/login` to prevent brute-force attacks

### Longer-term

- **Points earning rules engine** — Configurable triggers (on-time rent, referrals, maintenance request completion) that auto-credit points
- **Push notifications** — Notify residents when points are credited
- **Audit log** — Immutable record of all point mutations for property manager compliance
- **Multi-property support** — Residents may live across a portfolio; points should be scoped per-property or pooled by configuration
- **SSO / OAuth2** — Integrate with property management platforms (Yardi, AppFolio) for single sign-on

---

*End of specification — CasaPerks Resident Rewards Dashboard v1.0*
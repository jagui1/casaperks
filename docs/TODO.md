# CasaPerks — Implementation TODO

> Tasks are ordered **easy → hard** across four phases. Complete each phase fully before moving to the next — later phases depend on earlier ones being stable.
>
> **Legend:** Each task has a checkbox, a brief description, and an **Acceptance Criteria** block defining exactly what "done" means.

---

## Phase 1 — Project Scaffolding & Static Foundations
*No logic yet. Just get the skeleton running end-to-end.*

---

- [x] **1.1 — Initialize monorepo structure**

  Create the root `casaperks/` folder with `client/` and `server/` subdirectories, a root `package.json` using npm workspaces, a `.gitignore`, and a placeholder `.env` file.

  **Acceptance Criteria:**
  - Root `package.json` declares `"workspaces": ["client", "server"]`
  - `.gitignore` excludes `node_modules/`, `.env`, and `dist/`
  - `.env` file exists at the root with a placeholder `JWT_SECRET=changeme`
  - Running `npm install` from the root installs dependencies for both workspaces without errors

---

- [x] **1.2 — Scaffold the Express server**

  Initialize `server/` with `package.json`, install Express, and create `src/index.js` with a single `GET /health` route that returns `{ status: "ok" }`.

  **Acceptance Criteria:**
  - `npm run dev --workspace=server` starts the server on port `3001`
  - `GET http://localhost:3001/health` returns HTTP `200` with body `{ "status": "ok" }`
  - Server does not crash on startup

---

- [x] **1.3 — Scaffold the React + Vite client**

  Initialize `client/` with Vite's React template. Install Tailwind CSS and configure it. Replace the default `App.jsx` content with a single `<h1>CasaPerks</h1>` placeholder.

  **Acceptance Criteria:**
  - `npm run dev --workspace=client` starts Vite on port `5173`
  - Browser at `http://localhost:5173` renders "CasaPerks" with no console errors
  - Tailwind utility classes (e.g. `className="text-blue-500"`) apply correctly when used

---

- [x] **1.4 — Wire up the single `npm start` command**

  Install `concurrently` at the root and add a `"start"` script that boots both the server and client in parallel.

  **Acceptance Criteria:**
  - Running `npm start` from the monorepo root starts both the server (port `3001`) and the client (port `5173`) in a single terminal
  - Both processes log their startup messages simultaneously
  - Killing the process (`Ctrl+C`) stops both services

---

- [x] **1.5 — Create mock data file**

  Create `server/src/data/mockData.js` with the three in-memory data structures: residents (3 users with bcrypt-hashed passwords), transactions (5–8 entries per resident), and gift cards (5 catalog items).

  **Acceptance Criteria:**
  - File exports `{ residents, transactions, giftCards }` as a single in-memory object
  - Resident passwords are stored as bcrypt hashes — no plaintext passwords appear anywhere in the file
  - All records have a `id` field with a valid UUID string
  - The three mock users match the spec: `jane.doe` (resident, 1450 pts), `mark.smith` (resident, 320 pts), `admin` (admin role)
  - Gift card catalog contains at least 5 entries with `id`, `brand`, and `pointCost` fields

---

- [x] **1.6 — Build the static app shell (Layout + routing)**

  Install React Router v6. Create `Layout.jsx` (sidebar with nav links) and stub-out the four page components: `LoginPage`, `DashboardPage`, `TransactionsPage`, `RewardsPage`. Wire up routes in `App.jsx`.

  **Acceptance Criteria:**
  - Navigating to `/`, `/dashboard`, `/transactions`, and `/rewards` each renders the correct stub page without a blank screen or router error
  - `Layout.jsx` renders a sidebar with visible links to Dashboard, History, and Rewards
  - Clicking each nav link updates the URL and renders the matching page
  - No auth enforcement yet — all routes are publicly accessible at this stage

---

## Phase 2 — Backend API (No Auth Yet)
*Build and verify each API route returning real mock data before adding auth guards.*

---

- [x] **2.1 — `GET /api/gift-cards` — Gift card catalog**

  Create `server/src/routes/giftCards.js` and register it on the Express app. Return the full gift card catalog from mock data.

  **Acceptance Criteria:**
  - `GET http://localhost:3001/api/gift-cards` returns HTTP `200`
  - Response body is a JSON array of all gift card objects, each containing `id`, `brand`, and `pointCost`
  - Returns all 5+ catalog items from mock data
  - Route does not require auth at this stage (auth guard added in Phase 3)

---

- [x] **2.2 — `GET /api/me` — Resident profile**

  Create `server/src/routes/me.js`. For now, hard-code it to return `jane.doe`'s profile (auth-based lookup added in Phase 3).

  **Acceptance Criteria:**
  - `GET http://localhost:3001/api/me` returns HTTP `200`
  - Response body includes `fullName`, `unit`, `pointsBalance`, and `role`
  - Password hash is **not** present in the response body

---

- [x] **2.3 — `GET /api/transactions` — Transaction history with pagination**

  Create `server/src/routes/transactions.js`. Return transactions filtered to `jane.doe` (hard-coded for now) and support `?page=` and `?limit=` query parameters.

  **Acceptance Criteria:**
  - `GET /api/transactions` returns HTTP `200` with a JSON object containing `{ data: [...], page, limit, total }`
  - Default `page` is `1`, default `limit` is `10`
  - `GET /api/transactions?page=1&limit=2` returns at most 2 transactions
  - Transactions are sorted newest-first by `createdAt`
  - Passing `?page=999` returns an empty `data` array with HTTP `200` (not a 404)

---

- [x] **2.4 — Install Zod and create validation middleware**

  Install Zod. Create `server/src/middleware/validate.js` — a middleware factory that accepts a Zod schema, validates `req.body` or `req.query`, and returns `400` on failure.

  **Acceptance Criteria:**
  - `validate(schema)` returns an Express middleware function
  - When the request data matches the schema, `next()` is called and the route proceeds normally
  - When the request data fails validation, the middleware returns HTTP `400` with a JSON body containing a `errors` array with at least one human-readable message
  - The middleware does **not** call `next()` on validation failure
  - Middleware is generic and reusable — it works for both `req.body` and `req.query` depending on a config parameter

---

- [x] **2.5 — Apply Zod validation to `GET /api/transactions`**

  Create `server/src/schemas/transactionSchemas.js` with a Zod schema for the `page` and `limit` query params. Apply the `validate` middleware to the transactions route.

  **Acceptance Criteria:**
  - `GET /api/transactions?page=0` returns HTTP `400` (page must be ≥ 1)
  - `GET /api/transactions?limit=100` returns HTTP `400` (limit must be ≤ 50)
  - `GET /api/transactions?page=abc` returns HTTP `400`
  - `GET /api/transactions?page=2&limit=5` returns HTTP `200` and applies pagination correctly
  - Valid requests with no query params still return HTTP `200` (both params are optional)

---

## Phase 3 — Authentication
*Add JWT login, protect all routes, and scope data to the logged-in user.*

---

- [x] **3.1 — `POST /api/auth/login` — Issue JWT**

  Install `jsonwebtoken` and `bcryptjs`. Create `server/src/routes/auth.js`. Validate credentials against mock data, compare password with bcrypt, and return a signed JWT on success.

  **Acceptance Criteria:**
  - `POST /api/auth/login` with valid credentials returns HTTP `200` and a JSON body containing a `token` string
  - The decoded JWT payload contains `userId`, `username`, and `role`
  - Token expiry is set to 1 hour (`exp` claim)
  - `JWT_SECRET` is read from `process.env.JWT_SECRET` — it is never hardcoded
  - `POST /api/auth/login` with wrong password returns HTTP `401` with a generic `"Invalid credentials"` message (not indicating whether username or password was wrong)
  - `POST /api/auth/login` with a non-existent username returns HTTP `401` with the same generic message
  - Submitting an empty body returns HTTP `400` (Zod validation catches missing fields)

---

- [x] **3.2 — Apply Zod validation to `POST /api/auth/login`**

  Create `server/src/schemas/authSchemas.js` with a Zod schema for `{ username, password }`. Apply the `validate` middleware to the login route.

  **Acceptance Criteria:**
  - `POST /api/auth/login` with `{}` returns HTTP `400` with an errors array mentioning both `username` and `password`
  - `POST /api/auth/login` with `{ username: "", password: "x" }` returns HTTP `400` (min length 1)
  - `POST /api/auth/login` with `{ username: "jane.doe", password: "" }` returns HTTP `400`
  - Valid body with wrong credentials still returns HTTP `401` (validation passes, auth fails)

---

- [x] **3.3 — Build JWT auth middleware**

  Create `server/src/middleware/authMiddleware.js`. Verify the `Authorization: Bearer <token>` header on incoming requests. Attach decoded payload to `req.user` on success.

  **Acceptance Criteria:**
  - Requests with a valid token have `req.user` populated with `{ userId, username, role }`
  - Requests with a missing `Authorization` header return HTTP `401`
  - Requests with a malformed token (e.g. `Bearer not.a.real.token`) return HTTP `401`
  - Requests with an expired token return HTTP `401`
  - The middleware calls `next()` only when the token is valid

---

- [x] **3.4 — Protect all non-login API routes**

  Apply `authMiddleware` to `GET /api/me`, `GET /api/transactions`, `GET /api/gift-cards`, and `POST /api/redemptions` (stub).

  **Acceptance Criteria:**
  - All four protected routes return HTTP `401` when called with no token
  - All four protected routes return HTTP `401` with an expired or invalid token
  - `POST /api/auth/login` remains accessible without a token
  - `GET /health` remains accessible without a token

---

- [x] **3.5 — Scope `GET /api/me` and `GET /api/transactions` to the authenticated user**

  Replace the hard-coded `jane.doe` references in both routes with a lookup using `req.user.userId` from the JWT payload.

  **Acceptance Criteria:**
  - Logging in as `jane.doe` and calling `GET /api/me` returns Jane's profile and balance
  - Logging in as `mark.smith` and calling `GET /api/me` returns Mark's profile and balance
  - `GET /api/transactions` returns only transactions belonging to the authenticated user (not all users' transactions)
  - Mark's transactions do not appear in Jane's history and vice versa
  - The password hash field is never present in any `/api/me` response

---

- [x] **3.6 — Implement login UI and AuthContext on the client**

  Build the `LoginPage.jsx` form. Create `AuthContext.jsx` to store the JWT in React state. Create `api/client.js` (Axios instance) that injects the `Authorization` header on every request automatically.

  **Acceptance Criteria:**
  - The login form has username and password fields and a submit button
  - Submitting valid credentials navigates the user to `/dashboard`
  - Submitting invalid credentials displays an inline error message without crashing or navigating
  - The JWT is stored in React state (not `localStorage`) and is lost on page refresh
  - All subsequent API calls made via the Axios client include the `Authorization: Bearer <token>` header automatically
  - Unauthenticated users who visit `/dashboard` directly are redirected to the login page

---

- [x] **3.7 — Implement logout**

  Add a "Log Out" button to the sidebar in `Layout.jsx` that clears the auth state and redirects to the login page.

  **Acceptance Criteria:**
  - Clicking "Log Out" clears the token from `AuthContext`
  - User is immediately redirected to the login page after logout
  - After logout, navigating back to `/dashboard` redirects to login (token is gone)
  - No token or user data remains in React state after logout

---

- [x] **3.8 — Admin stub: post-login placeholder**

  After a successful login, detect `role === "admin"` in the JWT payload and render an "Admin portal coming soon" placeholder page instead of the resident dashboard.

  **Acceptance Criteria:**
  - Logging in as `admin` / `admin@casa1` shows a placeholder screen with text indicating the admin portal is not yet available
  - Admin users do **not** see the resident dashboard, transaction history, or rewards catalog
  - The Log Out button still works for admin users
  - Resident users (`jane.doe`, `mark.smith`) are unaffected and continue to see the normal dashboard

---

## Phase 4 — Resident Features & Redemption Flow
*Connect the frontend to real data and implement the full redemption feature.*

---

- [x] **4.1 — Dashboard page: live profile and recent transactions**

  Wire `DashboardPage.jsx` to `GET /api/me` and `GET /api/transactions`. Display the resident's name, unit, points balance badge, and last 5 transactions.

  **Acceptance Criteria:**
  - Dashboard shows the authenticated resident's `fullName` and `unit`
  - Points balance is prominently displayed and matches the value from `GET /api/me`
  - The 5 most recent transactions are listed with date, description, and point delta
  - Positive point values are displayed in green; negative values in red
  - A "View All" link navigates to the Transactions page
  - Dashboard shows a loading state while data is being fetched
  - If the API returns an error, a user-facing error message is shown (not a blank screen)

---

- [x] **4.2 — Transaction history page: paginated list**

  Wire `TransactionsPage.jsx` to `GET /api/transactions` with pagination controls.

  **Acceptance Criteria:**
  - Page displays all of the authenticated user's transactions in a table/list
  - Each row shows: date, description, and points (signed and color-coded)
  - "Next" and "Previous" buttons navigate between pages
  - "Previous" is disabled on page 1; "Next" is disabled on the last page
  - Current page number and total count are visible (e.g. "Page 1 of 3")
  - Changing pages fetches fresh data from the server with the correct `?page=` param
  - Loading and error states are handled gracefully

---

- [x] **4.3 — Gift card catalog page: display cards with affordability state**

  Wire `RewardsPage.jsx` to `GET /api/gift-cards` and `GET /api/me`. Render each gift card using `GiftCardCard.jsx` with a "Redeem" button.

  **Acceptance Criteria:**
  - All gift cards from the catalog are displayed with brand name and point cost
  - Resident's current points balance is shown at the top of the page
  - "Redeem" button is **enabled** when `pointCost <= pointsBalance`
  - "Redeem" button is **disabled** when `pointCost > pointsBalance`
  - Hovering over a disabled button shows a tooltip: "Not enough points"
  - Loading state is shown while catalog data is fetching
  - Error state is shown if the API call fails

---

- [x] **4.4 — Redemption confirmation modal**

  Build `ConfirmModal.jsx`. When a resident clicks an enabled "Redeem" button, display the confirmation modal before any API call is made.

  **Acceptance Criteria:**
  - Clicking "Redeem" opens a modal showing the gift card brand, point cost, and projected remaining balance after redemption
  - Projected remaining balance is calculated client-side as `currentBalance - pointCost`
  - Clicking "Cancel" closes the modal and makes no API call
  - Clicking "Confirm Redeem" triggers the redemption API call (implemented in 4.5)
  - Modal can also be dismissed by pressing `Escape` or clicking outside the modal overlay
  - Only one modal can be open at a time

---

- [x] **4.5 — `POST /api/redemptions` — Server-side redemption logic**

  Create `server/src/routes/redemptions.js` and `server/src/schemas/redemptionSchemas.js`. Implement the full redemption business logic.

  **Acceptance Criteria:**
  - `POST /api/redemptions` with a valid `giftCardId` and sufficient balance returns HTTP `200` with the updated `pointsBalance`
  - The resident's `pointsBalance` in mock data is decremented by the gift card's `pointCost`
  - A new transaction record of type `redemption` is appended to the mock data with a negative point value and description `"Redeemed: [Brand]"`
  - If the resident's balance is insufficient, the server returns HTTP `422` with a clear error message — no points are deducted
  - If `giftCardId` does not exist in the catalog, the server returns HTTP `404`
  - Sending a non-UUID string as `giftCardId` returns HTTP `400` (Zod validation)
  - Sending an empty body returns HTTP `400`
  - The `userId` used for the balance check and transaction write comes from `req.user.userId` (the JWT), **never** from the request body

---

- [x] **4.6 — Wire redemption result back to the UI**

  After a successful `POST /api/redemptions`, update the client state so the new balance and new transaction are immediately reflected without a full page reload.

  **Acceptance Criteria:**
  - After a successful redemption, the points balance on the Rewards page updates immediately to the new value returned by the API
  - The confirmation modal closes automatically on success
  - A success message (e.g. "Amazon Gift Card redeemed!") is briefly shown to the user
  - If the API returns a `422` (insufficient points — e.g. race condition), the modal displays an inline error message and does **not** close
  - If the API returns any other error, the modal displays a generic inline error and does **not** close
  - The "Redeem" button for any card that is now unaffordable becomes disabled immediately after the balance updates (no refresh required)

---

- [x] **4.7 — `PointsBadge` component and consistent balance display**

  Ensure the points balance displayed in `Layout.jsx` (sidebar), `DashboardPage`, and `RewardsPage` all use a shared `PointsBadge` component and stay in sync after a redemption.

  **Acceptance Criteria:**
  - `PointsBadge.jsx` is used in at least the sidebar, dashboard, and rewards page
  - After a redemption, the balance updates in **all** locations simultaneously without a page refresh
  - The balance shown in the sidebar always matches the balance shown on the Dashboard and Rewards pages
  - `PointsBadge` renders the point value formatted with comma separators (e.g. `1,450 pts`)

---

*End of TODO — CasaPerks Resident Rewards Dashboard v1.0*
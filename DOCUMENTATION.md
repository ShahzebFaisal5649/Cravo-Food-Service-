# Cravo — Full Project Documentation

Cravo is a full-stack food delivery web app: browse restaurants, customize and order food, pay with a mock card form, track delivery status live, leave reviews, and manage everything through an admin panel.

**This document replaces the old `DOCUMENTATION.md`.** That version described an earlier iteration of the app that ran entirely in the browser against a local IndexedDB "database" (Dexie.js) with no real server. **That is no longer how the app works.** Cravo now has a real backend: Express + MongoDB, JWT authentication, Zod-validated routes, and a proper test suite. This document describes the app as it exists today, file by file and feature by feature, plus a complete end-to-end workflow for every feature.

---

## 1. High-Level Shape of the System

```
Browser (React SPA, Vite dev server :5173)
        │  HTTP/JSON (axios, withCredentials: true)
        ▼
Express REST API (:5000)
        │  Mongoose ODM
        ▼
MongoDB (:27017)
```

- Nothing is server-rendered — Vite serves a single-page app, and every piece of data (restaurants, menu items, orders, users, reviews) comes from API calls.
- The browser **never** talks to MongoDB directly; every read/write goes through the Express API.
- Two separate `package.json`s / `node_modules` exist: the repo root (frontend) and `cravo-server/` (backend). They run as two separate processes in development.

---

## 2. Tech Stack

### Frontend (repo root)
| Concern | Choice |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7, with `React.lazy()` per page |
| Styling | Tailwind CSS v4 (custom `@theme` tokens, dark + light mode) |
| Server-state | TanStack Query v5 (caching, loading/error states, polling, invalidation) |
| Client-state | Zustand v5 (`persist` middleware → `localStorage`) |
| HTTP client | Axios, with a custom instance handling auth headers + silent token refresh |
| Real-time | Socket.IO client — live order-status pushes, with a 30s poll as a fallback |
| E2E testing | Playwright |
| Linting | ESLint 10 |

### Backend (`cravo-server/`)
| Concern | Choice |
|---|---|
| Server framework | Express 5 |
| Real-time | Socket.IO 4 — JWT-authenticated WebSocket layer for live order-status pushes |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT — short-lived access token (15 min) + long-lived httpOnly refresh cookie (30 days) |
| Password hashing | bcryptjs |
| Request validation | Zod (per-route schemas) |
| Security headers | Helmet (sensible defaults, applied globally in `app.js`) |
| Rate limiting | express-rate-limit — `authLimiter` (signup/login) and `writeLimiter` (orders/payments) |
| Logging | morgan (dev, human-readable) / pino-http (production, structured JSON) |
| Testing | Vitest + Supertest + mongodb-memory-server (real Mongoose code path, no real DB needed) |

There is a real backend, real password hashing, and real JWT auth — but this is still a **demo/portfolio project**. Payments are a mock gateway (no real card processor), and a few production-hardening items are called out in [Section 9](#9-known-limitations--things-worth-knowing).

---

## 3. Getting Started

You need **two terminals** (frontend + backend) and a local MongoDB instance.

### Backend
```bash
cd cravo-server
npm install
npm run dev        # nodemon src/server.js — auto-restarts on change
```
Runs on `http://localhost:5000`. Requires `cravo-server/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cravo
JWT_SECRET=<a long random string>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<a different long random string>
REFRESH_TOKEN_EXPIRES_IN=30d
CLIENT_ORIGIN=http://localhost:5173
```
`server.js` **hard-exits immediately** if `JWT_SECRET` is missing — the app refuses to start insecurely rather than silently signing tokens with `undefined`.

### Frontend
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`. Requires a root `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Seeding data
```bash
cd cravo-server
npm run seed
```
Populates 12 restaurants, ~38 menu items, and one admin account. The script checks `Restaurant.countDocuments()` first and **no-ops if any restaurant already exists** — to force a reseed, drop the collections in Compass/mongosh first.

### Demo admin login
- **Email:** `admin@cravo.com`
- **Password:** `admin123`

Any other account is created via Sign Up.

### Scripts reference
| Location | Command | Does |
|---|---|---|
| root | `npm run dev` | Vite dev server |
| root | `npm run build` | production build → `dist/` |
| root | `npm run lint` | ESLint |
| root | `npm run test:e2e` | Playwright, against a live dev server |
| `cravo-server/` | `npm run dev` | nodemon |
| `cravo-server/` | `npm run seed` | seed script |
| `cravo-server/` | `npm test` | Vitest + Supertest + mongodb-memory-server |

---

## 4. Backend — File by File

### 4.1 Entry point (`cravo-server/src/server.js`)
1. Loads `.env` (`dotenv.config()`).
2. Exits the process immediately if `JWT_SECRET` is missing — fail loud, not silent.
3. Registers `unhandledRejection` / `uncaughtException` handlers so a stray async error is logged instead of the process dying invisibly (uncaught exceptions still exit; rejections are just logged).
4. Calls `connectDB()`, then `app.listen(PORT)`.

### 4.2 Database connection (`config/db.js`)
`connectDB()` calls `mongoose.connect(process.env.MONGO_URI)`. On failure it logs the error and `process.exit(1)`s — the server won't run against a broken DB connection.

### 4.3 App / middleware chain (`app.js`)
In order:
1. **CORS** — a custom `origin` function checks the incoming `Origin` header against `CLIENT_ORIGIN` (comma-splittable for multiple allowed origins). Requests with **no** origin header (curl, Postman, server-to-server) are allowed through. `credentials: true` is required so the httpOnly refresh cookie can flow.
2. **`express.json()`** — parses JSON bodies.
3. **`cookieParser()`** — makes `req.cookies.refreshToken` available.
4. **Request logging** — `morgan('dev')` outside production, `pino-http` in production (redacts `Authorization` and `Cookie` headers from logs).
5. **Routes** — everything is mounted under `/api`.
6. Two utility routes outside `/api`: `GET /` (liveness message) and `GET /health` (`{ status: 'ok', uptime }`).
7. **`notFound`** — 404 catch-all for anything unmatched.
8. **`errorHandler`** — converts *any* thrown error into `{ message, stack }` JSON (stack only outside production).

### 4.4 Error handling (`middleware/errorHandler.js`)
`errorHandler` inspects the error shape and produces friendlier messages for common Mongoose failure modes:
- `CastError` with `kind === 'ObjectId'` (e.g. `GET /api/orders/not-an-id`) → 400, `"Invalid ID format: <value>"`.
- `ValidationError` (raw Mongoose schema violations, distinct from Zod) → 400, joined field messages.
- `code === 11000` (unique-index collision, e.g. duplicate email) → 400, `"<field> already in use"`.
- Anything else falls back to whatever status code the controller set (or 500 if it never set one) and `err.message`.

### 4.5 Async error propagation (`middleware/asyncHandler.js`)
Every controller function is wrapped in `asyncHandler(fn)`, which does `Promise.resolve(fn(...)).catch(next)`. Without this, a rejected promise inside an `async` Express handler would crash the process instead of reaching `errorHandler`.

### 4.6 Request validation (`middleware/validate.js` + `*.validation.js`, Zod)
`validate(schema)` returns Express middleware that runs `schema.safeParse(req.body)`:
- On failure → 400 with a human-readable, field-prefixed message (e.g. `"password: Password must be at least 6 characters"`), and the controller is never reached.
- On success → `req.body` is **replaced** with the parsed/coerced data (trimmed strings, defaulted optionals, etc.), so controllers can trust the shape of `req.body`.

Schemas per feature:
- `auth.validation.js` — `signupSchema` (name/email/password, password ≥ 6 chars), `loginSchema`.
- `orders.validation.js` — `placeOrderSchema` (restaurantId, array of line items with optional nullable `variant`, positive integer `quantity`, optional `notes`).
- `admin.validation.js` — `restaurantSchema` / `restaurantUpdateSchema` (`.partial()` of the same schema, so PUT doesn't require every field) / `toggleOpenSchema` / `orderStatusSchema` (enum-restricted to the four valid statuses).
- `menuItems.validation.js` — `menuItemSchema` / `menuItemUpdateSchema`, including a nested `variantSchema` (name + numeric `priceModifier`, defaulting to 0).
- **Reviews has no dedicated Zod schema** — `reviews.controller.js` validates `rating` (1–5) and `comment` (non-empty) inline instead. Functionally fine, just inconsistent with the rest of the codebase's validation pattern.

### 4.7 Authentication middleware (`middleware/auth.js`)
- **`protect`** — reads `Authorization: Bearer <token>`, verifies it against `JWT_SECRET`. On a valid token, loads the user (`.select('-password')`) and attaches it as `req.user`. Distinguishes `TokenExpiredError` (message: "Session expired, please log in again") from any other verification failure (message: "Not authorized, token failed") — both are 401.
- **`admin`** — must run *after* `protect`. Checks `req.user.isAdmin`; if false or missing, 403 `"Not authorized as admin"`.

This is the **real security boundary** — every `/api/admin/*` route runs `router.use(protect, admin)` at the top of `admin.routes.js`, so there is no admin endpoint reachable without a valid token belonging to an actual admin user. The frontend's `RequireAdmin` component is a UX convenience only (it redirects non-admins away from the page) — it provides **zero** actual security, since a user could hit the API directly. The server-side `admin` middleware is what actually enforces this.

### 4.8 Rate limiting (`middleware/rateLimiter.js`)
`authLimiter` — 10 attempts per IP per 15-minute window, applied only to `POST /auth/signup` and `POST /auth/login`. Automatically **disabled when `NODE_ENV === 'test'`**, since the test suite signs up/logs in dozens of times in quick succession from the same IP and would otherwise trip the limiter.

### 4.9 Models (`models/*.js`, Mongoose)
All models share two conventions:
- `timestamps: true` → automatic `createdAt` / `updatedAt`.
- A `toJSON` transform that deletes `_id` and `__v` from the serialized object — meaning **every API response exposes a clean `id` field** (via Mongoose's virtual `id` getter) instead of `_id`. This is why frontend code reads `restaurant.id`, `order.id`, etc.

| Model | Key fields | Notes |
|---|---|---|
| **User** | `name`, `email` (unique, lowercased, trimmed), `password`, `isAdmin` | `pre('save')` hook bcrypt-hashes the password *only if it was modified* (so re-saving a user for unrelated reasons doesn't re-hash an already-hashed password). `matchPassword(entered)` instance method compares via bcrypt. |
| **Restaurant** | `name`, `cuisine`, `isOpen`, `image`, `description`, `address`, `rating`, `deliveryTime`, `minOrder`, `deliveryFee` | `rating` is written by the reviews feature, not user-editable input in the normal flow. |
| **MenuItem** | `restaurantId` (ref), `name`, `category`, `price`, `image`, `description`, `variants: [{ name, priceModifier }]` | |
| **Order** | `userId` (ref), `restaurantId` (ref), `restaurantName` (**snapshotted**, not a live join), `items: [{ itemId, variant, name, price, quantity, notes }]` (**all snapshotted at order time**), `subtotal`, `deliveryFee`, `total`, `status` (enum: `placed`/`preparing`/`on the way`/`delivered`), `deliveryAddress` | This snapshot pattern is deliberate — see [4.11](#411-order-placement--the-most-important-business-rule-in-the-app). |
| **Review** | `restaurantId` (ref), `userId` (ref), `userName` (snapshotted), `rating` (1–5), `comment` | |
| **Favorite** | `userId` (ref), `restaurantId` (ref), unique compound index on `(userId, restaurantId)` | **Now live** — `favorites.routes.js` + `favorites.controller.js` are mounted at `/api/favorites`, all `protect`ed. Favorites are server-synced (see [5.6](#56-favorites)), not client-only anymore. |

### 4.10 Routes → Controllers, feature by feature

All routes are mounted under `/api` in `routes/index.js`: `/auth`, `/restaurants`, `/orders`, `/reviews`, `/admin`, `/payments`.

**Auth** (`routes/auth.routes.js` → `features/auth/auth.controller.js`)
| Route | Middleware | Behavior |
|---|---|---|
| `POST /api/auth/signup` | `authLimiter`, `validate(signupSchema)` | Lowercases/trims email, 409s if it already exists, creates the user (password auto-hashed by the model), sets the refresh cookie, returns `{ id, name, email, isAdmin, token }`. |
| `POST /api/auth/login` | `authLimiter`, `validate(loginSchema)` | 404 if no account with that email, 401 if password doesn't match, otherwise same response shape as signup. |
| `POST /api/auth/refresh` | none (reads the cookie itself) | Verifies the httpOnly `refreshToken` cookie against `REFRESH_TOKEN_SECRET`; if valid, looks the user up fresh and returns a **new** access token + user data. 401 on missing/invalid/expired cookie. |
| `POST /api/auth/logout` | none | Clears the refresh cookie (`path: '/api/auth'`, matching how it was set). |

The refresh cookie is set with `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 30 days`, `path: '/api/auth'` (scoped so it's only ever sent to auth endpoints, not leaked to every request).

**Restaurants** (public, read-only — `routes/restaurants.routes.js`)
| Route | Behavior |
|---|---|
| `GET /api/restaurants` | All restaurants, unfiltered, unpaginated. |
| `GET /api/restaurants/:id` | One restaurant, 404 if not found. |
| `GET /api/restaurants/:id/menu` | That restaurant's menu items. |

**Orders** (`routes/orders.routes.js`, all `protect`ed)
| Route | Behavior |
|---|---|
| `POST /api/orders` | `writeLimiter`, `validate(placeOrderSchema)` → `placeOrder` controller. See [4.11](#411-order-placement--the-most-important-business-rule-in-the-app) — this is the most important endpoint in the app. Emits `admin:orderCreated` over the socket to the `admin` room on success. |
| `GET /api/orders/:id` | 404 if missing; 403 if the requester is neither the order's owner nor an admin. |
| `GET /api/orders/user/:userId` | 403 unless `userId` matches the requester or the requester is an admin; sorted newest-first. |
| `PATCH /api/orders/:id/cancel` | Owner or admin only. 400 if already `delivered`/`cancelled`. A non-admin can only cancel while the order is still `placed`; an admin can cancel at any stage up to `delivered`. Emits `order:updated` (to the owner) and `admin:orderUpdated` (to the `admin` room). |

**Favorites** (`routes/favorites.routes.js`, all `protect`ed — always user-scoped, no anonymous access)
| Route | Behavior |
|---|---|
| `GET /api/favorites` | Returns a plain array of favorited `restaurantId` strings for the logged-in user. |
| `POST /api/favorites/:restaurantId` | 404 if the restaurant doesn't exist; otherwise creates the `Favorite` doc — a duplicate (unique-index collision) is treated as a no-op success, not an error. |
| `DELETE /api/favorites/:restaurantId` | Removes the favorite if it exists. |

**Reviews** (`routes/reviews.routes.js`)
| Route | Auth | Behavior |
|---|---|---|
| `GET /api/reviews/restaurant/:id` | public | Newest-first. |
| `POST /api/reviews` | `protect` | Validates rating/comment inline, stamps `userId`/`userName` from the verified token (not the request body), then recalculates the restaurant's average rating. |
| `DELETE /api/reviews/:id` | `protect` | 403 unless the requester owns the review or is an admin; recalculates rating afterward. |

Both create and delete call `syncRestaurantRating(restaurantId)` — averages every review's rating, rounds to one decimal, and writes it onto `Restaurant.rating`. **The rating is always live and recomputed, never a cached or client-supplied value.**

**Payments** (`routes/payments.routes.js`, `protect`ed) — see [4.12](#412-mock-payments).

**Admin** (`routes/admin.routes.js`) — every route runs `protect, admin` first.
| Route | Behavior |
|---|---|
| `GET /api/admin/restaurants?page=&limit=` | Paginated: `{ items, page, totalPages, totalCount }`. `limit` capped at 50 server-side regardless of what's requested. |
| `POST /api/admin/restaurants` | `validate(restaurantSchema)` → create. |
| `PUT /api/admin/restaurants/:id` | `validate(restaurantUpdateSchema)` (partial) → update. If the name changed, **cascades the new name onto every existing `Order.restaurantName`** for that restaurant, so past orders don't show a stale name after a rename. |
| `PATCH /api/admin/restaurants/:id/toggle-open` | `validate(toggleOpenSchema)` → flips `isOpen`. |
| `DELETE /api/admin/restaurants/:id` | Deletes all of that restaurant's `MenuItem`s and `Review`s, then the restaurant itself. **Does not touch existing `Order`s** — those already carry a snapshotted `restaurantName` and item prices, so order history survives the restaurant being deleted. *(Note: the frontend's `adminApi.js` still has error-handling code for a 409 "has existing orders" response from a delete — that block-on-orders behavior existed at some point but the current controller no longer implements it; the delete always succeeds today unless the ID doesn't exist.)* |
| `GET /api/admin/orders?page=&limit=` | Same pagination shape as restaurants. |
| `PATCH /api/admin/orders/:id/status` | `validate(orderStatusSchema)`. 400s if the order is already `delivered` — **delivered orders are status-locked** and can never be changed again. |
| `GET /api/admin/users` | All users, password excluded via `.select('-password')`. |
| `GET /api/admin/restaurants/:restaurantId/menu` | Menu items for one restaurant (admin-scoped duplicate of the public menu endpoint, used to drive the admin menu-items dropdown). |
| `POST /api/admin/menu-items` | `validate(menuItemSchema)` → create. |
| `PUT /api/admin/menu-items/:id` | `validate(menuItemUpdateSchema)` → update. |
| `DELETE /api/admin/menu-items/:id` | Delete. No order-block needed — orders snapshot item name/price at purchase time, so deleting a menu item later never corrupts historical order data. |

### 4.11 Order placement — the most important business rule in the app
`POST /api/orders` (`orders.controller.js` → `placeOrder`) does **not trust the client's cart data for pricing.** Given `{ restaurantId, items, deliveryAddress }`:

1. Looks up the restaurant; 404s if it doesn't exist.
2. For **every line item**, re-fetches the actual `MenuItem` from the database by `itemId` and confirms it belongs to the given `restaurantId` (400s otherwise — this also blocks someone crafting a request mixing items from two different restaurants).
3. Recomputes `unitPrice` from `menuItem.price + variant.priceModifier` — the variant name sent by the client is looked up against the menu item's actual variants; an invalid/unknown variant name 400s.
4. Normalizes `quantity` to a positive integer (defaults to 1 if the client sent something bogus).
5. Sums `pricedItems` into `subtotal`, adds `restaurant.deliveryFee` (from the DB, not the client) for `total`.
6. Rejects the order (400) if `subtotal < restaurant.minOrder`.
7. Creates the `Order` with `userId` from `req.user._id` (the verified token — **never** from the request body) and `restaurantName` snapshotted from the DB restaurant record (not whatever the client's stale cart happened to be showing).

**Net effect:** a client could send a tampered cart with `price: 0` on every item, and the server would silently discard those numbers and recompute the real total from the database. This is the single most security-relevant piece of backend logic in the app.

### 4.12 Mock payments
`POST /api/payments` (`protect`ed) is a simulated payment gateway, not a real one:
- Validates the card number is 16 digits (after stripping spaces) and that `expiry`/`cvv` are present.
- **One hardcoded card number always declines:** `4000000000000002` → 402 `"Card declined. Please try a different card."` This is the deliberate, demonstrable failure path used to show off error handling in the checkout flow.
- Every other well-formed 16-digit card succeeds and returns a fake `transactionId`.
- No actual charge, no real gateway integration — this is intentionally a stand-in.

### 4.13 Seed data (`scripts/seed.js`)
Run via `npm run seed` from `cravo-server/`. Connects directly to `MONGO_URI`, checks `Restaurant.countDocuments()` and **exits early if any restaurant already exists** (so re-running it is a safe no-op, not a duplicate-inserter). Seeds:
- 12 restaurants (Lahore-based demo data — Gulberg, DHA, Model Town, etc.), each with a real Unsplash image URL, cuisine, rating, delivery time/fee, min order, and open/closed status.
- ~38 menu items distributed across those restaurants, grouped by category.
- One admin account (`admin@cravo.com` / `admin123`) — only created if it doesn't already exist, independent of whether restaurants were just seeded.

### 4.14 Testing (backend)
`src/tests/*.test.js` (Vitest + Supertest) cover auth, restaurants, orders, reviews, menu items, and admin — six suites, ~520 lines total. `tests/setup.js` spins up `mongodb-memory-server` (an in-process, ephemeral MongoDB) so tests run against real Mongoose code paths with zero external dependencies, then tears it down after the suite. Run via `npm test` from `cravo-server/`.

### 4.15 Real-time layer (`socket/index.js`, Socket.IO)
`server.js` wraps the Express `app` in a plain `http.createServer(app)` (rather than calling `app.listen` directly) so the same server instance can be handed to `initSocket(server)`, which attaches a Socket.IO server alongside the REST API on the same port.

- **Handshake auth**: an `io.use()` middleware requires `socket.handshake.auth.token` — the same JWT the REST API uses — verified with `jwt.verify(token, JWT_SECRET)`. No token, an invalid token, or a token for a deleted user all reject the connection before it's established; there's no anonymous socket connection possible.
- **Rooms**: on `connection`, every authenticated socket joins `user:<their own id>`; if `user.isAdmin`, it additionally joins `admin`. There's no per-order room — updates are always addressed to a user or to the whole admin room, never to an order ID directly.
- **`getIO()`** is a module-level getter that throws if called before `initSocket()` has run — this is what every controller that needs to emit an event calls, rather than importing the `io` instance directly.
- **Events emitted** (see [4.10](#410-routes--controllers-feature-by-feature) for exactly which routes trigger which):
  - `order:updated` → room `user:<order.userId>` — fired on every order status change (admin update or self-cancellation) and on cancellation.
  - `admin:orderCreated` → room `admin` — fired once, right after a new order is created.
  - `admin:orderUpdated` → room `admin` — fired on every status change/cancellation, so every connected admin's dashboard stays in sync without needing to poll.
- **CORS**: the Socket.IO server's own CORS config mirrors the REST API's — same `CLIENT_ORIGIN`-derived allow-list, `credentials: true`.

---

## 5. Frontend — Feature by Feature

### 5.1 App shell (`src/App.jsx`, `src/main.jsx`)
- `main.jsx` wraps the app in, from outside in: `StrictMode` → `ThemeProvider` → `QueryClientProvider` (one shared `QueryClient`) → `BrowserRouter` → `App`.
- `App.jsx` renders `Navbar`, a global `ToastContainer`, the `ResetDemoDataLink`, the routed page (inside an `ErrorBoundary` **keyed by `location.pathname`**, so a crash on one page doesn't poison the tree when you navigate elsewhere — the key change forces React to remount fresh), and `Footer`.
- Every page component except the shell itself is loaded via `React.lazy()`, so the initial JS bundle only includes what's needed to render the shell + whichever route is active; `Suspense`'s fallback is a pulsing logo.

Route table:
| Path | Component | Access |
|---|---|---|
| `/` | `RestaurantListPage` | public |
| `/restaurant/:id` | `RestaurantDetailPage` | public |
| `/login`, `/signup` | `LoginPage`, `SignupPage` | public |
| `/favorites` | `FavoritesPage` | `RequireAuth` |
| `/checkout` | `CheckoutPage` | `RequireAuth` |
| `/order-confirmation/:orderId` | `OrderConfirmationPage` | `RequireAuth` |
| `/order-tracking/:orderId` | `OrderTrackingPage` | `RequireAuth` |
| `/orders` | `OrderHistoryPage` | `RequireAuth` |
| `/admin` | `AdminPage` | `RequireAdmin` |

`RequireAuth` redirects a guest to `/login?next=<original path>` and the login/signup flow honors `next` to send the user back afterward. `RequireAdmin` redirects a logged-in-but-non-admin user to `/` instead of to login (they're authenticated, just not authorized) — **again, this is UX only; the real gate is the server's `protect, admin` middleware.**

### 5.2 The Axios layer (`shared/services/axiosInstance.js`) — how auth actually stays invisible to the user
This is the piece that makes the 15-minute access token painless in practice.

- Created with `baseURL: import.meta.env.VITE_API_URL` and `withCredentials: true` (so the browser sends the httpOnly refresh cookie automatically on every request, without JS ever touching it).
- **Request interceptor**: reads the access token straight out of `localStorage['cravo-auth']` (the Zustand-persisted auth store's raw storage) and attaches `Authorization: Bearer <token>` if present.
- **Response interceptor**: on a 401 that isn't from an `/auth/` endpoint and hasn't already been retried:
  1. If a refresh is *already in flight* (triggered by a different simultaneous request), the failed request is queued (`pendingQueue`) rather than firing a second concurrent refresh call.
  2. Otherwise, it calls `POST /auth/refresh` (cookie sent automatically), updates the Zustand auth store with the new token, retries the original request with the new `Authorization` header, and **resolves every queued request** with the same fresh token.
  3. If the refresh call itself fails (expired/invalid refresh token), every queued request is rejected and the user is logged out client-side (`useAuthStore.getState().logout()`).
- Also maps a backend error's `{ message }` body onto `error.message`, so every `catch` block downstream can just read `err.message` without unwrapping the Axios response shape.

**Net effect for the user:** they can sit on the page for hours; the first request after the access token expires transparently gets a new one before they ever see an error, and simultaneous in-flight requests don't each trigger their own redundant refresh call.

### 5.3 Auth (`features/auth/`)
- **`store/authStore.js`** — Zustand + `persist('cravo-auth')`. Holds `{ user, isLoggedIn }`; `user` includes the access `token` returned by the API. `login(user)` / `logout()`.
- **`services/authApi.js`** — `signup()` and `login()` wrap the Axios calls and translate specific HTTP status codes into friendlier `Error` messages (409 → "account already exists", 404 → "no account found", 401 → "incorrect password") while preserving the original error as `{ cause }`.
- **`components/LoginPage.jsx`** — On successful login, checks whether a saved cart snapshot exists for that user ID (see [5.4](#54-cart--the-guestlogin-merge-flow)) and either merges/prompts/restores as appropriate, then navigates to `next` (or `/`). Shows the demo admin credentials as a hint on the page itself.
- **`components/SignupPage.jsx`** — same shape, without the cart-merge branch (a brand-new account has no saved snapshot to merge).
- **`components/CartMergeModal.jsx`** — a plain three-button dialog (Merge / Keep current / Use saved) shown only when *both* a guest cart and a saved snapshot have items.

### 5.4 Cart — the guest/login merge flow
This is the most involved piece of client-only logic in the app, entirely inside `features/cart/store/cartStore.js` (Zustand + `persist('cravo-cart')`):

- A **guest ID** (`cravo-guest-id` in `localStorage`) is generated once per browser and never changes; it exists so a snapshot can theoretically be scoped even for guest sessions, though in practice cart snapshots are keyed by **user ID**, not guest ID.
- Cart state: `{ restaurantId, restaurantName, items: [] }`. Adding an item from a *different* restaurant than what's currently in the cart **replaces** the whole cart with just that new item (the actual "are you sure" confirmation for this lives in the UI layer — see below — not in the store itself).
- `addItem` merges quantities for identical `(itemId, variant)` pairs rather than adding a duplicate line.
- On **logout** (`Navbar.jsx`'s `handleLogout`): the current cart is snapshotted to `localStorage['cravo-user-cart-<userId>']` via `saveSnapshotForUser(userId)`, then the live cart is cleared, then the server-side refresh cookie is cleared via `POST /auth/logout`.
- On **login** (`LoginPage.jsx`):
  - If a saved snapshot exists **and** the current (guest) cart also has items → show `CartMergeModal` with three choices: merge both (combines line items, summing quantities for matches; if the two carts are from *different* restaurants, merging isn't possible and the user is toasted that the saved cart couldn't be merged, keeping the current one instead), keep current, or restore saved.
  - If a saved snapshot exists and the guest cart is **empty** → silently restore the saved cart, no prompt.
  - If there's no saved snapshot → nothing to merge, proceed straight through.
  - Either way, the snapshot is cleared for that user ID once resolved so it isn't re-offered next login.

### 5.5 Restaurants (`features/restaurants/`)
- **`services/restaurantApi.js`** — three thin wrappers: `getAllRestaurants`, `getRestaurantById`, `getMenuItemsByRestaurantId`.
- **`hooks/useRestaurants.js`** — `useRestaurants()`, `useRestaurant(id)`, `useMenuItems(restaurantId)`, all plain `useQuery`s (the latter two `enabled` on the ID being truthy).
- **`components/RestaurantListPage.jsx`** — fetches the **entire** restaurant list once via `useRestaurants()`, then does search (name substring match), cuisine filtering, and sorting (rating or name) **entirely client-side** against the already-fetched array — no network round-trip per keystroke. Also exports `RestaurantCard`, reused by `FavoritesPage`. Shows animated skeleton cards while loading.
- **`components/RestaurantDetailPage.jsx`** — fetches the restaurant and its menu in parallel (`isLoading` is true if either is still loading); groups menu items by `category` for section rendering. "Add to cart" opens `ItemCustomizeModal`; if the cart already has items from a **different** restaurant, the add is held in `pendingAdd` state and a `ConfirmDialog` asks the user to confirm clearing the cart first (this is the UI-level guard mentioned in [5.4](#54-cart--the-guestlogin-merge-flow)). Renders `ReviewsSection` at the bottom.
- **`components/ItemCustomizeModal.jsx`** — given a menu item, lets the user pick a variant (if any — defaults to the first one), a quantity, and free-text notes. Computes `unitPrice = item.price + variantModifier` and `totalPrice = unitPrice * quantity` live, and hands a fully-formed cart line item back to the caller.

### 5.6 Favorites (`features/favorites/`) — now server-synced, not client-only
This used to be a purely client-side (Zustand + `localStorage`) feature; it now round-trips through the API and the `Favorite` model (see [4.9](#49-models-modelsjs-mongoose)), so favorites follow the account across devices/browsers instead of being stuck in one browser.

- **`services/favoritesApi.js`** — thin wrappers around `GET/POST/DELETE /api/favorites(/:restaurantId)`. `getMyFavorites()` returns a plain array of restaurant ID strings — the frontend only ever needs to know *which* IDs are favorited, not full favorite records.
- **`hooks/useFavorites.js`**:
  - `useFavorites()` — `useQuery(['favorites'], getMyFavorites)`, `enabled: isLoggedIn` (no point calling it for a guest, who'd be routed to `/login` anyway), `initialData: []` so consumers never have to guard against `undefined`.
  - `useToggleFavorite()` — a single mutation handling both add and remove (branches on the `isFavorite` flag passed in). Does an **optimistic update**: `onMutate` immediately adds/removes the ID from the cached `['favorites']` array so the heart icon flips instantly, `onError` rolls back to the previous cached value if the request fails, and `onSettled` invalidates the query either way to reconcile with the server.
- **`FavoritesPage.jsx`** re-fetches the full restaurant list (same hook the list page uses) and filters it down to the ID list from `useFavorites()`. Gated behind login via the same "redirect to `/login?next=...`" pattern used by the review composer and the favorite-heart buttons elsewhere.

### 5.7 Checkout (`features/checkout/`)
- **`services/paymentApi.js`** — calls the real `POST /api/payments` endpoint; translates a 402/400 response into `"Card declined. Please try a different card."`
- **`components/CheckoutPage.jsx`**
  - `formatCardNumber()` / `formatExpiry()` are live input formatters (space every 4 digits; auto-insert the `/` in `MM/YY`).
  - `subtotal` is derived from the live cart on every render (never separately cached in state), so it can never go stale relative to the cart.
  - `validate()` checks: address present, cardholder name present, 16-digit card number, valid `MM/YY` with a real month, 3–4 digit CVV, and `subtotal ≥ restaurant.minOrder` (a **client-side pre-check** — the server enforces the same rule authoritatively at order-placement time in [4.11](#411-order-placement--the-most-important-business-rule-in-the-app)).
  - On submit: `processPayment()` → `placeOrder()` → clear cart → success toast → navigate to `/order-confirmation/:orderId`. If either call throws, the cart is left intact and the error shows both inline and as a toast.
  - Deliberately uses plain `async` functions + local `isSubmitting`/`isPlacingOrder` state rather than TanStack `useMutation` — these are one-shot writes, not reusable cache-invalidating queries, so the simpler pattern is an intentional choice, not an oversight.

### 5.8 Orders (`features/orders/`) — now pushed live over WebSockets, not just polling
- **`services/orderApi.js`** — `placeOrder(orderData)` (posts to `/orders`), `getOrderById(id)` (translates a 404 into `"Order not found"`), `getOrdersByUserId(userId)` (sorts newest-first client-side as a belt-and-braces measure, even though the server already sorts), `cancelOrder(orderId)` (posts to `PATCH /orders/:id/cancel`).
- **`hooks/useOrders.js`**
  - `useOrder(orderId)` — single fetch, no polling, no socket listener (used on the confirmation page, where the order won't change moment to moment).
  - `useOrderTracking(orderId)` — subscribes to the shared socket's `order:updated` event in a `useEffect` and, when the incoming order's `id` matches, writes it straight into the React Query cache via `queryClient.setQueryData(['order', orderId], updatedOrder)` — no refetch needed, the pushed payload *is* the new data. `refetchInterval: 30000` still runs underneath as a fallback net (in case the socket is disconnected), not as the primary update mechanism anymore.
  - `useUserOrders(userId)` — same pattern, but the socket handler just calls `queryClient.invalidateQueries(['orders', userId])` on any `order:updated` event (since it's a list, easier to invalidate than to patch one row), backed by the same 30s poll fallback.
  - `useCancelOrder()` — a mutation wrapping `cancelOrder()`; on success writes the returned (now-`cancelled`) order straight into `['order', orderId]` and invalidates the `['orders']` list.
- **`components/OrderConfirmationPage.jsx`** — the post-checkout receipt: item list, total, delivery address, link home.
- **`components/OrderTrackingPage.jsx`** — visual step-tracker; `currentIndex = STATUS_STEPS.indexOf(order.status)` determines which steps render as done (✓, gold) vs. current (highlighted, "Current status" label) vs. upcoming (numbered, gray). Updates arrive the instant the socket pushes them, not just on the next poll.
- **`components/OrderHistoryPage.jsx`** — list of past orders, each linking to its tracking page; `statusColor()` maps each status to a badge color, including `cancelled` now that it's a real, reachable status rather than just a hypothetical one.

See [4.15](#415-real-time-layer-socketindexjs-socketio) for the backend half of this (rooms, auth, emitted events) and `shared/services/socket.js` / `shared/hooks/useSocketConnection.js` in [5.11](#511-shared-srcshared-srcstore) for how the frontend socket connection itself is managed.

### 5.9 Reviews (`features/reviews/`)
- **`services/reviewApi.js`** — `getReviewsByRestaurantId`, `addReview` (client-side pre-validates rating/comment before even hitting the network — the server validates again authoritatively), `deleteReview`.
- **`hooks/useReviews.js`** — `useReviews(restaurantId)` query; `useAddReview` / `useDeleteReview` mutations, both invalidating `['reviews', restaurantId]` on success so the list (and the average-rating display, which is computed client-side from whatever reviews are currently fetched) updates immediately without a manual refetch.
- **`components/ReviewsSection.jsx`** — shows the average rating next to the heading; `StarPicker` is a small 1–5 star radio-button-style input. Guests clicking "Write a Review" are redirected to `/login?next=<path>` rather than shown an inline prompt. Each review shows a Delete button only if the viewer owns it or is an admin (matches the server's own authorization rule in [4.10](#410-routes--controllers-feature-by-feature)).

### 5.10 Admin panel (`features/admin/`)
Four tabs, each independently data-fetched:

- **`services/adminApi.js`** — all the admin CRUD wrappers. Notably, `getAllUsersAdmin()` explicitly maps the response to an **allow-list** of fields (`id`, `name`, `email`, `isAdmin`) rather than trusting the server response shape wholesale or just destructuring `password` *out* — so it's obvious at a glance exactly what's exposed to the UI, even though the server already strips passwords server-side too (defense in depth).
- **`hooks/useAdmin.js`** — every query/mutation hook (`useAdminRestaurants`, `useAdminMenuItems`, `useAdminUsers`, `useAdminOrders`, `useDeleteRestaurant`, `useToggleRestaurantOpen`, `useDeleteMenuItem`, `useUpdateOrderStatus`). Paginated hooks (`useAdminRestaurants(page, limit)`, `useAdminOrders(page, limit)`) use `placeholderData: keepPreviousData` so the UI doesn't flash empty while a new page loads. Every mutation invalidates **both** the admin-facing query key and the matching public-facing one (e.g. deleting a restaurant invalidates `['admin-restaurants']` *and* `['restaurants']`) so customer-facing pages never show stale data after an admin action.
- **`components/AdminPage.jsx`** — tab shell with local `activeTab` state; four `StatCard`s at the top read `totalCount`/`.length` from each hook's data (restaurants and orders use the server's true `totalCount` across all pages, not `items.length`, which would only reflect the current page size; revenue is computed client-side by summing `orders.items[].total` — **note this is only the current page's revenue, not all-time revenue, unless `limit` happens to cover every order**).
- **`components/AdminRestaurantsTab.jsx`** — paginated list + Add/Edit (`RestaurantFormModal`) + Delete (`ConfirmDialog`) + an inline Open/Closed toggle button. Correctly unwraps the paginated response as `data?.items || []`.
- **`components/AdminMenuItemsTab.jsx`** — a restaurant `<select>` drives which restaurant's menu is shown, defaulting to the first restaurant once loaded; Add/Edit via `MenuItemFormModal`, Delete via `ConfirmDialog`. **See the note below — this file had a bug that has since been fixed.**
- **`components/AdminOrdersTab.jsx`** — paginated, expandable rows (click to reveal line items); a status `<select>` per row calls `updateOrderStatus` directly, disabled/replaced with a "✓ Delivered" badge once an order is delivered (matching the server's status-lock rule).
- **`components/AdminUsersTab.jsx`** — read-only table (name/email/Admin-or-Customer badge). No create/edit/delete — accounts are only ever created via Sign Up.
- **`components/RestaurantFormModal.jsx`** / **`MenuItemFormModal.jsx`** — create/edit forms. Both independently enforce **"image upload OR image URL, never both"** (the URL field disables while a file is selected; submission is also rejected client-side if somehow both end up set). `MenuItemFormModal` additionally manages a dynamic list of variant rows, stripping out any row left with an empty name before saving.
- **`components/AdminUI.jsx`** — small shared presentational pieces used across every tab: `StatCard`, `SkeletonRows` (loading placeholder), `EmptyState`, `ErrorState`.

#### ⚠️ Bug found & fixed: `AdminMenuItemsTab.jsx` — "restaurants.map is not a function"
**Symptom:** opening the Menu Items tab in `/admin` crashed with `TypeError: restaurants.map is not a function`, caught by the route-level `ErrorBoundary`.

**Root cause:** `GET /api/admin/restaurants` (and therefore `useAdminRestaurants()`) resolves to the **paginated envelope** `{ items, page, totalPages, totalCount }`, not a bare array — this is documented behavior, and every *other* admin tab (`AdminRestaurantsTab.jsx`, `AdminOrdersTab.jsx`) already correctly does `const restaurants = data?.items || []` before using the list. `AdminMenuItemsTab.jsx` was the one file that skipped this unwrap and used the hook's raw `data` as if it were the array directly (`restaurants.map(...)`, `restaurants?.[0]?.id`), so `.map` failed the moment the query resolved.

**Fix applied:** `AdminMenuItemsTab.jsx` now destructures `data` from `useAdminRestaurants(1, 100)` and derives `const restaurants = data?.items || []`, matching the pattern used everywhere else in the codebase. The `limit` was also bumped from the hook's default of 10 to 100 for this specific call, since the restaurant *dropdown* driving the menu-items view should reasonably list every restaurant, not just the first page of 10 — with more than 100 restaurants this would need real pagination or a dedicated "all restaurants, no pagination" endpoint, but 100 comfortably covers demo-scale data.

### 5.11 Shared (`src/shared/`, `src/store/`)
Code used by more than one feature (or belonging to no single feature) lives here rather than duplicated per feature:

- **`shared/components/Navbar.jsx`** — logo, delivery-location button (opens `AddressModal`), Favorites/My Orders/Admin links (conditional on auth state), theme toggle, cart button with a live item-count badge, and the login/logout controls. `handleLogout` snapshots the cart, clears it, hits `/auth/logout` (best-effort — failure is swallowed since the user is logging out regardless), then clears the auth store and navigates home.
- **`shared/components/Footer.jsx`** — static site-map-style footer, contact email, copyright line explicitly stating this is a demo project.
- **`shared/components/RequireAuth.jsx` / `RequireAdmin.jsx`** — route guards described in [5.1](#51-app-shell-srcappjsx-srcmainjsx).
- **`shared/components/ErrorBoundary.jsx`** — class component catching render errors; shows a "Something went wrong" screen with a link home. Logs the error to `console.error` for debugging.
- **`shared/components/ConfirmDialog.jsx`** — generic modal (title/message/confirm/cancel), reused everywhere a destructive or cart-switching action needs confirmation.
- **`shared/components/AddressModal.jsx`** — delivery-location picker: a handful of hardcoded "popular area" pills (Gulberg, DHA, Model Town, etc.) plus a free-text field. Purely client-side, persisted via `locationStore`.
- **`shared/components/Toast.jsx`** — renders the global toast queue from `toastStore`; success/error/info styling, auto-dismiss, manual dismiss button, `aria-live="polite"` for accessibility.
- **`shared/components/ResetDemoDataLink.jsx`** + **`shared/services/resetDemoData.js`** — a small "reset demo data" link in the bottom-right corner. Clears every `localStorage` key prefixed `cravo-` **except** `cravo-theme` (so switching your theme preference doesn't get wiped by a demo reset), then reloads the page. **Important:** this only clears client-side state (login session, cart, favorites, saved location) — restaurants, menu items, orders, reviews, and accounts all live on the server and are untouched by this button.
- **`shared/contexts/ThemeContext.jsx`** — `dark`/`light` state, persisted to `localStorage['cravo-theme']`, toggles a `.light` class on `<html>` that swaps every CSS custom property defined in `index.css`'s `@theme` block (see [5.12](#512-styling)).
- **`shared/services/socket.js`** — owns the single shared Socket.IO client instance. Reads the access token straight out of `localStorage['cravo-auth']` and **connects eagerly at module load** (not waiting for a component to mount) so the socket exists before any page's effects run — this fixed an earlier race where a page's listener could attach to a socket instance that got torn down and replaced mid-navigation. Exports `connectSocket(token)` (reuses the existing socket if the token hasn't changed — important because React `StrictMode` double-invokes effects in dev and would otherwise kill a socket mid-handshake), `disconnectSocket()`, and `getSocket()` (returns the current instance or `null`, used by every hook that attaches a listener).
- **`shared/hooks/useSocketConnection.js`** — called once, from `App.jsx`. A single `useEffect` watching the auth token: connects the socket when a token appears (login), disconnects it when the token disappears (logout).
- **`shared/utils/orderStatuses.js`** — the single source of truth for the four order statuses, imported by both the tracking page and the admin orders tab so the two never drift out of sync.
- **`shared/utils/delay.js`** — `delay(ms)` / `randomDelay()`. **Leftover from the old IndexedDB-mock era** — nothing in the current codebase imports or calls this file anymore (confirmed via a full-codebase search). Safe to delete; kept here only because nobody's cleaned it up yet.
- **`store/toastStore.js`** — global (not feature-scoped) Zustand store for the toast queue; exports a `toast.success/error/info(message)` convenience API so call sites read naturally instead of reaching into the store directly.
- **`store/locationStore.js`** — global Zustand store (persisted) for the saved delivery address.

### 5.12 Styling
Tailwind v4, configured via `index.css`'s `@theme` block rather than a JS config object — custom color tokens (`charcoal`, `slate`, `gold`, `goldDeep`, `champagne`, `offwhite`, `warmGray`, `success`, `error`, `warning`, `borderDark`, `cream`) and two font tokens (`Cinzel` for display headings, `Poppins` for body text). A `.light` class block on the same file **redefines every one of those same custom properties** with light-mode-appropriate values — so toggling `.light` on `<html>` re-themes the entire app without any component needing to know which mode is active; components just use `bg-charcoal`, `text-gold`, etc., and the CSS variables underneath do the swapping.

---

## 6. Full End-to-End Workflows

### 6.1 First-time setup → seeded data → app loads
1. Dev spins up MongoDB, backend (`cravo-server`), and frontend (`npm run dev` in each).
2. `npm run seed` populates restaurants/menu items/admin account (idempotent — safe to run again, it no-ops if data already exists).
3. Visiting `localhost:5173` loads the SPA shell; `RestaurantListPage` fires `GET /api/restaurants` immediately.
4. If no delivery address is saved yet, `Navbar` opens `AddressModal` on load (`useState(() => !address)`), prompting the user to pick or type one before doing anything else feels natural — though nothing actually blocks browsing without it.

### 6.2 Guest browsing → sign up → guest cart carries over
1. A guest browses `/`, searches/filters/sorts restaurants (all client-side against one fetched list).
2. Clicks into a restaurant → `RestaurantDetailPage` fetches restaurant + menu in parallel.
3. Adds an item → `ItemCustomizeModal` → cart store now holds `{ restaurantId, restaurantName, items: [...] }`, tagged to the browser's persistent `guestId` conceptually (though snapshots are actually keyed by user ID, not guest ID — the guest cart itself just lives in the unscoped `cravo-cart` key until the user logs in).
4. Clicks "Sign Up" → `SignupPage` → `POST /api/auth/signup` → account created, access token returned, refresh cookie set → `authStore.login(user)` → since this is a brand-new account, there's no saved snapshot to merge, so the existing guest cart is simply kept as-is and the user is redirected to wherever they were headed (`next` or `/`).

### 6.3 Returning user login → cart merge decision
1. User logs in with items already in a guest cart from this session, **and** they have a cart snapshot saved from a previous logged-in session (saved at last logout).
2. `LoginPage` detects both non-empty carts and shows `CartMergeModal`.
3. User picks one of three paths:
   - **Merge both** → if same restaurant, quantities combine; if different restaurants, merge is impossible and the user is toasted that their current cart was kept instead.
   - **Keep current** → guest cart wins, saved snapshot is discarded.
   - **Use saved** → saved snapshot replaces the current cart entirely.
4. Either way, the snapshot is deleted from `localStorage` for that user afterward (so it isn't re-offered on the next login), and the user is navigated to `next`/`/`.

### 6.4 Ordering — from menu to placed order
1. On a restaurant page, "Add" on a menu item opens `ItemCustomizeModal` (variant/quantity/notes).
2. If the cart already contains items from a **different** restaurant, a `ConfirmDialog` intercepts the add ("clear cart & add" vs. cancel) before it's applied.
3. Cart icon in the navbar shows a live item-count badge (Zustand selector on `items`).
4. "Proceed to Checkout" (from the `CartDrawer`) → `RequireAuth` gate → `CheckoutPage`.
5. Checkout fetches the restaurant again (for its live `deliveryFee`/`minOrder`, in case it changed since the cart was built) via `useRestaurant(restaurantId)`.
6. Client-side `validate()` checks the delivery address, card fields, and minimum order.
7. Submit → `POST /api/payments` (mock gateway; declines only for the one hardcoded test card) → on success, `POST /api/orders`.
8. **Server re-prices everything from the database**, ignoring whatever price/subtotal/total the client sent, and creates the order with a snapshotted restaurant name.
9. On success: cart cleared, success toast, redirect to `/order-confirmation/:orderId`. On failure (declined card, min-order violation, invalid item, etc.): cart is **left intact** and the error surfaces both inline and as a toast, so the user can fix the problem and resubmit without having lost their cart.

### 6.5 Order tracking — live status updates over WebSockets
1. On login, `useSocketConnection()` opens an authenticated Socket.IO connection; the socket joins room `user:<their id>` (and `admin` too, if they're an admin) as soon as it connects — see [4.15](#415-real-time-layer-socketindexjs-socketio).
2. `/order-tracking/:orderId` (`useOrderTracking`) does an initial `GET /api/orders/:id` fetch, renders a step tracker (Placed → Preparing → On the Way → Delivered) based on `ORDER_STATUSES.indexOf(order.status)`, and attaches an `order:updated` socket listener scoped to that order ID. A 30-second poll (`refetchInterval: 30000`) also runs, purely as a fallback in case the socket connection drops.
3. Meanwhile, an admin on `/admin`'s Orders tab changes that same order's status via the per-row `<select>` → `PATCH /api/admin/orders/:id/status`.
4. The server saves the change and immediately emits `order:updated` to room `user:<order.userId>` and `admin:orderUpdated` to room `admin`. The customer's tracking page (and their `/orders` history page) updates **the instant the event arrives** — no polling delay — while every connected admin's dashboard also refreshes live.
5. Once an order reaches `delivered`, the server locks it — any further `PATCH` attempt 400s, and the admin UI swaps the status dropdown for a static "✓ Delivered" badge.

### 6.5b Cancelling an order
1. While an order is still in the `placed` state, the customer can cancel it themselves from their order history or tracking page — hits `PATCH /api/orders/:id/cancel`.
2. Once it's moved to `preparing` or beyond, only an admin can cancel it (up to, but not including, `delivered` — a delivered order can never be cancelled or otherwise changed).
3. On success the order's `status` becomes `cancelled` and the same `order:updated` / `admin:orderUpdated` socket pair fires as a normal status change, so the cancellation shows up live on both the customer's and any admin's screen without a refresh.

### 6.6 Reviews — writing one and seeing the rating update live
1. On a restaurant page, a logged-in user clicks "Write a Review" → star picker + comment box.
2. Submit → client pre-validates (rating 1–5, non-empty comment) → `POST /api/reviews`.
3. Server re-validates the same rules, stamps `userId`/`userName` from the verified token (not the request body — so a user can't post a review pretending to be someone else), creates the review, then recalculates `Restaurant.rating` as the average of *all* reviews for that restaurant, rounded to one decimal.
4. The mutation invalidates the `['reviews', restaurantId]` query key → the reviews list and the average-rating display (computed client-side from the freshly refetched review list) update immediately, no page reload.
5. A user (or an admin, for any review) can delete a review; deletion re-triggers the same rating recalculation.

### 6.7 Admin panel — managing the platform
1. `admin@cravo.com` logs in → `user.isAdmin === true` → "Admin" link appears in the navbar → `/admin` (gated server-side on every request by `protect, admin`, not just client-side by `RequireAdmin`).
2. **Restaurants tab**: paginated list; toggle Open/Closed inline; Add/Edit via a modal that enforces "image upload OR URL, not both"; Delete cascades to that restaurant's menu items and reviews (but leaves past orders alone, since they've already snapshotted what they need).
3. **Menu Items tab**: pick a restaurant from a dropdown (populated from *all* restaurants, not just one page — see [5.10](#510-admin-panel-featuresadmin)'s bug note), see/add/edit/delete its menu items; variants are managed as dynamic name+price-modifier rows.
4. **Orders tab**: paginated, expandable rows showing full line-item detail; change status per order (locked once delivered).
5. **Users tab**: read-only — signed-up accounts appear here automatically the moment someone signs up; there's no admin-side user creation, since that would bypass the normal signup/password-hashing flow.
6. Every mutation across every tab invalidates both its admin-facing cache key and the matching customer-facing one, so a restaurant edit, a menu item price change, or an order status update is reflected on the public site instantly — no stale data, no manual refresh needed anywhere in the app.

### 6.8 Logout → reset demo data
- **Logout**: cart snapshotted for this user → cart cleared → `POST /auth/logout` (clears the refresh cookie server-side) → auth store cleared → redirect home. No credential lingers client-side after this.
- **Reset demo data** (bottom-right link): wipes every `cravo-*` `localStorage` key except the theme preference, then reloads. This resets your **local device state only** (login session, cart, favorites, saved address) — it does not touch anything on the server (restaurants, orders, reviews, accounts), since those aren't stored locally at all anymore.

---

## 7. Testing & CI

- **Backend unit/integration tests** — `cravo-server/src/tests/*.test.js` (Vitest + Supertest against `mongodb-memory-server`). Run via `npm test` from `cravo-server/`. No real DB connection required — everything runs against a throwaway in-memory Mongo instance per test run.
- **End-to-end tests** — `e2e/*.spec.js` at the repo root (Playwright), covering login (including the wrong-password error path) and checkout. Run via `npm run test:e2e` from the repo root. **Requires** the API server and MongoDB running with seeded data — these are not mocked, they exercise the real stack.
- **CI** (`.github/workflows/ci.yml`) — on every push/PR to `main`, runs two parallel jobs: `server-tests` (installs `cravo-server`'s deps, runs its Vitest suite with dummy JWT secrets and `NODE_ENV=test`), and `client-build` (installs root deps, runs `npm run lint` then `npm run build`). Note: **Playwright e2e tests are not currently run in CI** — they're a local-only check requiring a live stack.

---

## 8. Extending the App

To add a new feature end-to-end, following the existing pattern:

**Backend**
1. Add a Mongoose model in `models/` if it needs its own collection (remember the `timestamps: true` + `toJSON` transform convention).
2. Add a Zod schema in a new `features/<name>/<name>.validation.js`.
3. Add a controller in `features/<name>/<name>.controller.js`, wrapped in `asyncHandler`.
4. Add a router in `routes/<name>.routes.js`, applying `protect`/`admin` as needed, and mount it in `routes/index.js`.
5. Add a test file in `src/tests/<name>.test.js` following the existing Supertest + `mongodb-memory-server` pattern.

**Frontend**
1. Create `features/<name>/{components,hooks,services}/` as needed (skip `services/` + `hooks/` for pure client-state features with nothing server-shaped; skip `store/` if there's no client-only state to hold).
2. Write service functions in `services/<name>Api.js` calling the new endpoints via the shared `axiosInstance`.
3. Wrap those in `hooks/use<Name>.js` with `useQuery`/`useMutation`, mirroring `useRestaurants.js` or `useReviews.js` — remember to invalidate both the specific and any related query keys on mutation success.
4. Add the route to `App.jsx` with `React.lazy()`, wrapped in `RequireAuth`/`RequireAdmin` if access-gated.

---

## 9. Known Limitations & Things Worth Knowing

- **Mock payment gateway.** No real card processor is integrated; one hardcoded card number always declines, everything else well-formed succeeds. Not a template for real payments.
- **`RequireAuth`/`RequireAdmin` are UX-only.** The real access control is entirely server-side (`protect`/`admin` middleware); these components just prevent a confusing UI state for people playing by the rules.
- **`shared/utils/delay.js` is dead code** left over from the pre-backend, IndexedDB-mock era of the project; nothing imports it anymore.
- **Admin revenue stat is page-scoped, not all-time**, unless the orders `limit` happens to cover every order in the database — it sums `total` across whatever page of orders is currently loaded, not a true aggregate query.
- **Reviews validation isn't Zod-based** like every other mutating route — it's inline in the controller. Functionally fine, just inconsistent with the rest of the codebase.
- **No automated tests for the frontend** beyond Playwright e2e (which only covers login + checkout) — no component/unit test runner (Vitest/RTL) configured for `src/`.
- **A single admin account model, no roles/permissions granularity** — `isAdmin` is a boolean; there's no "editor vs. super-admin" distinction.

---

## 10. Folder Structure Reference

```text
cravo/
├── src/                              Frontend (Vite + React)
│   ├── App.jsx                       Route table, lazy-loaded pages, path-keyed ErrorBoundary
│   ├── main.jsx                      Entry point: providers (Theme → Query → Router)
│   ├── index.css                     Tailwind v4 @theme tokens, dark/light palettes
│   ├── assets/images/logo.png
│   ├── store/
│   │   ├── toastStore.js             Global toast queue
│   │   └── locationStore.js          Global saved delivery address
│   ├── shared/
│   │   ├── components/               Navbar, Footer, ConfirmDialog, AddressModal, Toast,
│   │   │                             RequireAuth, RequireAdmin, ErrorBoundary, ResetDemoDataLink
│   │   ├── contexts/ThemeContext.jsx
│   │   ├── services/                 axiosInstance.js (auth headers + silent refresh), resetDemoData.js,
│   │   │                             socket.js (shared Socket.IO client, connects eagerly at module load)
│   │   ├── hooks/                    useSocketConnection.js (syncs the socket to login/logout)
│   │   └── utils/                    orderStatuses.js, delay.js (unused/dead)
│   └── features/
│       ├── auth/                     store, services, LoginPage, SignupPage, CartMergeModal
│       ├── cart/                     cartStore.js (guest/login merge logic), CartDrawer
│       ├── restaurants/              services, hooks, ListPage, DetailPage, ItemCustomizeModal
│       ├── favorites/                favoritesApi.js, useFavorites.js, FavoritesPage (server-synced via API)
│       ├── checkout/                 paymentApi.js, CheckoutPage
│       ├── orders/                   orderApi.js, useOrders.js (socket + poll fallback), Confirmation/Tracking/History pages
│       ├── reviews/                  reviewApi.js, useReviews.js, ReviewsSection
│       └── admin/                    adminApi.js, useAdmin.js (socket-driven live refresh), AdminPage + 4 tabs + 2 form modals
│
├── cravo-server/                     Backend (Express + MongoDB)
│   └── src/
│       ├── server.js                 Entry point: env checks, DB connect, http.createServer + initSocket, listen
│       ├── app.js                    Middleware chain (helmet, CORS, JSON, cookies, logging), route mounting
│       ├── config/db.js              Mongoose connection
│       ├── socket/index.js           Socket.IO: JWT-authenticated handshake, user/admin rooms, getIO()
│       ├── middleware/               asyncHandler, auth (protect/admin), errorHandler,
│       │                             rateLimiter (authLimiter, writeLimiter), validate (Zod)
│       ├── models/                   User, Restaurant, MenuItem, Order (5 statuses incl. cancelled), Review, Favorite
│       ├── features/
│       │   ├── auth/                 controller + validation (signup/login/refresh/logout)
│       │   ├── restaurants/          controller (public read-only)
│       │   ├── orders/               controller (server-side re-pricing, cancellation) + validation, emits socket events
│       │   ├── reviews/              controller (rating sync, inline validation)
│       │   ├── payments/             controller (mock gateway)
│       │   ├── menuItems/            controller + validation
│       │   ├── favorites/            controller (server-synced favorites, get/add/remove)
│       │   └── admin/                controller (paginated CRUD across restaurants/orders/
│       │                             users/menu items, order-status updates) + validation, emits socket events
│       ├── routes/                   auth, restaurants, orders, reviews, admin, payments, favorites, index
│       ├── scripts/seed.js           Idempotent demo-data seeder
│       └── tests/                    Vitest + Supertest, mongodb-memory-server
│
├── e2e/                              Playwright specs (login, checkout) — run against a live stack
├── .github/workflows/ci.yml          Backend tests + client lint/build on push/PR to main
├── README.md / ARCHITECTURE.md       Shorter companion docs — this file is the comprehensive one
```
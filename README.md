# Cravo — Food Delivery App

A full-stack food delivery app — browse restaurants, customize and order food, track delivery status, and manage everything through an admin panel. Built as a skills-building project with a real client-server architecture (not a frontend-only mock).

## Tech Stack

**Frontend** (`/`)
- **React 19 + Vite** — app shell and dev server
- **Tailwind CSS v4** — dark navy/gold theme, with a light mode toggle
- **TanStack Query** — server-state fetching/caching against the API
- **Zustand** (persisted) — cart, auth, favorites, and delivery location, kept in `localStorage`
- **React Router** — routing, with lazy-loaded pages and a path-keyed error boundary
- **Axios** — API client, with automatic access-token attachment and silent token refresh

**Backend** (`/cravo-server`)
- **Express 5** — REST API
- **MongoDB + Mongoose** — persistence
- **JWT auth** — short-lived (15 min) access tokens + long-lived (30 day) httpOnly refresh-token cookies
- **Zod** — request validation on every mutating route
- **bcryptjs** — password hashing
- **express-rate-limit** — throttling on auth endpoints
- **Vitest + Supertest + mongodb-memory-server** — backend test suite

## Getting Started

You need two terminals — one for the API, one for the frontend — plus a local MongoDB instance running.

**1. Backend**
```bash
cd cravo-server
npm install
npm run dev
```
Runs on `http://localhost:5000`. Requires a `.env` file (see below).

**2. Frontend**
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`. Requires a `.env` file with `VITE_API_URL=http://localhost:5000/api`.

### Environment variables

`cravo-server/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cravo
JWT_SECRET=<a long random string>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<a different long random string>
REFRESH_TOKEN_EXPIRES_IN=30d
CLIENT_ORIGIN=http://localhost:5173
```

`/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Seeding data

```bash
cd cravo-server
npm run seed
```
Populates restaurants, menu items, and one admin account.

## Demo Admin Account

- **Email:** `admin@cravo.com`
- **Password:** `admin123`

Sign up your own regular account from the Sign Up page with any email/password that doesn't already exist.

## What You Can Do

- Browse restaurants — search, filter by cuisine, sort by rating/name
- Set a delivery location (popular area pills or type your own)
- View a restaurant's menu, customize an item (variants, notes, quantity), add to cart
- Manage your cart in the slide-out drawer; guest cart merges into your account cart on login
- Sign up / log in with real JWT-based auth (short-lived access token + auto-refreshing session)
- Mark restaurants as favorites (requires login)
- Leave a rating and review on a restaurant — the restaurant's average rating recalculates live (requires login)
- Checkout with a mock card form (any correctly-formatted card works, except one deliberate decline case for testing error handling)
- Track your order through a status stepper (Placed → Preparing → On the Way → Delivered), polling live
- View your past orders
- Toggle dark/light mode
- As an admin: manage restaurants and menu items (create/edit/delete), view and update order statuses, and view a read-only list of signed-up users

See `ARCHITECTURE.md` for how it's all wired together under the hood.

## Testing

**Backend** (`cravo-server/`):
```bash
npm test
```
Runs the Vitest suite against an in-memory MongoDB instance — no real DB connection needed.

**End-to-end** (repo root):
```bash
npm run test:e2e
```
Runs Playwright against a live dev server. Requires the API server and MongoDB running with seeded data.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs the backend test suite and a client lint+build check on every push and pull request to `main`.

## Resetting Local Demo State

There's a `reset demo data` link in the bottom-right corner of the screen. It clears your locally-stored login session, cart, and favorites on this device — it does **not** touch restaurants, orders, reviews, or accounts, since those live on the server.
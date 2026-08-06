# Cravo — Full Flow Explanation

This document walks through how every major feature is wired end-to-end: which file calls which, in what order, and why. It's meant as a reference so you (or another dev/AI) can pick up the project without re-deriving the architecture from scratch.

---

## 1. High-level shape

**Frontend** (`cravo/`): React 19 + Vite + Tailwind v4, feature-folder structure under `src/features/<feature>/{components,hooks,services,store}`. Shared cross-feature code lives in `src/shared/`. Global stores that aren't feature-specific (cart location, toasts) live in `src/store/`.

**Backend** (`cravo-server/`): Express 5 + Mongoose (MongoDB), also organized by feature under `src/features/<feature>/{feature.controller.js, feature.validation.js}`, with `src/routes/` holding one route file per feature plus a combined `routes/index.js`, and `src/models/` holding the Mongoose schemas.

Both sides mirror each other's feature names (`orders`, `admin`, `auth`, `restaurants`, `reviews`, `payments`) — if you're looking for how a feature works, check the same-named folder on both sides.

---

## 2. Request plumbing (every API call goes through this)

`src/shared/services/axiosInstance.js` is the single Axios instance every API service file imports. It:
- Attaches `Authorization: Bearer <token>` to every outgoing request, reading the token out of `localStorage['cravo-auth']` (this is where Zustand's `persist` middleware writes the auth store — see §3).
- Sends `withCredentials: true` so the httpOnly refresh-token cookie rides along automatically.
- On a `401` response (and not from an `/auth/*` endpoint, and not already retried), it transparently calls `POST /auth/refresh`, updates the auth store with the new access token, and replays the original request. If refresh also fails, it logs the user out. Concurrent 401s during a refresh are queued (`pendingQueue`) so only one refresh call fires.

On the server, every request passes through `cravo-server/src/app.js`: CORS (restricted to `CLIENT_ORIGIN`), `express.json()`, `cookieParser()`, request logging (`pino` in production, `morgan` in dev), then `app.use('/api', routes)` — `routes` is the combined router from `src/routes/index.js`, which just mounts each feature's route file under its prefix (`/auth`, `/orders`, `/admin`, etc.). Every route ends up wrapped by `asyncHandler` (`src/middleware/asyncHandler.js`) so thrown errors land in the centralized `errorHandler` middleware instead of crashing the process.

---

## 3. Auth flow

**Signup/Login** (`src/features/auth/components/{LoginPage,SignupPage}.jsx` → `authApi.js` → `POST /auth/signup` or `/auth/login`):
- `auth.controller.js` issues two tokens: a short-lived access token (`ACCESS_TOKEN_EXPIRES_IN`, default 15m) returned in the JSON body, and a long-lived refresh token (`REFRESH_TOKEN_EXPIRES_IN`, default 30d) set as an **httpOnly cookie** scoped to `/api/auth`.
- The JSON response (`authResponse()` in `auth.controller.js`) is `{ id, name, email, isAdmin, token }` — the frontend calls `useAuthStore.getState().login(data)` with this, which Zustand persists to `localStorage['cravo-auth']`.

**Every protected request**: `axiosInstance` attaches the access token → server's `protect` middleware (`cravo-server/src/middleware/auth.js`) verifies it with `jwt.verify(token, JWT_SECRET)`, loads the user from Mongo, and attaches it as `req.user`. Missing/expired/malformed tokens each get a distinct error message rather than one generic 401.

**Token refresh**: when the access token expires, the axios 401-interceptor calls `/auth/refresh`, which reads the refresh cookie (not a header), verifies it against `REFRESH_TOKEN_SECRET`, and issues a fresh access token — the user never has to log in again until the refresh token itself expires (30 days).

**Route gating** (frontend): `RequireAuth.jsx` and `RequireAdmin.jsx` wrap route elements in `App.jsx`. Both read `useAuthStore` and redirect to `/login?next=<path>` if not logged in; `RequireAdmin` additionally redirects home if `user.isAdmin` is false. `admin` middleware (`auth.js`, backend) does the equivalent server-side check on admin routes — the frontend gate is UX only, the backend one is the actual enforcement.

**Guest cart → logged-in cart merge**: `useCartStore` (Zustand, persisted to `localStorage['cravo-cart']`) works for guests via a generated `guestId`. On login, if the user has both a current (guest) cart and a previously-saved cart snapshot for their account (`getSnapshotForUser`/`saveSnapshotForUser` in `cartStore.js`), `CartMergeModal.jsx` asks them to keep the current cart, restore the saved one, or merge both (`mergeCart()` — same restaurant only, quantities added together).

---

## 4. Placing an order → tracking it → admin managing it (the core loop, now real-time)

This is the flow the WebSocket work plugged into, so it's worth tracing fully.

1. **Cart → Checkout**: `CheckoutPage.jsx` reads `useCartStore` for items/restaurant, validates the payment form client-side (`formatCardNumber`, `formatExpiry`, digit/date checks), checks `subtotal` against the restaurant's `minOrder`, calls `processPayment()` (`paymentApi.js`, currently a mocked/simulated gateway per `payments.controller.js`), then on success calls `placeOrder()` (`orderApi.js` → `POST /orders`).

2. **Backend re-prices everything**: `orders.controller.js`'s `placeOrder` never trusts the client's cart prices — it re-fetches every `MenuItem` from Mongo, re-applies variant price modifiers, recomputes `subtotal`/`deliveryFee`/`total`, and re-validates against `restaurant.minOrder`. The order is created with `userId: req.user._id` (from the verified JWT, never the request body) and `status: 'placed'`. **New:** right after creation, it emits `admin:orderCreated` to the `admin` socket room so the admin dashboard sees new orders appear live.

3. **Order confirmation → tracking**: the frontend navigates to `/order-confirmation/:orderId` then the user can go to `/order-tracking/:orderId` (`OrderTrackingPage.jsx`), which calls `useOrderTracking(orderId)` (`useOrders.js`). This hook does two things: a React Query fetch (`getOrderById`) with a **30s poll as a fallback**, and a `socket.on('order:updated', ...)` listener that calls `queryClient.setQueryData(['order', orderId], updatedOrder)` the instant a matching update arrives — no wait for the poll.

4. **Admin changes status**: `/admin` → Orders tab (`AdminOrdersTab.jsx`) shows a dropdown per order limited to exactly two options — the current status and `getNextStatus(order.status)` (computed from the fixed sequence `['placed', 'preparing', 'on the way', 'delivered']` in `orderStatuses.js`). This makes it structurally impossible to pick an out-of-order status from the UI.

5. **Backend enforces the same rule independently**: `admin.controller.js`'s `updateOrderStatus` looks up both statuses' index in `ORDER_STATUSES` and rejects (400) any update where `nextIndex !== currentIndex + 1` — so even a direct API call (Postman, a modified frontend, etc.) can't skip or reverse steps. Once `status === 'delivered'`, it's permanently locked (checked before the sequence check).

6. **The real-time push**: after `order.save()` succeeds, the controller calls `getIO()` (from `cravo-server/src/socket/index.js`) and emits:
   - `order:updated` → to room `user:{order.userId}` — reaches that specific customer's tracking page and order history.
   - `admin:orderUpdated` → to room `admin` — reaches every connected admin's dashboard, which invalidates the `admin-orders` query (`useAdmin.js`) to refetch.

7. **How rooms get populated**: `cravo-server/src/socket/index.js`'s `io.use()` middleware authenticates every socket handshake with the same JWT the REST API uses (`socket.handshake.auth.token`), attaches the verified user, then on `connection` joins `user:{user._id}` always, and additionally `admin` if `user.isAdmin`. On the frontend, `src/shared/services/socket.js` connects **eagerly at module load** (reading the token straight out of `localStorage['cravo-auth']`, same as `axiosInstance` does) so the socket exists before any page component's effects run — this was the fix for an earlier race where a page's listener could attach to a socket instance that got torn down and replaced. `useSocketConnection.js` (called once, from `App.jsx`) keeps the socket in sync with login/logout by reacting to `useAuthStore`'s token.

8. **A serialization gotcha worth remembering**: `Order.js`'s schema strips `_id` in `toJSON()` (`delete ret._id`) and relies on Mongoose's `id` virtual instead — this is why every place that identifies an order by ID (`OrderTrackingPage.jsx`, the socket listener, `AdminOrdersTab.jsx`) compares against `order.id`, never `order._id`. Mixing the two silently breaks comparisons since sockets serialize through the same `toJSON()`.

---

## 5. Other features (brief, since they're stable and less interconnected)

- **Reviews**: `ReviewsSection.jsx` embedded at the bottom of `RestaurantDetailPage.jsx`; auth-gated the same way the favorite-heart button is (redirect to `/login` with `state: { from: location.pathname }`). Seeded reviews have `userId: null` and restaurant ratings are static — not recalculated from live review data.
- **Favorites (now server-synced)**: no longer a Zustand/localStorage-only feature. `favoritesApi.js` calls `GET/POST/DELETE /api/favorites`, backed by `favorites.controller.js` and the `Favorite` model (unique compound index on `userId`+`restaurantId`). `useFavorites.js`'s `useToggleFavorite` mutation does an optimistic update (flips the heart instantly via `queryClient.setQueryData`) and rolls back on error. Favorites now follow the account across devices/browsers instead of living in one browser's `localStorage`.
- **Order cancellation**: `PATCH /api/orders/:id/cancel` (`cancelOrder` in `orders.controller.js`). A regular user can only cancel while the order is still `placed` (before the restaurant starts cooking); an admin can cancel at any stage up to `delivered`. Either way it's blocked once the order is already `delivered` or `cancelled`. On success it emits the same `order:updated` / `admin:orderUpdated` socket pair as a normal status change, so cancellation shows up live on the tracking page and admin dashboard too. `Order.status` now has five values: `placed`, `preparing`, `on the way`, `delivered`, `cancelled` — the admin dropdown's forward-only sequence (§4 above) only walks the first four; `cancelled` is a separate, user/admin-triggered branch, not part of that sequence.
- **Admin panel** (`AdminPage.jsx` and its tabs): Restaurants/Menu Items/Users/Orders, each with its own hook block in `useAdmin.js`, all backed by `admin.controller.js` + `admin.routes.js`, gated by `RequireAdmin` (frontend) and the `admin` middleware (backend).
- **Error handling (frontend)**: `App.jsx` wraps the routed page in `<ErrorBoundary key={location.pathname}>` — keying by pathname means navigating to a *different* route after a crash remounts the boundary fresh instead of staying stuck in the caught-error state.
- **Demo data reset**: `ResetDemoDataLink.jsx`, a barely-visible bottom-right corner link, opens a `ConfirmDialog` before calling `resetDemoData()` — clears local auth/cart/favorites only, never touches server data (restaurants, orders, reviews, accounts).
- **Delivery address**: `AddressModal.jsx` offers a fixed list of popular Lahore-area pills (`POPULAR_AREAS`) plus a free-text field, feeding into `locationStore.js`.

---

## 6. Where things live, at a glance

| Concern | Frontend | Backend |
|---|---|---|
| Auth | `features/auth/` | `features/auth/`, `middleware/auth.js` |
| Orders + tracking | `features/orders/` | `features/orders/`, `models/Order.js` |
| Admin | `features/admin/` | `features/admin/`, `routes/admin.routes.js` |
| Real-time | `shared/services/socket.js`, `shared/hooks/useSocketConnection.js` | `socket/index.js` |
| Cross-cutting API plumbing | `shared/services/axiosInstance.js` | `app.js`, `middleware/asyncHandler.js`, `middleware/errorHandler.js` |

---

*Generated as a session handoff doc — if you're a different AI/dev picking this up, the fastest way to verify anything here still holds is to re-check the file it names against the current codebase before trusting it blindly, since this reflects the state as of the WebSockets + order-status-sequencing work.*
import ErrorBoundary from './shared/components/ErrorBoundary.jsx'
import { lazy, Suspense } from 'react'
import Navbar from './shared/components/Navbar.jsx'
import RequireAuth from './shared/components/RequireAuth.jsx'
import ToastContainer from './shared/components/Toast.jsx'  
import RequireAdmin from './shared/components/RequireAdmin.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import ResetDemoDataLink from './shared/components/ResetDemoDataLink.jsx'
import logo from './assets/images/logo.png'
import Footer from './shared/components/Footer.jsx'
import { useSocketConnection } from './shared/hooks/useSocketConnection.js'

const RestaurantListPage = lazy(() => import('./features/restaurants/components/RestaurantListPage.jsx'))
const RestaurantDetailPage = lazy(() => import('./features/restaurants/components/RestaurantDetailPage.jsx'))
const LoginPage = lazy(() => import('./features/auth/components/LoginPage.jsx'))
const SignupPage = lazy(() => import('./features/auth/components/SignupPage.jsx'))
const FavoritesPage = lazy(() => import('./features/favorites/components/FavoritesPage.jsx'))
const CheckoutPage = lazy(() => import('./features/checkout/components/CheckoutPage.jsx'))
const OrderConfirmationPage = lazy(() => import('./features/orders/components/OrderConfirmationPage.jsx'))
const OrderTrackingPage = lazy(() => import('./features/orders/components/OrderTrackingPage.jsx'))
const OrderHistoryPage = lazy(() => import('./features/orders/components/OrderHistoryPage.jsx'))
const AdminPage = lazy(() => import('./features/admin/components/AdminPage.jsx'))

function App() {
  const location = useLocation()
  useSocketConnection()
  
  return (
    <div className="bg-charcoal min-h-screen text-offwhite font-body">
      <Navbar />
      <ToastContainer />
      <ResetDemoDataLink />
      <ErrorBoundary key={location.pathname}>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-24">
              <img src={logo} alt="Cravo" className="h-20 w-auto animate-pulse" />
              <p className="text-warmGray text-sm mt-4">Loading...</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<RestaurantListPage />} />
            <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/favorites"
              element={
                <RequireAuth>
                  <FavoritesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/order-confirmation/:orderId"
              element={
                <RequireAuth>
                  <OrderConfirmationPage />
                </RequireAuth>
              }
            />
            <Route
              path="/order-tracking/:orderId"
              element={
                <RequireAuth>
                  <OrderTrackingPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireAuth>
                  <OrderHistoryPage />
                </RequireAuth>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </div>
  )
}
export default App
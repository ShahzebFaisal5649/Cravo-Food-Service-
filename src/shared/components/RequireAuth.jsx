import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

export default function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}
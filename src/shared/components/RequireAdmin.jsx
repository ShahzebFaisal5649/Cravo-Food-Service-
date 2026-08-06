import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

export default function RequireAdmin({ children }) {
  const { isLoggedIn, user } = useAuthStore()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!user.isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
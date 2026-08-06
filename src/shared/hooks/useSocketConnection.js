import { useEffect } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { connectSocket, disconnectSocket } from '../services/socket'

export function useSocketConnection() {
  const token = useAuthStore((state) => state.user?.token)

  useEffect(() => {
    if (!token) {
      disconnectSocket()
      return
    }
    connectSocket(token)
  }, [token])
}
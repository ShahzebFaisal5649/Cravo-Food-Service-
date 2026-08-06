import { io } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

function readStoredToken() {
  try {
    const raw = localStorage.getItem('cravo-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.user?.token || null
  } catch {
    return null
  }
}

let socket = null

export function connectSocket(token) {
  // Reuse the existing socket as long as it's for the same token — don't tear it
  // down just because it hasn't finished handshaking yet (StrictMode double-invokes
  // this in dev and would otherwise kill a socket mid-connect and orphan listeners).
  if (socket && socket.auth?.token === token) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

const initialToken = readStoredToken()
if (initialToken) {
  connectSocket(initialToken)
}
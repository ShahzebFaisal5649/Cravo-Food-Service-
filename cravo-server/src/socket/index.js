import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

let io

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  // Auth every socket connection the same way the REST API does — a valid JWT is required.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) {
        return next(new Error('Not authorized, no token'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (!user) {
        return next(new Error('Not authorized, user not found'))
      }

      socket.user = user
      next()
    } catch (err) {
      next(new Error('Not authorized, token failed'))
    }
  })

  io.on('connection', (socket) => {
    const { user } = socket

    // Every user gets their own room so we can push order updates straight to them.
    socket.join(`user:${user._id}`)

    if (user.isAdmin) {
      socket.join('admin')
    }
  })

  return io
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized — call initSocket(server) first')
  }
  return io
}
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

    if (user.isAdmin) {
      socket.join('admin')
    }

    socket.join(`user:${user._id}`)
  })

  return io
}

export function getIO() {
  return io
}

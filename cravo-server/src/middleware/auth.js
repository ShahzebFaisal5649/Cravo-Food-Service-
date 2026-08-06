import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { asyncHandler } from './asyncHandler.js'

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }

  const token = authHeader.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    res.status(401)
    if (err.name === 'TokenExpiredError') {
      throw new Error('Session expired, please log in again')
    }
    throw new Error('Not authorized, token failed')
  }

  const user = await User.findById(decoded.id).select('-password')
  if (!user) {
    res.status(401)
    throw new Error('Not authorized, user not found')
  }

  req.user = user
  next()
})

export function admin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  res.status(403)
  throw new Error('Not authorized as admin')
}
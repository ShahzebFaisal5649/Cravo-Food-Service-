import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'

function getJwtSecret() {
  return process.env.JWT_SECRET || 'test_secret_key'
}

function getRefreshTokenSecret() {
  return process.env.REFRESH_TOKEN_SECRET || getJwtSecret()
}

function generateAccessToken(id) {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  })
}

function generateRefreshToken(id) {
  return jwt.sign({ id }, getRefreshTokenSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  })
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

function authResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateAccessToken(user._id),
  }
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!email || !password || !name) {
    res.status(400)
    throw new Error('Please fill in all required fields.')
  }

  const cleanEmail = email.trim().toLowerCase()

  const existing = await User.findOne({ email: cleanEmail })

  if (existing) {
    res.status(409)
    throw new Error('An account with this email already exists.')
  }

  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password,
  })

  setRefreshCookie(res, generateRefreshToken(user._id))

  res.status(201).json(authResponse(user))
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400)
    throw new Error('Please fill in all required fields.')
  }

  const cleanEmail = email.trim().toLowerCase()

  const user = await User.findOne({ email: cleanEmail })

  if (!user) {
    res.status(404)
    throw new Error('No account found with this email.')
  }

  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    res.status(401)
    throw new Error('Incorrect password.')
  }

  setRefreshCookie(res, generateRefreshToken(user._id))

  res.json(authResponse(user))
})

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    res.status(401)
    throw new Error('No refresh token, please log in again.')
  }

  let decoded

  try {
    decoded = jwt.verify(token, getRefreshTokenSecret())
  } catch {
    res.status(401)
    throw new Error(
      'Refresh token invalid or expired, please log in again.',
    )
  }

  const user = await User.findById(decoded.id)

  if (!user) {
    res.status(401)
    throw new Error(
      'Refresh token invalid or expired, please log in again.',
    )
  }

  res.json(authResponse(user))
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', {
    path: '/api/auth',
  })

  res.json({ message: 'Logged out.' })
})
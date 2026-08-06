import express from 'express'
import { authLimiter } from '../middleware/rateLimiter.js'
import { validate } from '../middleware/validate.js'
import { signupSchema, loginSchema } from '../features/auth/auth.validation.js'
import { signup, login, refresh, logout } from '../features/auth/auth.controller.js'

const router = express.Router()

router.post('/signup', authLimiter, validate(signupSchema), signup)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)

export default router
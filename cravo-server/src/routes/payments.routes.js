import express from 'express'
import { protect } from '../middleware/auth.js'
import { processPayment } from '../features/payments/payments.controller.js'
import { writeLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/', protect, processPayment)
router.post('/', writeLimiter, protect, processPayment)

export default router
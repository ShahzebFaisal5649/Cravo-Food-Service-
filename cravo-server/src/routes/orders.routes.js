import express from 'express'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { placeOrderSchema } from '../features/orders/orders.validation.js'
import { placeOrder, getOrderById, getOrdersByUserId, cancelOrder } from '../features/orders/orders.controller.js'
import { writeLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.get('/:id', protect, getOrderById)
router.get('/user/:userId', protect, getOrdersByUserId)
router.patch('/:id/cancel', protect, cancelOrder)
router.post('/', writeLimiter, protect, validate(placeOrderSchema), placeOrder)

export default router
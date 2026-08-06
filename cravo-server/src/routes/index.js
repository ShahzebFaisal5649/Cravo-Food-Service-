import express from 'express'
import authRoutes from './auth.routes.js'
import restaurantRoutes from './restaurants.routes.js'
import orderRoutes from './orders.routes.js'
import reviewRoutes from './reviews.routes.js'
import adminRoutes from './admin.routes.js'
import paymentRoutes from './payments.routes.js'
import favoritesRoutes from './favorites.routes.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/restaurants', restaurantRoutes)
router.use('/orders', orderRoutes)
router.use('/reviews', reviewRoutes)
router.use('/admin', adminRoutes)
router.use('/payments', paymentRoutes)
router.use('/favorites', favoritesRoutes)

export default router
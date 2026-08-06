import express from 'express'
import { protect } from '../middleware/auth.js'
import { getReviewsByRestaurantId, addReview, deleteReview } from '../features/reviews/reviews.controller.js'

const router = express.Router()

router.get('/restaurant/:id', getReviewsByRestaurantId)
router.post('/', protect, addReview)
router.delete('/:id', protect, deleteReview)

export default router
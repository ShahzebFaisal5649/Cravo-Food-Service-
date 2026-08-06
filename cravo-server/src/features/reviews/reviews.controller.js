import Review from '../../models/Review.js'
import Restaurant from '../../models/Restaurant.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'

async function syncRestaurantRating(restaurantId) {
  const reviews = await Review.find({ restaurantId })
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0
  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: Math.round(average * 10) / 10, // one decimal place
  })
}

export const getReviewsByRestaurantId = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ restaurantId: req.params.id }).sort({ createdAt: -1 })
  res.json(reviews)
})

export const addReview = asyncHandler(async (req, res) => {
  const { restaurantId, rating, comment } = req.body

  const restaurant = await Restaurant.findById(restaurantId)
  if (!restaurant) {
    res.status(404)
    throw new Error('Restaurant not found')
  }

  const existingReview = await Review.findOne({ restaurantId, userId: req.user._id })
  if (existingReview) {
    res.status(409)
    throw new Error('You\'ve already reviewed this restaurant.')
  }

  if (!rating || rating < 1 || rating > 5) {
    res.status(400)
    throw new Error('Please select a rating between 1 and 5.')
  }
  if (!comment || !comment.trim()) {
    res.status(400)
    throw new Error('Please write a short comment.')
  }

  const review = await Review.create({
    restaurantId,
    userId: req.user._id,
    userName: req.user.name,
    rating,
    comment: comment.trim(),
  })

  await syncRestaurantRating(restaurantId)

  res.status(201).json(review)
})

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) {
    res.status(404)
    throw new Error('Review not found')
  }
  if (review.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to delete this review')
  }

  const restaurantId = review.restaurantId
  await review.deleteOne()
  await syncRestaurantRating(restaurantId)

  res.json({ message: 'Review deleted' })
})
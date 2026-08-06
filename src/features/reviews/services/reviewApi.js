import axiosInstance from '../../../shared/services/axiosInstance'

export async function getReviewsByRestaurantId(restaurantId) {
  const { data } = await axiosInstance.get(`/reviews/restaurant/${restaurantId}`)
  return data
}

export async function deleteReview(reviewId) {
  await axiosInstance.delete(`/reviews/${reviewId}`)
  return reviewId
}

export async function addReview({ restaurantId, rating, comment }) {
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Please select a rating between 1 and 5.')
  }
  if (!comment || !comment.trim()) {
    throw new Error('Please write a short comment.')
  }

  const { data } = await axiosInstance.post('/reviews', {
    restaurantId,
    comment: comment.trim(),
    rating,
  })

  return data
}
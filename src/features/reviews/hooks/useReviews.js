import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviewsByRestaurantId, addReview, deleteReview } from '../services/reviewApi'

export function useReviews(restaurantId) {
  return useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => getReviewsByRestaurantId(restaurantId),
    enabled: !!restaurantId,
  })
}

export function useAddReview(restaurantId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', restaurantId] })
    },
  })
}


export function useDeleteReview(restaurantId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', restaurantId] })
    },
  })
}
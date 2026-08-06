import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store/authStore'
import { getMyFavorites, addFavorite, removeFavorite } from '../services/favoritesApi'

export function useFavorites() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getMyFavorites,
    enabled: isLoggedIn, // no point calling this for guests — they'll be routed to login anyway
    initialData: [],
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ restaurantId, isFavorite }) =>
      isFavorite ? removeFavorite(restaurantId) : addFavorite(restaurantId),

    // Optimistic update so the heart icon flips instantly instead of waiting on the round trip.
    onMutate: async ({ restaurantId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData(['favorites']) || []
      const next = isFavorite
        ? previous.filter((id) => id !== restaurantId)
        : [...previous, restaurantId]
      queryClient.setQueryData(['favorites'], next)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['favorites'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
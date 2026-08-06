import { useQuery } from '@tanstack/react-query'
import { getAllRestaurants, getRestaurantById, getMenuItemsByRestaurantId } from '../services/restaurantApi'
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: getAllRestaurants,
  })
}

export function useRestaurant(id) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurantById(id),
    enabled: !!id,
  })
}

export function useMenuItems(restaurantId) {
  return useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: () => getMenuItemsByRestaurantId(restaurantId),
    enabled: !!restaurantId,
  })
}
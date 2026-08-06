import axiosInstance from '../../../shared/services/axiosInstance'

export async function getAllRestaurants() {
  const { data } = await axiosInstance.get('/restaurants')
  return data
}

export async function getRestaurantById(id) {
  const { data } = await axiosInstance.get(`/restaurants/${id}`)
  return data
}

export async function getMenuItemsByRestaurantId(restaurantId) {
  const { data } = await axiosInstance.get(`/restaurants/${restaurantId}/menu`)
  return data
}
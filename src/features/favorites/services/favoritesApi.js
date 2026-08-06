import axiosInstance from '../../../shared/services/axiosInstance'

export async function getMyFavorites() {
  const { data } = await axiosInstance.get('/favorites')
  return data // array of restaurantId strings
}

export async function addFavorite(restaurantId) {
  const { data } = await axiosInstance.post(`/favorites/${restaurantId}`)
  return data
}

export async function removeFavorite(restaurantId) {
  const { data } = await axiosInstance.delete(`/favorites/${restaurantId}`)
  return data
}
import axiosInstance from '../../../shared/services/axiosInstance'

// RESTAURANTS
export async function getAllRestaurantsAdmin({ page = 1, limit = 10 } = {}) {
  const { data } = await axiosInstance.get('/admin/restaurants', { params: { page, limit } })
  return data
}

export async function createRestaurant(data) {
  const { data: responseData } = await axiosInstance.post('/admin/restaurants', data)
  return responseData
}

export async function updateRestaurant(id, data) {
  const { data: responseData } = await axiosInstance.put(`/admin/restaurants/${id}`, data)
  return responseData
}

export async function toggleRestaurantOpen(id, isOpen) {
  const { data } = await axiosInstance.patch(`/admin/restaurants/${id}/toggle-open`, { isOpen })
  return data
}

export async function deleteRestaurant(id) {
  try {
    await axiosInstance.delete(`/admin/restaurants/${id}`)
  } catch (error) {
    if (error.response && error.response.status === 409) {
      throw new Error('Cannot delete this restaurant — it has existing orders.', { cause: error })
    }
    throw error
  }
}

// ORDERS
export async function getAllOrdersAdmin({ page = 1, limit = 10 } = {}) {
  const { data } = await axiosInstance.get('/admin/orders', { params: { page, limit } })
  return data // already sorted newest-first by the server
}

export async function updateOrderStatus(id, status) {
  try {
    const { data } = await axiosInstance.patch(`/admin/orders/${id}/status`, { status })
    return data
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 409)) {
      throw new Error('This order is already delivered and its status is locked.', { cause: error })
    }
    throw error
  }
}

// USERS
export async function getAllUsersAdmin() {
  const { data } = await axiosInstance.get('/admin/users')
  return data.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  }))
}

// MENU ITEMS
export async function getMenuItemsForRestaurant(restaurantId) {
  const { data } = await axiosInstance.get(`/admin/restaurants/${restaurantId}/menu`)
  return data
}

export async function createMenuItem(data) {
  const { data: responseData } = await axiosInstance.post('/admin/menu-items', data)
  return responseData
}

export async function updateMenuItem(id, data) {
  const { data: responseData } = await axiosInstance.put(`/admin/menu-items/${id}`, data)
  return responseData
}

export async function deleteMenuItem(id) {
  await axiosInstance.delete(`/admin/menu-items/${id}`)
}

// ADMIN STATS
export async function getAdminStats() {
  const { data } = await axiosInstance.get('/admin/stats')
  return data
}
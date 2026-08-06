import axiosInstance from '../../../shared/services/axiosInstance'

export async function placeOrder(orderData) {
  const { data } = await axiosInstance.post('/orders', orderData)
  return data
}

export async function getOrderById(id) {
  try {
    const { data } = await axiosInstance.get(`/orders/${id}`)
    return data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Order not found', { cause: error })
    }
    throw error
  }
}

export async function getOrdersByUserId(userId) {
  const { data } = await axiosInstance.get(`/orders/user/${userId}`)
  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function cancelOrder(id) {
  const { data } = await axiosInstance.patch(`/orders/${id}/cancel`)
  return data
}
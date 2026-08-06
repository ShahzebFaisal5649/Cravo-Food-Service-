import axiosInstance from '../../../shared/services/axiosInstance'

export async function processPayment(cardDetails) {
  try {
    const { data } = await axiosInstance.post('/payments', cardDetails)
    return data
  } catch (error) {
    if (error.response && (error.response.status === 402 || error.response.status === 400)) {
      throw new Error('Card declined. Please try a different card.', { cause: error })
    }
    throw error
  }
}
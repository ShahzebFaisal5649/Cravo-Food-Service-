import { asyncHandler } from '../../middleware/asyncHandler.js'

// Same demo cards mentioned on the Checkout page UI
const DECLINED_CARD_NUMBERS = ['4000000000000002']

export const processPayment = asyncHandler(async (req, res) => {
  const { cardNumber, expiry, cvv } = req.body

  if (!cardNumber || !expiry || !cvv) {
    res.status(400)
    throw new Error('Card details are incomplete.')
  }

  const digitsOnly = String(cardNumber).replace(/\s/g, '')

  if (digitsOnly.length !== 16) {
    res.status(400)
    throw new Error('Card number must be 16 digits.')
  }

  if (DECLINED_CARD_NUMBERS.includes(digitsOnly)) {
    res.status(402)
    throw new Error('Card declined. Please try a different card.')
  }

  // Simulated gateway success (mirrors your old mock-backend behavior)
  res.status(200).json({
    success: true,
    transactionId: 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
  })
})
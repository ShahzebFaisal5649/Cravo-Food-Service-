import Favorite from '../../models/Favorite.js'
import Restaurant from '../../models/Restaurant.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'

// Returns just an array of restaurantId strings — the frontend only needs to know which IDs are favorited.
export const getMyFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user._id }).select('restaurantId')
  res.json(favorites.map((f) => f.restaurantId.toString()))
})

export const addFavorite = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params

  const restaurant = await Restaurant.findById(restaurantId)
  if (!restaurant) {
    res.status(404)
    throw new Error('Restaurant not found')
  }

  try {
    await Favorite.create({ userId: req.user._id, restaurantId })
  } catch (err) {
    // Unique index (userId, restaurantId) — already favorited, treat as a no-op success.
    if (err.code !== 11000) throw err
  }

  res.status(201).json({ restaurantId })
})

export const removeFavorite = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params
  await Favorite.deleteOne({ userId: req.user._id, restaurantId })
  res.json({ restaurantId })
})
import Restaurant from '../../models/Restaurant.js'
import MenuItem from '../../models/MenuItem.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'

export const getAllRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find()
  res.json(restaurants)
})

export const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id)
  if (!restaurant) {
    res.status(404)
    throw new Error('Restaurant not found')
  }
  res.json(restaurant)
})

export const getMenuItemsByRestaurantId = asyncHandler(async (req, res) => {
  const menuItems = await MenuItem.find({ restaurantId: req.params.id })
  res.json(menuItems)
})
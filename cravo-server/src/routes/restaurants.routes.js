import express from 'express'
import {
  getAllRestaurants,
  getRestaurantById,
  getMenuItemsByRestaurantId,
} from '../features/restaurants/restaurants.controller.js'

const router = express.Router()

router.get('/', getAllRestaurants)
router.get('/:id', getRestaurantById)
router.get('/:id/menu', getMenuItemsByRestaurantId)

export default router
import express from 'express'
import { protect, admin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  restaurantSchema,
  restaurantUpdateSchema,
  toggleOpenSchema,
  orderStatusSchema,
} from '../features/admin/admin.validation.js'
import {
  menuItemSchema,
  menuItemUpdateSchema,
} from '../features/menuItems/menuItems.validation.js'
import {
  getAllRestaurantsAdmin,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantOpen,
  deleteRestaurant,
  getAllOrdersAdmin,
  updateOrderStatus,
  getAllUsersAdmin,
  getAdminStats,
  getMenuItemsForRestaurant,
} from '../features/admin/admin.controller.js'
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../features/menuItems/menuItems.controller.js'

const router = express.Router()

router.use(protect, admin) // every route below requires an admin

// restaurants
router.get('/restaurants', getAllRestaurantsAdmin)
router.post('/restaurants', validate(restaurantSchema), createRestaurant)
router.put('/restaurants/:id', validate(restaurantUpdateSchema), updateRestaurant)
router.patch('/restaurants/:id/toggle-open', validate(toggleOpenSchema), toggleRestaurantOpen)
router.delete('/restaurants/:id', deleteRestaurant)

// orders
router.get('/orders', getAllOrdersAdmin)
router.patch('/orders/:id/status', validate(orderStatusSchema), updateOrderStatus)

// stats
router.get('/stats', getAdminStats)

// users
router.get('/users', getAllUsersAdmin)

// menu items
router.get('/restaurants/:restaurantId/menu', getMenuItemsForRestaurant)
router.post('/menu-items', validate(menuItemSchema), createMenuItem)
router.put('/menu-items/:id', validate(menuItemUpdateSchema), updateMenuItem)
router.delete('/menu-items/:id', deleteMenuItem)

 // restaurants
 router.get('/restaurants', getAllRestaurantsAdmin)
 
export default router
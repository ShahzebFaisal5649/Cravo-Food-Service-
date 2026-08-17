import Restaurant from '../../models/Restaurant.js'
import Order from '../../models/Order.js'
import User from '../../models/User.js'
import MenuItem from '../../models/MenuItem.js'
import Review from '../../models/Review.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { getIO } from '../../socket/index.js'

const ORDER_STATUSES = ['placed', 'preparing', 'on the way', 'delivered']
// RESTAURANTS
export const getAllRestaurantsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const skip = (page - 1) * limit

  const [restaurants, totalCount] = await Promise.all([
    Restaurant.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(),
  ])

  res.json({
    items: restaurants,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    totalCount,
  })
})

export const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create(req.body)
  res.status(201).json(restaurant)
})

export const updateRestaurant = asyncHandler(async (req, res) => {
  const existing = await Restaurant.findById(req.params.id)
  if (!existing) {
    res.status(404)
    throw new Error('Restaurant not found')
  }

  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  // Keep every past AND future order's snapshotted name in sync with the restaurant.
  if (req.body.name && req.body.name !== existing.name) {
    await Order.updateMany(
      { restaurantId: restaurant._id },
      { restaurantName: restaurant.name }
    )
  }

  res.json(restaurant)
})

export const toggleRestaurantOpen = asyncHandler(async (req, res) => {
  const { isOpen } = req.body
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { isOpen },
    { new: true }
  )
  if (!restaurant) {
    res.status(404)
    throw new Error('Restaurant not found')
  }
  res.json(restaurant)
})

export const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurantId = req.params.id

  // Orders already store their own snapshot of the restaurant name & item prices,
  // so it's safe to delete the restaurant even if it has order history.
  await MenuItem.deleteMany({ restaurantId })
  await Review.deleteMany({ restaurantId })
  await Restaurant.findByIdAndDelete(restaurantId)

  res.json({ message: 'Restaurant deleted' })
})

// ORDERS
export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const skip = (page - 1) * limit

  const [orders, totalCount] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(),
  ])

  res.json({
    items: orders,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    totalCount,
  })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }
  if (order.status === 'delivered') {
    res.status(400)
    throw new Error('This order is already delivered and its status is locked.')
  }
  if (order.status === 'cancelled') {
    res.status(400)
    throw new Error('This order was cancelled and its status is locked.')
  }

  const currentIndex = ORDER_STATUSES.indexOf(order.status)
  const nextIndex = ORDER_STATUSES.indexOf(status)

  if (nextIndex !== currentIndex + 1) {
    res.status(400)
    throw new Error(
      `Orders must move through statuses in order. Next valid status is "${ORDER_STATUSES[currentIndex + 1]}".`
    )
  }

  order.status = status
  await order.save()

  getIO()?.to(`user:${order.userId}`).emit('order:updated', order)
  getIO()?.to('admin').emit('admin:orderUpdated', order)

  res.json(order)
})

// USERS
export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password')
  res.json(users)
})

// MENU ITEMS (admin-scoped, per restaurant)
export const getMenuItemsForRestaurant = asyncHandler(async (req, res) => {
  const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId })
  res.json(menuItems)
})

export const getAdminStats = asyncHandler(async (req, res) => {
  const [restaurantCount, orderCount, userCount, revenueResult] = await Promise.all([
    Restaurant.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } }, // cancelled orders shouldn't count as revenue
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ])

  res.json({
    restaurantCount,
    orderCount,
    userCount,
    totalRevenue: revenueResult[0]?.total || 0,
  })
})

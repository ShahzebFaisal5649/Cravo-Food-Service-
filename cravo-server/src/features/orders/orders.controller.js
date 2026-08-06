import Order from '../../models/Order.js'
import MenuItem from '../../models/MenuItem.js'
import Restaurant from '../../models/Restaurant.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { getIO } from '../../socket/index.js'

export const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items, deliveryAddress } = req.body

  if (!restaurantId) {
    res.status(400)
    throw new Error('restaurantId is required')
  }

  const restaurant = await Restaurant.findById(restaurantId)
  if (!restaurant) {
    res.status(404)
    throw new Error('Restaurant not found')
  }

  const cartItems = Array.isArray(items) ? items : []

  // Re-price every line item from the database. The client's price/subtotal/total
  // are never trusted — they're recomputed here from MenuItem.price + variant.priceModifier.
  const pricedItems = await Promise.all(
    cartItems.map(async (line) => {
      const menuItem = await MenuItem.findById(line.itemId)
      if (!menuItem || menuItem.restaurantId.toString() !== restaurantId) {
        res.status(400)
        throw new Error(`Invalid menu item in cart: ${line.name || line.itemId}`)
      }

      let unitPrice = menuItem.price
      if (line.variant) {
        const variant = menuItem.variants.find((v) => v.name === line.variant)
        if (!variant) {
          res.status(400)
          throw new Error(`Invalid variant "${line.variant}" for ${menuItem.name}`)
        }
        unitPrice += variant.priceModifier
      }

      const quantity = Number(line.quantity) > 0 ? Math.floor(Number(line.quantity)) : 1

      return {
        itemId: menuItem.id,
        variant: line.variant || undefined,
        name: menuItem.name,
        price: unitPrice,
        quantity,
        notes: line.notes ? line.notes.trim() : undefined,
      }
    })
  )

  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = restaurant.deliveryFee || 0
  const total = subtotal + deliveryFee

  if (subtotal < (restaurant.minOrder || 0)) {
    res.status(400)
    throw new Error(`Minimum order for ${restaurant.name} is Rs. ${restaurant.minOrder}.`)
  }

  const order = await Order.create({
    userId: req.user._id, // always from the verified token — never from the client body
    restaurantId,
    restaurantName: restaurant.name, // always trust the DB, never the client's cached cart value
    items: pricedItems,
    subtotal,
    deliveryFee,
    total,
    deliveryAddress,
    status: 'placed',
  })

  getIO().to('admin').emit('admin:orderCreated', order)

  res.status(201).json(order)
})

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }
  if (order.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to view this order')
  }
  res.json(order)
})

export const getOrdersByUserId = asyncHandler(async (req, res) => {
  if (req.params.userId !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to view these orders')
  }
  const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })
  res.json(orders)
})

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }
  if (order.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to cancel this order')
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    res.status(400)
    throw new Error(`This order is already ${order.status} and can't be cancelled.`)
  }

  // Customers can only back out before the restaurant starts cooking.
  // Admins can cancel at any stage up to delivery.
  if (!req.user.isAdmin && order.status !== 'placed') {
    res.status(400)
    throw new Error('Only orders that haven\'t started preparing yet can be cancelled.')
  }

  order.status = 'cancelled'
  await order.save()

  getIO().to(`user:${order.userId}`).emit('order:updated', order)
  getIO().to('admin').emit('admin:orderUpdated', order)

  res.json(order)
})
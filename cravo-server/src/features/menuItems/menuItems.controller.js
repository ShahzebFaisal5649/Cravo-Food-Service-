import MenuItem from '../../models/MenuItem.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'

export const createMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.create(req.body)
  res.status(201).json(menuItem)
})

export const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!menuItem) {
    res.status(404)
    throw new Error('Menu item not found')
  }
  res.json(menuItem)
})

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id)
  if (!menuItem) {
    res.status(404)
    throw new Error('Menu item not found')
  }
  res.json({ message: 'Menu item deleted' })
})
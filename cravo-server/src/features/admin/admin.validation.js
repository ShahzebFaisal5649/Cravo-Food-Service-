import { z } from 'zod'

export const restaurantSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  cuisine: z.string().trim().min(1, 'Cuisine is required'),
  isOpen: z.boolean().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  address: z.string().trim().optional(),
  rating: z.number().min(0).max(5).optional(),
  deliveryTime: z.string().optional(),
  minOrder: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
})

export const restaurantUpdateSchema = restaurantSchema.partial()

export const toggleOpenSchema = z.object({
  isOpen: z.boolean(),
})

export const orderStatusSchema = z.object({
  status: z.enum(['placed', 'preparing', 'on the way', 'delivered']),
})
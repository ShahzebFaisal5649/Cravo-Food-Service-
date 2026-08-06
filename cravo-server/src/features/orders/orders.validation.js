import { z } from 'zod'

const orderItemSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
  variant: z.string().nullable().optional(),
  quantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

export const placeOrderSchema = z.object({
  restaurantId: z.string().min(1, 'restaurantId is required'),
  items: z.array(orderItemSchema).optional().default([]),
  deliveryAddress: z.string().optional(),
})